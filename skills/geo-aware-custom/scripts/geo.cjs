#!/usr/bin/env node
/**
 * ============================================================
 *  🌍 Geo Aware — LLM Tool 执行入口
 * ============================================================
 *
 *  由 SKILL.md scriptEntry 字段指定，Agent 调用 get_location /
 *  get_weather / geo_weather_brief tool 时执行。
 *
 *  Usage:
 *    node geo.cjs --action location [--ip x.x.x.x]
 *    node geo.cjs --action weather --city 深圳 [--days 2]
 *    node geo.cjs --action brief
 *
 *  Exit codes:
 *    0 — 成功（JSON 输出到 stdout）
 *    1 — 参数错误
 *    2 — 网络/API 错误
 */

const {
  fetchLocationByIP,
  fetchWeather,
  getGeoWeatherBrief,
} = require('../plugin.cjs');

// ─── CLI 参数解析 ─────────────────────────────────────

function parseArgs(argv) {
  const args = { action: null };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--action' && argv[i + 1])       args.action = argv[++i];
    else if (argv[i] === '--ip' && argv[i + 1])        args.ip = argv[++i];
    else if (argv[i] === '--city' && argv[i + 1])      args.city = argv[++i];
    else if (argv[i] === '--days' && argv[i + 1])      args.days = parseInt(argv[++i], 10);
    else if (argv[i] === '--help' || argv[i] === '-h') {
      printUsage();
      process.exit(0);
    }
  }

  if (!args.action) {
    console.error('Error: --action is required. Use --help for usage.');
    process.exit(1);
  }
  if (!['location', 'weather', 'brief'].includes(args.action)) {
    console.error(`Error: Unknown action "${args.action}". Must be: location, weather, brief`);
    process.exit(1);
  }
  if (args.days !== undefined && (isNaN(args.days) || args.days < 1 || args.days > 7)) {
    console.error('Error: --days must be an integer between 1 and 7');
    process.exit(1);
  }

  return args;
}

function printUsage() {
  console.log(`
🌍 Geo Aware CLI Tool

Usage:
  node geo.cjs --action <action> [options]

Actions:
  location   Get current IP-based location
  weather    Query city weather forecast
  brief      Combined location + current weather

Options:
  --ip <addr>      Specific IP to geolocate (location only)
  --city <name>    City name to query (weather only)
  --days <n>       Forecast days: 1-7 (default: 1)
  --help           Show this help

Examples:
  node geo.cjs --action location
  node geo.cjs --action location --ip 8.8.8.8
  node geo.cjs --action weather --city Shenzhen --days 3
  node geo.cjs --action brief
`);
}

// ─── 执行入口 ─────────────────────────────────────────

async function main() {
  const params = parseArgs(process.argv);

  try {
    let result;

    switch (params.action) {
      case 'location':
        result = await fetchLocationByIP(params.ip);
        break;

      case 'weather':
        if (!params.city) {
          // 无城市名时使用 brief 流程（先定位再查天气）
          console.warn('Warning: No city specified. Use --city or action=brief.');
          params.action = 'brief';
          result = await getGeoWeatherBrief(null);
          result = result.weather;
        } else {
          result = await fetchWeather(params.city, params.days || 1);
        }
        break;

      case 'brief': {
        // brief 模式需要 ctx 来读缓存，CLI 下跳过缓存直接查询
        const loc = await fetchLocationByIP();
        const wx = await fetchWeather(loc.city, 1);
        result = {
          location: loc,
          weather: wx,
          brief: `📍 ${loc.city} | ${wx.wInfo.icon} ${wx.temp}°C | 💧 ${wx.humidity}%`,
        };
        break;
      }

      default:
        throw new Error(`Unknown action: ${params.action}`);
    }

    // stdout 输出 JSON
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);

  } catch (err) {
    console.error(JSON.stringify({ error: true, message: err.message }, null, 2));
    process.exit(2);
  }
}

main();
