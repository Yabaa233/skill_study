#!/usr/bin/env node
/**
 * ============================================================
 *  🎲 Dice Roll — 功能验证脚本
 * ============================================================
 *
 *  验证骰子引擎的正确性：
 *    - 各模式输出结构符合预期
 *    - 结果值域正确
 *    - 边界参数处理
 *
 *  Usage:
 *    node test.cjs
 *
 *  Exit code:
 *    0 — 全部通过
 *    1 — 有用例失败
 */

const { rollDice } = require('./plugin.cjs');

// ─── 简易测试框架 ──────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.log(`  ❌ ${message}`);
  }
}

function describe(name, fn) {
  console.log(`\n📦 ${name}`);
  fn();
}

function section(title) {
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`  ${title}`);
  console.log(`${'═'.repeat(50)}`);
}

// ─── 测试套件 ──────────────────────────────────────

section('Dice Roll Test Suite');

describe('Standard Mode (d6)', () => {
  const r = rollDice({ mode: 'standard', sides: 6 });
  assert(r.mode === 'standard', `mode = "${r.mode}" (expected "standard")`);
  assert(typeof r.result === 'number' && r.result >= 1 && r.result <= 6,
    `result in [1,6]: got ${r.result}`);
  assert(typeof r.display === 'string' && r.display.length > 0,
    'display is non-empty string');
  assert(r.sides === 6, `sides = ${r.sides} (expected 6)`);
});

describe('Standard Mode (d20)', () => {
  const r = rollDice({ mode: 'standard', sides: 20 });
  assert(r.result >= 1 && r.result <= 20,
    `result in [1,20]: got ${r.result}`);
  assert(r.display.includes('d20'), `display mentions d20: "${r.display}"`);
});

describe('Multi Dice (3d6)', () => {
  const r = rollDice({ mode: 'multi', sides: 6, count: 3 });
  assert(r.mode === 'multi', `mode = "${r.mode}"`);
  assert(Array.isArray(r.results) && r.results.length === 3,
    `results array length = ${r.results?.length} (expected 3)`);
  assert(r.results.every(v => v >= 1 && v <= 6),
    'all values in [1,6]');
  assert(r.sum === r.results.reduce((a, b) => a + b, 0),
    `sum (${r.sum}) matches total of results`);
});

describe('Sicbo Mode', () => {
  // 跑多次确保大小两种结果都能覆盖（概率上几乎必然）
  let sawSmall = false;
  let sawBig = false;
  for (let i = 0; i < 100; i++) {
    const r = rollDice({ mode: 'sicbo' });
    assert(r.mode === 'sicbo', 'mode = "sicbo"');
    assert(r.result >= 1 && r.result <= 6,
      `sicbo result in [1,6]: got ${r.result}`);
    assert(r.judgement === '小' || r.judgement === '大',
      `judgement valid: got "${r.judgement}"`);
    if (r.judgement === '小') sawSmall = true;
    if (r.judgement === '大') sawBig = true;
  }
  assert(sawSmall, 'covered 小 result in 100 rolls');
  assert(sawBig, 'covered 大 result in 100 rolls');
});

describe('Default Parameters', () => {
  const r = rollDice(); // 无参数
  assert(r.mode === 'standard', `default mode = "standard"`);
  assert(r.sides === 6, `default sides = 6, got ${r.sides}`);
  assert(r.result >= 1 && r.result <= 6, 'default result in range');
});

describe('Statistical Sanity Check (d6 x10000)', () => {
  const buckets = new Array(7).fill(0); // index 1-6
  for (let i = 0; i < 10000; i++) {
    const r = rollDice({ mode: 'standard', sides: 6 });
    buckets[r.result]++;
  }
  // 每个面出现次数应在 ~1400-1800 之间（均值1667，标准差~37）
  const minAcceptable = 1200;
  const maxAcceptable = 2100;
  for (let face = 1; face <= 6; face++) {
    const count = buckets[face];
    assert(count > minAcceptable && count < maxAcceptable,
      `Face ${face}: ${count} occurrences (within ${minAcceptable}-${maxAcceptable})`);
  }
});

describe('Edge Cases', () => {
  // d2（硬币）
  const coin = rollDice({ mode: 'standard', sides: 2 });
  assert([1, 2].includes(coin.result), `d2 result: ${coin.result}`);

  // d100
  const d100 = rollDice({ mode: 'standard', sides: 100 });
  assert(d100.result >= 1 && d100.result <= 100, `d100 result: ${d100.result}`);

  // multi with count=1
  const single = rollDice({ mode: 'multi', sides: 10, count: 1 });
  assert(single.results.length === 1, 'multi count=1: single element');

  // large count
  const many = rollDice({ mode: 'multi', sides: 6, count: 50 });
  assert(many.results.length === 50, 'multi count=50: 50 elements');
  assert(many.sum >= 50 && many.sum <= 300, `sum in valid range: ${many.sum}`);
});

// ─── 汇总 ─────────────────────────────────────────

console.log(`\n${'═'.repeat(50)}`);
console.log(`  结果：${passed} 通过 / ${failed} 失败 / 共 ${passed + failed} 项`);
console.log(`${'═'.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
