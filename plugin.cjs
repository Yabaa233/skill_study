/**
 * ============================================================
 *  🎲 Dice Roll Plugin — ClawPet Plugin 主逻辑
 * ============================================================
 *
 *  演示能力：
 *    - 插件生命周期：activate() / deactivate()
 *    - 托盘菜单集成
 *    - IPC 通信（registerIpcHandler）
 *    - 独立 UI 窗口管理
 *    - 桌面宠物气泡消息
 *    - 系统通知
 *    - 文件持久化（投掷历史）
 */

const fs = require('fs');
const path = require('path');

// ─── 骰子引擎 ───────────────────────────────────────

function rollDie(max) {
  return Math.floor(Math.random() * max) + 1;
}

function rollDice({ mode = 'standard', sides = 6, count = 1 } = {}) {
  switch (mode) {
    case 'sicbo': {
      const result = rollDie(6);
      const judgement = result <= 3 ? '小' : '大';
      return { mode: 'sicbo', result, judgement, display: `🎲 骰宝结果：**${result}** → ${judgement}！` };
    }
    case 'multi': {
      const results = Array.from({ length: count }, () => rollDie(sides));
      const sum = results.reduce((a, b) => a + b, 0);
      return { mode: 'multi', sides, count, results, sum, display: `🎲 ${count}d${sides} 结果：[${results.join(', ')}] = **${sum}**` };
    }
    default: { // standard
      const result = rollDie(sides);
      const faces = { 1: '[ . ]', 2: '[ : ]', 3: '[...]', 4: '[:::]', 5: '[:::.]', 6: '[::::]' };
      const dieFace = sides === 6 ? (faces[result] || '[dice]') : null;
      const display = dieFace
        ? `🎲 ${dieFace} 你掷出了 **${result}** 点！`
        : `🎲 d${sides} 结果：**${result}**`;
      return { mode: 'standard', sides, result, display };
    }
  }
}

// ─── 历史记录持久化 ──────────────────────────────────

function getHistoryPath(ctx) {
  return path.join(ctx.dataDir, 'roll-history.json');
}

function loadHistory(ctx) {
  const histPath = getHistoryPath(ctx);
  try {
    if (fs.existsSync(histPath)) {
      return JSON.parse(fs.readFileSync(histPath, 'utf-8'));
    }
  } catch (e) {
    // 文件损坏时返回空数组
  }
  return [];
}

function saveHistory(ctx, entry) {
  const history = loadHistory(ctx);
  history.push({
    ...entry,
    timestamp: new Date().toISOString(),
  });
  // 只保留最近 100 条
  const trimmed = history.slice(-100);
  fs.writeFileSync(getHistoryPath(ctx), JSON.stringify(trimmed, null, 2), 'utf-8');
  return trimmed;
}

// ─── 插件工厂 ───────────────────────────────────────

function createPlugin(ctx) {

  return {
    /**
     * 插件激活
     * - 注册 IPC 处理器
     * - 注册托盘菜单
     * - 初始化数据目录
     */
    async activate() {
      // 确保 dataDir 存在
      if (!fs.existsSync(ctx.dataDir)) {
        fs.mkdirSync(ctx.dataDir, { recursive: true });
      }

      // 注册 IPC：LLM tool 调用入口
      ctx.registerIpcHandler('roll:dice', async (event, params) => {
        const result = rollDice(params);

        // 记录历史
        saveHistory(ctx, result);

        // 发送桌面宠物气泡
        ctx.sendToMainWindow('ai:proactive-message', {
          type: 'dice-result',
          content: result.display,
          metadata: { mode: result.mode, timestamp: Date.now() },
        });

        return { success: true, data: result };
      });

      // 注册 IPC：查询历史记录
      ctx.registerIpcHandler('roll:history', async () => {
        const history = loadHistory(ctx);
        return { success: true, data: history.slice(-20) }; // 最近20条
      });

      // 注册 IPC：清除历史
      ctx.registerIpcHandler('roll:clear-history', async () => {
        const histPath = getHistoryPath(ctx);
        if (fs.existsSync(histPath)) {
          fs.unlinkSync(histPath);
        }
        return { success: true };
      });

      console.log('[DiceRoll] Plugin activated ✅');
    },

    /**
     * 插件卸载清理
     */
    async deactivate() {
      console.log('[DiceRoll] Plugin deactivated 👋');
    },

    /**
     * 托盘菜单点击 — 打开骰子 UI 窗口
     */
    onMenuClick() {
      ctx.openPluginWindow({
        path: path.resolve(__dirname, 'ui', 'index.html'),
        width: 420,
        height: 520,
        title: '🎲 骰子',
      });
    },
  };

}

// ─── 导出 ───────────────────────────────────────────

// 导出骰子引擎（供 test.cjs 和 scripts/roll.cjs 直接调用）
module.exports.rollDice = rollDice;
module.exports.rollDie = rollDie;
// 导出插件工厂（供 ClawPet Plugin 系统加载）
module.exports.createPlugin = createPlugin;
