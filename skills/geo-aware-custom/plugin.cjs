/**
 * ============================================================
 *  🌍 Geo Aware Plugin — ClawPet 内置地理位置与天气 Skill
 * ============================================================
 *
 *  演示能力：
 *    - 插件生命周期：activate() / deactivate()
 *    - IPC 通信（registerIpcHandler）
 *    - 独立 UI 窗口管理
 *    - 桌面宠物气泡消息（天气简报）
 *    - HTTP 网络请求（IP 定位 + 天气 API）
 *    - 文件持久化（位置缓存 / 天气缓存）
 *    - 托盘菜单集成
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ─── 常量配置 ───────────────────────────────────────

const CACHE_DIR = 'geo-cache';
const LOCATION_CACHE_FILE = 'location.json';
const WEATHER_CACHE_FILE = 'weather.json';

// 缓存有效期（毫秒）
const LOCATION_CACHE_TTL = 60 * 60 * 1000;      // 1 小时
const WEATHER_CACHE_TTL = 10 * 60 * 1000;         // 10 分钟

// ─── HTTP 请求工具 ─────────────────────────────────

/**
 * 发起 GET 请求，返回 JSON
 */
function httpGet(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { timeout }, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return httpGet(res.headers.location, timeout).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Invalid JSON from ${url}: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout: ${url}`));
    });
  });
}

// ─── IP 定位引擎 ───────────────────────────────────

/**
 * 通过公网 API 获取出口 IP 的地理位置
 *
 * 使用多源 fallback 策略：
 *   1. ip-api.com (免费, 无需 key, 中文支持好)
 *   2. ip-api.co (备用域名，同一服务)
 */
const IP_API_SOURCES = [
  // Source 1: ip-api.com (HTTP)
  {
    name: 'ip-api.com',
    buildUrl: (ip) => ip
      ? `http://ip-api.com/json/${ip}?lang=zh-CN&fields=status,message,country,regionName,city,lat,lon,timezone,query`
      : `http://ip-api.com/json/?lang=zh-CN&fields=status,message,country,regionName,city,lat,lon,timezone,query`,
    parse: (data) => ({
      ip: data.query,
      city: data.city || '未知',
      region: data.regionName || '',
      country: data.country || '',
      lat: data.lat || 0,
      lon: data.lon || 0,
      timezone: data.timezone || '',
    }),
    validate: (data) => data.status === 'success',
  },
];

async function fetchLocationByIP(ip) {
  let lastError = null;

  for (const source of IP_API_SOURCES) {
    try {
      const url = source.buildUrl(ip);
      const data = await httpGet(url);

      if (!source.validate(data)) {
        lastError = new Error(data.message || `${source.name} returned non-success`);
        continue;
      }

      const loc = source.parse(data);
      loc.display = formatLocationDisplay(loc);
      loc.timestamp = Date.now();
      return loc;

    } catch (err) {
      lastError = err;
      console.warn(`[GeoAware] ${source.name} failed: ${err.message}`);
      continue;
    }
  }

  throw new Error(`所有 IP 定位源均不可用。最后错误：${lastError?.message || '未知'}`);
}

function formatLocationDisplay(loc) {
  return `📍 当前位置：${loc.city}，${loc.region}，${loc.country}（${parseFloat(loc.lat).toFixed(2)}°N, ${parseFloat(loc.lon).toFixed(2)}°E）`;
}

// ─── 天气查询引擎 ─────────────────────────────────

/**
 * 天气代码 → 图标/描述映射
 */
const WEATHER_MAP = {
  200: { icon: '⛈️', text: '雷暴伴阵雨', level: 'warning' },
  201: { icon: '🌩️', text: '雷暴伴小雨', level: 'warning' },
  202: { icon: '⛈️', text: '雷暴伴大雨', level: 'danger' },
  210: { icon: '🌩️', text: '轻雷暴', level: 'normal' },
  211: { icon: '⛈️', text: '雷暴', level: 'warning' },
  212: { icon: '⛈️', text: '强雷暴', level: 'danger' },
  221: { icon: '⛈️', text: '剧烈雷暴', level: 'danger' },
  230: { icon: '⛈️', text: '雷阵雪', level: 'danger' },
  231: { icon: '⛈️', text: '雷阵雪伴小雪', level: 'danger' },
  232: { icon: '⛈️', text: '雷阵雪伴大雪', level: 'danger' },
  300: { icon: '🌦️', text: '毛毛雨', level: 'normal' },
  301: { icon: '🌧️', text: '小毛毛雨', level: 'normal' },
  302: { icon: '🌧️', text: '中毛毛雨', level: 'normal' },
  310: { icon: '🌦️', text: '小雨伴雾', level: 'normal' },
  311: { icon: '🌧️', text: '小阵雨/毛毛雨', level: 'normal' },
  312: { icon: '🌧️', text: '中阵雨/毛毛雨', level: 'normal' },
  313: { icon: '🌧️', text: '大阵雨/毛毛雨', level: 'rainy' },
  314: { icon: '🌧️', text: '强阵雨/冰雹', level: 'danger' },
  321: { icon: '🌧️', text: '阵雨毛毛雨', level: 'normal' },
  500: { icon: '🌦️', text: '小雨', level: 'normal' },
  501: { icon: '🌧️', text: '中雨', level: 'rainy' },
  502: { icon: '🌧️', text: '大雨', level: 'rainy' },
  503: { icon: '🌧️', text: '极大雨', level: 'danger' },
  504: { icon: '🌧️', text: '极端降雨', level: 'danger' },
  511: { icon: '🌨️', text: '冻雨', level: 'danger' },
  520: { icon: '🌦️', text: '小阵雨', level: 'normal' },
  521: { icon: '🌧️', text: '阵雨', level: 'rainy' },
  522: { icon: '🌧️', text: '大阵雨', level: 'rainy' },
  531: { icon: '🌧️', text: '不规则阵雨', level: 'rainy' },
  600: { icon: '🌨️', text: '小雪', level: 'normal' },
  601: { icon: '❄️', text: '中雪', level: 'snowy' },
  602: { icon: '❄️', text: '大雪', level: 'snowy' },
  611: { icon: '🌨️', text: '霰', level: 'snowy' },
  612: { icon: '🌨️', text: '阵霰', level: 'snowy' },
  613: { icon: '🌨️', text: '阵霰', level: 'snowy' },
  615: { icon: '🌨️', text: '小雨夹雪', level: 'snowy' },
  616: { icon: '❄️', text: '雨夹雪', level: 'snowy' },
  620: { icon: '🌨️', text: '小阵雪', level: 'normal' },
  621: { icon: '❄️', text: '阵雪', level: 'snowy' },
  622: { icon: '❄️', text: '大阵雪', level: 'snowy' },
  701: { icon: '🌫️', text: '雾', level: 'normal' },
  711: { icon: '🌫️', text: '烟雾', level: 'warning' },
  721: { icon: '🌫️', text: '薄雾', level: 'normal' },
  731: { icon: '🌪️', text: '沙尘', level: 'warning' },
  741: { icon: '🌫️', text: '大雾', level: 'warning' },
  751: { icon: '🌪️', text: '沙尘', level: 'danger' },
  761: { icon: '🌪️', text: '扬沙', level: 'danger' },
  762: { icon: '🌋', text: '火山灰', level: 'danger' },
  771: { icon: '💨', text: '大风', level: 'warning' },
  781: { icon: '🌪️', text: '龙卷风', level: 'danger' },
  800: { icon: '☀️', text: '晴', level: 'sunny' },
  801: { icon: '🌤️', text: '少云', level: 'normal' },
  802: { icon: '⛅', text: '多云', level: 'normal' },
  803: { icon: '☁️', text: '阴天多云', level: 'normal' },
  804: { icon: '☁️', text: '阴天', level: 'normal' },
};

/**
 * 风向角度 → 方位文字
 */
function windDirection(deg) {
  if (deg === undefined || deg === null) return '无风';
  const directions = ['北', '东北北', '东北', '东东北', '东',
                       '东东南', '东南', '南东南', '南',
                       '南西南', '西南', '西西南', '西',
                       '西西北', '西北', '北西北'];
  const i = Math.round(deg / 22.5) % 16;
  return `${directions[i]}风`;
}

/**
 * 风速等级 → 描述
 */
function windLevel(speed) {
  if (!speed || speed < 0.3) return { level: 0, text: '无风' };
  if (speed < 1.6)  return { level: 1, text: '软风' };
  if (speed < 3.4)  return { level: 2, text: '轻风' };
  if (speed < 5.5)  return { level: 3, text: '微风' };
  if (speed < 8.0)  return { level: 4, text: '和风' };
  if (speed < 10.8) return { level: 5, text: '清风' };
  if (speed < 13.9) return { level: 6, text: '强风' };
  if (speed < 17.2) return { level: 7, text: '疾风' };
  if (speed < 20.8) return { level: 8, text: '大风' };
  if (speed < 24.5) return { level: 9, text: '烈风' };
  if (speed < 28.5) return { level: 10, text: '狂风' };
  if (speed < 32.7) return { level: 11, text: '暴风' };
  return { level: 12, text: '台风' };
}

/**
 * 根据天气生成穿衣/出行建议
 */
function generateSuggestion(weather) {
  const suggestions = [];
  const temp = weather.temp;
  const code = weather.weather_code;
  const wInfo = WEATHER_MAP[code] || { icon: '🌡️', text: '未知', level: 'normal' };

  // 温度建议
  if (temp <= 0) suggestions.push('❄️ 极寒！注意保暖防冻');
  else if (temp <= 10) suggestions.push('🧥 较冷，建议穿厚外套或羽绒服');
  else if (temp <= 18) suggestions.push('👕 微凉，适合穿薄外套或卫衣');
  else if (temp <= 26) suggestions.push('👕 温度舒适，穿 T 恤或薄衬衫即可');
  else if (temp <= 33) suggestions.push('☀️ 偏热，注意防晒补水');
  else suggestions.push('🥵 高温预警！尽量减少户外活动');

  // 天气现象建议
  if ([200,201,202,210,211,212,221,230,231,232].includes(code))
    suggestions.push('⚠️ 有雷暴！避免户外活动');
  if ([500,501,502,503,504,520,521,522,531].includes(code))
    suggestions.push('☂️ 有雨，记得带伞出门');
  if ([600,601,602,611,612,613,615,616,620,621,622].includes(code))
    suggestions.push('🧣 下雪路滑，注意保暖和交通安全');
  if ([701,741].includes(code))
    suggestions.push('👀 能见度低，驾车请减速开灯');
  if (weather.humidity >= 85)
    suggestions.push('💧 湿度很高，体感闷热');
  if ((weather.wind_speed || 0) > 10)
    suggestions.push('💨 风力较大，注意高空坠物');

  return suggestions;
}

/**
 * 使用 Open-Meteo 免费 API 查询天气
 * 无需 API Key，支持全球城市查询
 */
async function fetchWeather(city, days = 1) {
  // 如果提供了城市名但没坐标，需要先地理编码
  let lat, lon;

  if (city) {
    // 地理编码：城市名 → 经纬度
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`;
    const geoData = await httpGet(geoUrl, 5000);
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`未找到城市：${city}`);
    }
    lat = geoData.results[0].latitude;
    lon = geoData.results[0].longitude;
  } else {
    throw new Error('需要提供城市名或先调用 get_location 获取当前位置');
  }

  // 天气查询
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset&timezone=auto&forecast_days=${days}`;
  const wData = await httpGet(weatherUrl, 10000);

  if (!wData.current || !wData.daily) {
    throw new Error('天气数据获取失败');
  }

  // 解析当前天气
  const cur = wData.current;
  const daily = wData.daily;

  const currentWeather = {
    city: city || '未知',
    lat, lon,
    temp: Math.round(cur.temperature_2m),
    feels_like: Math.round(cur.apparent_temperature),
    humidity: cur.relative_humidity_2m,
    weather_code: cur.weather_code,
    wind_speed: Math.round(cur.wind_speed_10m * 10) / 10,
    wind_direction: cur.wind_direction_10m,
    visibility: cur.visibility,
    wInfo: WEATHER_MAP[cur.weather_code] || { icon: '🌡️', text: '未知', level: 'normal' },
    sunrise: daily.sunrise[0]?.split('T')[1] || '--:--',
    sunset: daily.sunset[0]?.split('T')[1] || '--:--',
    forecast: daily.time.slice(0, days).map((date, i) => ({
      date,
      max_temp: Math.round(daily.temperature_2m_max[i]),
      min_temp: Math.round(daily.temperature_2m_min[i]),
      code: daily.weather_code[i],
      precipitation_prob: daily.precipitation_probability_max[i],
      wInfo: WEATHER_MAP[daily.weather_code[i]] || { icon: '🌡️', text: '未知', level: 'normal' },
    })),
    suggestions: [],
    timestamp: Date.now(),
  };

  currentWeather.suggestions = generateSuggestion(currentWeather);
  currentWeather.display = formatWeatherDisplay(currentWeather);

  return currentWeather;
}

/**
 * 格式化天气显示文本
 */
function formatWeatherDisplay(w) {
  const wd = windDirection(w.wind_direction);
  const wl = windLevel(w.wind_speed);
  const lines = [
    `${w.wInfo.icon} ${w.city} · 今天`,
    `🌡️ ${w.temp}°C（体感 ${w.feels_like}°C）| 💧 湿度 ${w.humidity}%`,
    `💨 ${wd} ${wl.text}${wl.level > 0 ? ` (${wl.level}级)` : ''} | ${w.wInfo.icon} ${w.wInfo.text}`,
    `🌅 日出 ${w.sunrise} 日落 ${w.sunset}`,
  ];
  if (w.suggestions.length > 0) {
    lines.push(`\n💡 建议：${w.suggestions[0]}`);
  }
  return lines.join('\n');
}

// ─── 组合：位置 + 天气简报 ─────────────────────────

async function getGeoWeatherBrief(ctx) {
  // 先尝试从缓存取位置
  const cachedLoc = readCache(ctx, LOCATION_CACHE_FILE);
  let location;

  if (cachedLoc && !isExpired(cachedLoc)) {
    location = cachedLoc;
  } else {
    location = await fetchLocationByIP();
    writeCache(ctx, LOCATION_CACHE_FILE, location);
  }

  // 取缓存天气或实时查
  const cachedWx = readCache(ctx, WEATHER_CACHE_FILE);
  let weather;

  if (cachedWx && !isExpired(cachedWx)) {
    weather = cachedWx;
  } else {
    weather = await fetchWeather(location.city);
    writeCache(ctx, WEATHER_CACHE_FILE, weather);
  }

  return {
    location,
    weather,
    brief: `📍 ${location.city} | ${weather.display.split('\n')[1] || ''}`,
  };
}

// ─── 缓存管理 ──────────────────────────────────────

function getCacheDir(ctx) {
  const dir = path.join(ctx.dataDir, CACHE_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getCachePath(ctx, filename) {
  return path.join(getCacheDir(ctx), filename);
}

function isExpired(entry) {
  if (!entry || !entry.timestamp) return true;
  const ttl = entry._cacheType === 'location' ? LOCATION_CACHE_TTL : WEATHER_CACHE_TTL;
  return (Date.now() - entry.timestamp) > ttl;
}

function readCache(ctx, filename) {
  const cachePath = getCachePath(ctx, filename);
  try {
    if (fs.existsSync(cachePath)) {
      return JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    }
  } catch (_) {}
  return null;
}

function writeCache(ctx, filename, data) {
  data._cacheType = filename.replace('.json', '');
  fs.writeFileSync(
    getCachePath(ctx, filename),
    JSON.stringify(data, null, 2),
    'utf-8'
  );
}

// ─── 插件工厂 ───────────────────────────────────────

function createPlugin(ctx) {

  return {
    /**
     * 插件激活
     */
    async activate() {
      // 初始化缓存目录
      getCacheDir(ctx);

      // IPC：get_location — IP 定位
      ctx.registerIpcHandler('geo:get-location', async (event, params) => {
        const ip = params?.ip;

        // 尝试缓存
        if (!ip) {
          const cached = readCache(ctx, LOCATION_CACHE_FILE);
          if (cached && !isExpired(cached)) {
            ctx.sendToMainWindow('ai:proactive-message', {
              type: 'geo-location',
              content: cached.display,
            });
            return { success: true, data: cached, source: 'cache' };
          }
        }

        // 实时查询
        const location = await fetchLocationByIP(ip);
        if (!ip) {
          writeCache(ctx, LOCATION_CACHE_FILE, location);
        }

        ctx.sendToMainWindow('ai:proactive-message', {
          type: 'geo-location',
          content: location.display,
        });

        return { success: true, data: location, source: 'live' };
      });

      // IPC：get_weather — 天气查询
      ctx.registerIpcHandler('geo:get-weather', async (event, params) => {
        const city = params?.city;
        const days = params?.days || 1;

        // 构建缓存 key（含城市和天数）
        const cacheKey = city ? `${WEATHER_CACHE_FILE}-${city}-d${days}` : null;

        // 尝试缓存
        if (cacheKey) {
          const cached = readCache(ctx, cacheKey);
          if (cached && !isExpired(cached)) {
            return { success: true, data: cached, source: 'cache' };
          }
        }

        // 实时查询
        const weather = await fetchWeather(city, days);
        if (cacheKey) {
          writeCache(ctx, cacheKey, weather);
        } else {
          writeCache(ctx, WEATHER_CACHE_FILE, weather);
        }

        ctx.sendToMainWindow('ai:proactive-message', {
          type: 'geo-weather',
          content: weather.display,
        });

        return { success: true, data: weather, source: 'live' };
      });

      // IPC：geo_weather_brief — 一站式简报
      ctx.registerIpcHandler('geo:brief', async () => {
        const result = await getGeoWeatherBrief(ctx);

        ctx.sendToMainWindow('ai:proactive-message', {
          type: 'geo-brief',
          content: result.brief,
        });

        return { success: true, data: result };
      });

      console.log('[GeoAware] Plugin activated ✅');
    },

    /**
     * 插件卸载清理
     */
    async deactivate() {
      console.log('[GeoAware] Plugin deactivated 👋');
    },

    /**
     * 托盘菜单点击 — 打开天气窗口
     */
    onMenuClick() {
      ctx.openPluginWindow({
        path: path.resolve(__dirname, 'ui', 'index.html'),
        width: 420,
        height: 560,
        title: '🌍 天气',
      });
    },
  };

}

// ─── 导出 ───────────────────────────────────────────

module.exports.fetchLocationByIP = fetchLocationByIP;
module.exports.fetchWeather = fetchWeather;
module.exports.getGeoWeatherBrief = getGeoWeatherBrief;
module.exports.createPlugin = createPlugin;
module.exports.WEATHER_MAP = WEATHER_MAP;
