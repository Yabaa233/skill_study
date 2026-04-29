#!/usr/bin/env node
/**
 * retro-china-80s-ppt 功能验证脚本
 *
 * 依赖构建产物：请先执行 `npm install && node build.js`
 *
 * 本测试会生成 4 份不同模板的 demo PPT，输出到当前目录 out/ 文件夹。
 */
const path = require('path');
const fs = require('fs');

// 优先使用 bundle；若未构建则回退到 src（开发时用）
let mod;
const bundlePath = path.join(__dirname, 'scripts', 'retro-ppt.bundle.cjs');
if (fs.existsSync(bundlePath)) {
  mod = require(bundlePath);
  console.log('[test] 使用 bundle:', bundlePath);
} else {
  mod = require(path.join(__dirname, 'src', 'retro-ppt.cjs'));
  console.warn('[test] ⚠️  未发现 bundle，使用源文件（生产前请执行 node build.js）');
}

const { execute } = mod;

const OUT_DIR = path.join(__dirname, 'out');
fs.mkdirSync(OUT_DIR, { recursive: true });

const mockContext = {
  toolName: 'create_retro_ppt',
  dataDir: OUT_DIR,
  skillDir: __dirname,
};

// ─── 四种模板的示例内容 ───────────────────────────────

const cases = [
  {
    name: 'textbook',
    input: {
      title: '一九八八年度工作报告',
      subtitle: '回首过往 · 再启新程',
      author: '某某厂劳资科',
      template: 'textbook',
      slides: [
        { title: '开篇寄语', bullets: ['光阴似箭，岁月如歌', '值此岁末，谨作汇报', '望同志们批评指正'] },
        { title: '今年成就', bullets: ['完成指标 112%', '获得三项专利', '新开两条生产线', '培训工人 86 名'] },
        { title: '明年展望', bullets: ['继续技术革新', '加强质量管理', '扩大对外交流', '争创一流单位'], note: '——一九八八年腊月' },
      ],
    },
  },
  {
    name: 'award',
    input: {
      title: '年度最佳女儿',
      subtitle: '兹授予小明同志此殊荣',
      author: '亲爱的爸爸',
      template: 'award',
      slides: [
        { title: '主要事迹', bullets: ['学习勤奋，成绩优秀', '尊老爱幼，品德端正', '兴趣广泛，才艺出众', '开朗大方，深得大家喜爱'] },
        { title: '特此表彰', bullets: ['以资鼓励', '再接再厉', '前程似锦', '阖家安康'], note: '—— 颁发于家庭年会 ——' },
      ],
    },
  },
  {
    name: 'quotation',
    input: {
      title: '程序员语录',
      subtitle: '代码江湖 三十六计',
      author: '老张编',
      template: 'quotation',
      slides: [
        { title: '论调试', bullets: ['能跑就别动它', '改一行 bug 冒三行', '遇事不决 console.log', '祖传代码 勿动为上'] },
        { title: '论加班', bullets: ['天行健 程序员以自强不息', '不是在改 bug 就是在产生 bug 的路上', '摸鱼乃立业之本'] },
      ],
    },
  },
  {
    name: 'calendar',
    input: {
      title: '年度大事回顾',
      subtitle: '日子 · 一页一页翻过',
      author: 'ClawPet 宠物台历',
      template: 'calendar',
      slides: [
        { title: '春 · 万物复苏', bullets: ['大年初一吃饺子', '三月植树', '清明踏青'] },
        { title: '夏 · 烈日炎炎', bullets: ['端午龙舟', '暑期纳凉', '七夕情长'] },
        { title: '秋 · 硕果累累', bullets: ['中秋赏月', '国庆同乐', '重阳登高'] },
        { title: '冬 · 岁末团圆', bullets: ['冬至饺子', '腊八喝粥', '除夕守岁'], note: '—— 祈来年顺遂 ——' },
      ],
    },
  },
];

async function run() {
  console.log('═'.repeat(60));
  console.log('  📜 Retro China 80s PPT — 功能验证');
  console.log('═'.repeat(60));

  let pass = 0;
  let fail = 0;

  for (const c of cases) {
    const outPath = path.join(OUT_DIR, `demo-${c.name}.pptx`);
    try {
      const result = await execute({ ...c.input, outputPath: outPath }, mockContext);
      if (result.success && fs.existsSync(outPath)) {
        const size = fs.statSync(outPath).size;
        console.log(`  ✅ [${c.name}] 生成成功 (${size} bytes)  → ${outPath}`);
        pass++;
      } else {
        console.log(`  ❌ [${c.name}] 失败: ${result.error || '文件未生成'}`);
        fail++;
      }
    } catch (err) {
      console.log(`  ❌ [${c.name}] 异常: ${err.message}`);
      fail++;
    }
  }

  // 边界测试
  console.log('\n—— 边界测试 ——');
  const missingTitle = await execute({ slides: [{ title: 'x', bullets: [] }] }, mockContext);
  if (!missingTitle.success && /title/.test(missingTitle.error || '')) {
    console.log('  ✅ 缺少 title 正确报错');
    pass++;
  } else {
    console.log('  ❌ 缺少 title 未报错');
    fail++;
  }

  const emptySlides = await execute({ title: 'x', slides: [] }, mockContext);
  if (!emptySlides.success && /slides/.test(emptySlides.error || '')) {
    console.log('  ✅ 空 slides 正确报错');
    pass++;
  } else {
    console.log('  ❌ 空 slides 未报错');
    fail++;
  }

  const badTemplate = await execute({
    title: 'x',
    template: 'disco',
    slides: [{ title: 'a', bullets: ['b'] }],
  }, mockContext);
  if (!badTemplate.success && /模板|template/.test(badTemplate.error || '')) {
    console.log('  ✅ 未知模板正确报错');
    pass++;
  } else {
    console.log('  ❌ 未知模板未报错');
    fail++;
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`  结果: ${pass} 通过 / ${fail} 失败`);
  console.log(`  输出目录: ${OUT_DIR}`);
  console.log('═'.repeat(60));

  process.exit(fail > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('💥 测试异常:', err.stack || err.message);
  process.exit(1);
});
