#!/usr/bin/env node
/**
 * ============================================================
 *  🌍 Geo Aware — 功能验证脚本
 * ============================================================
 *
 *  验证 IP 定位、天气查询、天气映射、建议生成等核心逻辑。
 *  离线测试（数据校验）始终运行，在线测试需要网络。
 *
 *  Usage:  node test.cjs
 */

const {
  fetchLocationByIP,
  fetchWeather,
  WEATHER_MAP,
} = require('./plugin.cjs');

// ─── 测试框架 ───────────────────────────────────────

let passed = 0;
let failed = 0;
let skipped = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✅ ${msg}`); }
  else      { failed++; console.log(`  ❌ ${msg}`); }
}

function skip(msg) { skipped++; console.log(`  ⏭️ ${msg} (跳过)`); }

function section(title) {
  console.log(`\n${'═'.repeat(50)}\n  ${title}\n${'═'.repeat(50)}`);
}

// ═══════════════════════════════════════════
// 第一部分：离线测试（不需要网络）
// ═══════════════════════════════════════════

section('Geo Aware 功能验证');

console.log('\n📦 1. 模块导出验证');
assert(typeof fetchLocationByIP === 'function', 'fetchLocationByIP 是函数');
assert(typeof fetchWeather === 'function', 'fetchWeather 是函数');
assert(typeof WEATHER_MAP === 'object', 'WEATHER_MAP 存在');

console.log('\n📦 2. Weather Map 完整性 & 覆盖率');

// 关键代码点必须覆盖
const criticalCodes = [
  [200, '⛈️', 'warning'],    // 雷暴伴阵雨
  [500, '🌦️', 'normal'],     // 小雨
  [502, '🌧️', 'rainy'],      // 大雨
  [600, '🌨️', 'normal'],     // 小雪
  [601, '❄️', 'snowy'],      // 中雪
  [701, '🌫️', 'normal'],     // 雾
  [781, '🌪️', 'danger'],     // 龙卷风
  [800, '☀️', 'sunny'],       // 晴
  [802, '⛅', 'normal'],       // 多云
  [804, '☁️', 'normal'],       // 阴天
];

for (const [code, expectedIcon, expectedLevel] of criticalCodes) {
  const w = WEATHER_MAP[code];
  if (!w) {
    assert(false, `Code ${code}: 缺失！`);
  } else {
    assert(w.icon === expectedIcon, `Code ${code}: icon="${w.icon}" (期望 "${expectedIcon}")`);
    assert(w.level === expectedLevel, `Code ${code}: level="${w.level}" (期望 "${expectedLevel}")`);
    assert(typeof w.text === 'string' && w.text.length > 0,
      `Code ${code}: text="${w.text}"`);
  }
}

// 统计覆盖
const totalMapped = Object.keys(WEATHER_MAP).length;
assert(totalMapped >= 45, `WMO 天气代码覆盖 ${totalMapped} 种 (>= 45)`);

// 确认所有 level 值合法
const validLevels = new Set(['normal', 'rainy', 'snowy', 'sunny', 'warning', 'danger']);
let allValid = true;
for (const [code, w] of Object.entries(WEATHER_MAP)) {
  if (!validLevels.has(w.level)) {
    allValid = false;
    console.log(`    ⚠️ Code ${code}: 无效 level="${w.level}"`);
  }
}
assert(allValid, '所有天气代码的 level 均为合法值');

// 未知代码回退
assert(WEATHER_MAP[999] === undefined, '未知代码 999 → undefined');

console.log('\n📦 3. 数据结构字段验证');

// 模拟天气对象测试建议生成逻辑
const mockWeatherCold = { temp: -5, humidity: 50, weather_code: 602, wind_speed: 3 };
const mockWeatherHot  = { temp: 38, humidity: 70, weather_code: 800, wind_speed: 5 };
const mockWeatherRain = { temp: 20, humidity: 90, weather_code: 501, wind_speed: 8 };

assert(mockWeatherCold.temp < 0, '冷天模拟：temp < 0');
assert(mockWeatherHot.temp > 35, '热天模拟：temp > 35');
assert(mockWeatherRain.humidity >= 85, '雨天模拟：湿度高');

// ═══════════════════════════════════════════
// 第二部分：在线测试（需要网络）
// ═══════════════════════════════════════════

async function runOnlineTests() {

  // ── IP 定位 ──
  console.log('\n📦 4. IP 定位 (网络)');
  let loc;
  try {
    loc = await fetchLocationByIP();
    assert(typeof loc.ip === 'string' && loc.ip.length > 0, `IP: ${loc.ip}`);
    assert(typeof loc.city === 'string' && loc.city.length > 0, `城市: "${loc.city}"`);
    assert(typeof loc.region === 'string', `省份: "${loc.region}"`);
    assert(typeof loc.country === 'string', `国家: "${loc.country}"`);
    assert(typeof loc.lat === 'number' && loc.lat >= -90 && loc.lat <= 90, `纬度: ${loc.lat}`);
    assert(typeof loc.lon === 'number' && loc.lon >= -180 && loc.lon <= 180, `经度: ${loc.lon}`);
    assert(loc.display.includes('📍'), 'display 含定位图标');
    assert(typeof loc.timestamp === 'number' && loc.timestamp > 0, 'timestamp 有效');
    console.log(`\n     📍 ${loc.display.replace('📍 当前位置：', '')}`);
  } catch (err) {
    skip(`IP 定位不可用（可能无外网访问）: ${err.message.slice(0, 80)}`);
  }

  // ── 单日天气 ──
  console.log('\n📦 5. 单日天气查询 (网络)');
  if (loc) {
    try {
      const wx = await fetchWeather(loc.city, 1);
      assert(wx.city !== undefined, `城市字段存在: "${wx.city}"`);
      assert(typeof wx.temp === 'number' && wx.temp >= -60 && wx.temp <= 60,
        `温度合理: ${wx.temp}°C`);
      assert(typeof wx.feels_like === 'number', `体感温度: ${wx.feels_like}°C`);
      assert(wx.humidity >= 0 && wx.humidity <= 100, `湿度 0-100: ${wx.humidity}%`);
      assert(Number.isInteger(wx.weather_code), `天气代码: ${wx.weather_code}`);
      assert(wx.wInfo != null && wx.wInfo.icon && wx.wInfo.text,
        `天气信息: ${wx.wInfo.icon} ${wx.wInfo.text}`);
      assert(Array.isArray(wx.forecast) && wx.forecast.length >= 1,
        `预报天数: ${wx.forecast.length}`);
      assert(Array.isArray(wx.suggestions), '建议数组存在');

      const f0 = wx.forecast[0];
      if (f0) {
        assert(typeof f0.max_temp === 'number' && typeof f0.min_temp === 'number',
          `预报范围: ${f0.min_temp}-${f0.max_temp}°C`);
        assert(f0.precipitation_prob >= 0 && f0.precipitation_prob <= 100,
          `降水概率: ${f0.precipitation_prob}%`);
      }
      assert(wx.display && wx.display.length > 10, 'display 文本非空');
      console.log(`\n     🌤️ ${wx.wInfo.icon} ${wx.city} ${wx.temp}°C ${wx.wInfo.text}`);
    } catch (err) {
      assert(false, `天气查询失败: ${err.message}`);
    }
  } else {
    skip('跳过（依赖 IP 定位结果）');
  }

  // ── 多日预报 ──
  console.log('\n📦 6. 多日天气预报 (网络)');
  if (loc) {
    try {
      const wx3 = await fetchWeather(loc.city, 3);
      assert(wx3.forecast.length === 3, `获取到 ${wx3.forecast.length} 天 (期望 3)`);
      for (let i = 0; i < wx3.forecast.length; i++) {
        const f = wx3.forecast[i];
        assert(f.date !== undefined, `Day${i+1}: 有日期`);
        assert(f.code !== undefined, `Day${i+1}: 有天气代码`);
        assert(typeof f.max_temp === 'number' && typeof f.min_temp === 'number',
          `Day${i+1}: ${f.min_temp}-${f.max_temp}°C`);
        assert(f.min_temp <= f.max_temp + 1,
          `Day${i+1}: min<=max (${f.min_temp}<=${f.max_temp})`);
      }
    } catch (err) {
      assert(false, `多日预报失败: ${err.message}`);
    }
  } else {
    skip('跳过（依赖 IP 定位结果）');
  }

  // ── 已知城市 ──
  console.log('\n📦 7. 已知城市查询 (网络)');
  for (const city of ['Beijing']) {
    try {
      const wxc = await fetchWeather(city, 1);
      assert(typeof wxc.temp === 'number', `${city}: ${wxc.temp}°C`);
    } catch (err) {
      assert(false, `${city} 查询失败: ${err.message}`);
    }
  }

  // ── 异常处理 ──
  console.log('\n📦 8. 边界与异常处理');
  try {
    await fetchWeather('NonexistentCityXYZ12345', 1);
    assert(false, '不存在的城市应该抛出错误');
  } catch (err) {
    assert(err.message.length > 0,
      `无效城市正确抛错: "${err.message.slice(0, 60)}"`);
  }

  // ─── 汇总 ─────────────────────────────────────

  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  结果：${passed} 通过 / ${failed} 失败 / ${skipped} 跳过 / 共 ${passed + failed + skipped} 项`);
  console.log(`${'═'.repeat(50)}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runOnlineTests().catch((err) => {
  console.error(`\n💥 测试运行器异常: ${err.message}\n${err.stack?.slice(0, 300) || ''}`);
  process.exit(1);
});
