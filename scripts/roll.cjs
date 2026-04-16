#!/usr/bin/env node
/**
 * ============================================================
 *  🎲 Dice Roll — LLM Tool 执行入口
 * ============================================================
 *
 *  由 SKILL.md scriptEntry 字段指定，Agent 调用 roll_dice tool 时
 *  ClawPet 会以子进程方式执行此脚本。
 *
 *  Usage:
 *    node roll.cjs                      # standard d6
 *    node roll.cjs --mode multi --sides 6 --count 3
 *    node roll.cjs --mode sicbo
 *
 *  Exit codes:
 *    0 — 成功（JSON 输出到 stdout）
 *    1 — 参数错误
 */

const { rollDice } = require('../plugin.cjs');

// ─── CLI 参数解析 ─────────────────────────────────────

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--mode' && argv[i + 1]) { args.mode = argv[++i]; }
    else if (argv[i] === '--sides' && argv[i + 1]) { args.sides = parseInt(argv[++i], 10); }
    else if (argv[i] === '--count' && argv[i + 1]) { args.count = parseInt(argv[++i], 10); }
  }

  // 校验
  if (args.mode && !['standard', 'multi', 'sicbo'].includes(args.mode)) {
    console.error(`Invalid mode: "${args.mode}". Must be one of: standard, multi, sicbo`);
    process.exit(1);
  }
  if (args.sides !== undefined && (isNaN(args.sides) || args.sides < 2 || args.sides > 1000)) {
    console.error('Invalid sides: must be an integer between 2 and 1000');
    process.exit(1);
  }
  if (args.count !== undefined && (isNaN(args.count) || args.count < 1 || args.count > 100)) {
    console.error('Invalid count: must be an integer between 1 and 100');
    process.exit(1);
  }

  return args;
}

// ─── 执行 ─────────────────────────────────────────────

const params = parseArgs(process.argv);
const result = rollDice(params);

// stdout 输出 JSON（ClawPet Agent 解析使用）
console.log(JSON.stringify(result, null, 2));
