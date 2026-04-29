/**
 * Build script — bundle src/retro-ppt.cjs 为自包含的 scripts/retro-ppt.bundle.cjs
 *
 * 使用：
 *   npm install
 *   node build.js
 */
const { buildSync } = require('esbuild');
const path = require('path');

buildSync({
  entryPoints: [path.join(__dirname, 'src', 'retro-ppt.cjs')],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node16',
  minify: true,
  outfile: path.join(__dirname, 'scripts', 'retro-ppt.bundle.cjs'),
  logLevel: 'info',
});

console.log('[retro-china-80s-ppt] ✅ Build done → scripts/retro-ppt.bundle.cjs');
