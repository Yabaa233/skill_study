/**
 * ============================================================
 *  📜 Retro China 80s PPT — 中国 80 年代怀旧风格 PPT 生成器
 * ============================================================
 *
 *  依赖：pptxgenjs (通过 esbuild bundle 打包为自包含文件)
 *
 *  模板：
 *    - textbook   老课本：宣纸米黄 + 墨黑 + 朱砂红
 *    - award      奖状喜报：金底红字 + 红双喜边框
 *    - quotation  语录本：红底黄字
 *    - calendar   挂历台历：米黄 + 墨绿 + 红点缀
 */

const path = require('path');
const fs = require('fs');
const PptxGenJS = require('pptxgenjs');

// ─── 配色与字体常量 ─────────────────────────────────

const PALETTE = {
  textbook: {
    bg:     'FAF3E0',   // 宣纸暖白
    ink:    '1A1A1A',   // 墨黑
    accent: 'C9302C',   // 朱砂红
    grid:   'D4C9A8',   // 方格线
    frame:  '8B5A2B',   // 深棕边框
    subtle: '6B5B3E',   // 淡墨
  },
  award: {
    bg:     'F5E6C8',   // 奖状米金
    ink:    '5C3A21',   // 深棕
    accent: 'C9302C',   // 搪瓷红
    gold:   'B8860B',   // 暗金
    frame:  'C9302C',
    subtle: '8B5A2B',
  },
  quotation: {
    bg:     'A6281F',   // 正红
    ink:    'F5E6C8',   // 米黄字
    accent: 'F0C24B',   // 黄
    frame:  'F0C24B',
    subtle: 'E8D49A',
  },
  calendar: {
    bg:     'FAF3E0',
    ink:    '1A1A1A',
    accent: 'C9302C',
    green:  '2E5D3A',   // 墨绿
    frame:  '2E5D3A',
    subtle: '6B5B3E',
  },
};

const FONT_CN = '宋体';
const FONT_BOLD = '黑体';

// ─── 工具函数 ───────────────────────────────────────

function safeFilename(title) {
  return String(title || 'retro-ppt')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .slice(0, 60)
    .trim() || 'retro-ppt';
}

function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ─── 装饰绘制 ───────────────────────────────────────

/**
 * 为课本/挂历模板绘制方格底纹（装饰用，稀疏一点）
 */
function drawGridBackground(slide, color) {
  const cols = 10;
  const rows = 6;
  const cellW = 13.33 / cols;
  const cellH = 7.5 / rows;
  for (let i = 0; i <= cols; i++) {
    slide.addShape('line', {
      x: i * cellW, y: 0, w: 0, h: 7.5,
      line: { color, width: 0.5, dashType: 'dash' },
    });
  }
  for (let j = 0; j <= rows; j++) {
    slide.addShape('line', {
      x: 0, y: j * cellH, w: 13.33, h: 0,
      line: { color, width: 0.5, dashType: 'dash' },
    });
  }
}

/**
 * 绘制双线装饰边框（课本风）
 */
function drawDoubleBorder(slide, color) {
  slide.addShape('rect', {
    x: 0.3, y: 0.3, w: 12.73, h: 6.9,
    line: { color, width: 2.5 }, fill: { type: 'none' },
  });
  slide.addShape('rect', {
    x: 0.5, y: 0.5, w: 12.33, h: 6.5,
    line: { color, width: 0.75 }, fill: { type: 'none' },
  });
}

/**
 * 绘制奖状波浪边（近似用多个小三角/菱形）
 */
function drawAwardBorder(slide, color) {
  // 外层粗红框
  slide.addShape('rect', {
    x: 0.25, y: 0.25, w: 12.83, h: 7.0,
    line: { color, width: 4 }, fill: { type: 'none' },
  });
  // 四角菱形装饰
  const corners = [
    { x: 0.15, y: 0.15 },
    { x: 12.88, y: 0.15 },
    { x: 0.15, y: 7.15 },
    { x: 12.88, y: 7.15 },
  ];
  for (const c of corners) {
    slide.addShape('diamond', {
      x: c.x, y: c.y, w: 0.3, h: 0.3,
      fill: { color }, line: { color: 'FFFFFF', width: 0.5 },
    });
  }
  // 内层细金线框
  slide.addShape('rect', {
    x: 0.6, y: 0.6, w: 12.13, h: 6.3,
    line: { color: 'B8860B', width: 1.25, dashType: 'solid' },
    fill: { type: 'none' },
  });
}

/**
 * 绘制印章（红色圆章 + 白字）
 */
function drawStamp(slide, text, x, y, color) {
  slide.addShape('ellipse', {
    x, y, w: 1.1, h: 1.1,
    fill: { color }, line: { color, width: 2 },
  });
  slide.addShape('ellipse', {
    x: x + 0.08, y: y + 0.08, w: 0.94, h: 0.94,
    line: { color: 'FFFFFF', width: 1 }, fill: { type: 'none' },
  });
  slide.addText(text, {
    x, y, w: 1.1, h: 1.1,
    fontFace: FONT_BOLD, fontSize: 10, color: 'FFFFFF',
    bold: true, align: 'center', valign: 'middle',
  });
}

/**
 * 绘制红双喜字符（用文字模拟，省去导入图片）
 */
function drawDoubleHappy(slide, x, y) {
  slide.addText('囍', {
    x, y, w: 0.9, h: 0.9,
    fontFace: FONT_BOLD, fontSize: 44, color: 'C9302C',
    bold: true, align: 'center', valign: 'middle',
  });
}

// ─── 首页渲染 ───────────────────────────────────────

function renderCoverTextbook(slide, { title, subtitle, author }, pal) {
  slide.background = { color: pal.bg };
  drawGridBackground(slide, pal.grid);
  drawDoubleBorder(slide, pal.frame);

  // 顶部小标：语文 / 第N课 风格
  slide.addText('——— 怀旧演示 · 壹玖捌捌 ———', {
    x: 1, y: 0.9, w: 11.33, h: 0.5,
    fontFace: FONT_CN, fontSize: 16, color: pal.subtle,
    align: 'center', italic: true,
  });

  // 大标题（仿老课本封面手写风）
  slide.addText(title, {
    x: 1, y: 2.0, w: 11.33, h: 1.8,
    fontFace: FONT_BOLD, fontSize: 60, color: pal.ink,
    bold: true, align: 'center', valign: 'middle',
    shadow: { type: 'outer', color: pal.accent, blur: 0, offset: 3, angle: 45, opacity: 0.35 },
  });

  // 朱砂红副标题
  if (subtitle) {
    slide.addText(subtitle, {
      x: 1, y: 4.0, w: 11.33, h: 0.8,
      fontFace: FONT_CN, fontSize: 24, color: pal.accent,
      align: 'center', italic: true,
    });
  }

  // 底部落款
  slide.addText(`—— ${author} 敬启 ——`, {
    x: 1, y: 6.2, w: 11.33, h: 0.5,
    fontFace: FONT_CN, fontSize: 14, color: pal.subtle,
    align: 'center',
  });

  // 右下印章
  drawStamp(slide, '敬呈', 11.4, 5.9, pal.accent);
}

function renderCoverAward(slide, { title, subtitle, author }, pal) {
  slide.background = { color: pal.bg };
  drawAwardBorder(slide, pal.frame);

  // 左右红双喜
  drawDoubleHappy(slide, 1.0, 0.9);
  drawDoubleHappy(slide, 11.4, 0.9);

  // 奖状顶部横批
  slide.addText('喜 报', {
    x: 1, y: 1.0, w: 11.33, h: 0.9,
    fontFace: FONT_BOLD, fontSize: 44, color: pal.accent,
    bold: true, align: 'center', letterSpacing: 20,
  });

  // 主标题
  slide.addText(title, {
    x: 0.8, y: 2.4, w: 11.73, h: 1.6,
    fontFace: FONT_BOLD, fontSize: 54, color: pal.accent,
    bold: true, align: 'center', valign: 'middle',
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 1, y: 4.3, w: 11.33, h: 0.8,
      fontFace: FONT_CN, fontSize: 22, color: pal.ink,
      align: 'center', italic: true,
    });
  }

  // 落款
  slide.addText(`颁发单位：${author}`, {
    x: 7, y: 5.8, w: 5.5, h: 0.4,
    fontFace: FONT_CN, fontSize: 14, color: pal.ink, align: 'left',
  });
  slide.addText(`公元 ${new Date().getFullYear()} 年`, {
    x: 7, y: 6.2, w: 5.5, h: 0.4,
    fontFace: FONT_CN, fontSize: 14, color: pal.ink, align: 'left',
  });

  // 大红印章
  drawStamp(slide, '荣誉之印', 10.5, 5.8, pal.accent);
}

function renderCoverQuotation(slide, { title, subtitle, author }, pal) {
  slide.background = { color: pal.bg };

  // 金色粗边框
  slide.addShape('rect', {
    x: 0.4, y: 0.4, w: 12.53, h: 6.7,
    line: { color: pal.frame, width: 3 }, fill: { type: 'none' },
  });
  slide.addShape('rect', {
    x: 0.7, y: 0.7, w: 11.93, h: 6.1,
    line: { color: pal.frame, width: 1 }, fill: { type: 'none' },
  });

  // 顶部五角星
  slide.addText('★', {
    x: 6.16, y: 0.8, w: 1, h: 1,
    fontFace: FONT_BOLD, fontSize: 60, color: pal.accent,
    bold: true, align: 'center',
  });

  // 大标题（毛体风用黑体加粗近似）
  slide.addText(title, {
    x: 1, y: 2.4, w: 11.33, h: 1.8,
    fontFace: FONT_BOLD, fontSize: 64, color: pal.ink,
    bold: true, align: 'center', valign: 'middle',
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 1, y: 4.4, w: 11.33, h: 0.8,
      fontFace: FONT_CN, fontSize: 22, color: pal.subtle,
      align: 'center',
    });
  }

  slide.addText(`—— ${author} 编 ——`, {
    x: 1, y: 6.2, w: 11.33, h: 0.5,
    fontFace: FONT_CN, fontSize: 14, color: pal.ink, align: 'center',
  });
}

function renderCoverCalendar(slide, { title, subtitle, author }, pal) {
  slide.background = { color: pal.bg };
  drawDoubleBorder(slide, pal.frame);

  // 顶部挂绳（模拟挂历悬挂）
  slide.addShape('line', {
    x: 6.0, y: 0.1, w: 1.33, h: 0.3,
    line: { color: pal.frame, width: 2 },
  });
  slide.addShape('ellipse', {
    x: 6.56, y: 0.3, w: 0.2, h: 0.2,
    fill: { color: pal.accent }, line: { color: pal.accent, width: 1 },
  });

  // 大号年份（挂历感）
  const year = new Date().getFullYear();
  slide.addText(String(year), {
    x: 1, y: 0.9, w: 11.33, h: 1.5,
    fontFace: FONT_BOLD, fontSize: 88, color: pal.green,
    bold: true, align: 'center', valign: 'middle',
  });

  // 主标题
  slide.addText(title, {
    x: 1, y: 2.8, w: 11.33, h: 1.5,
    fontFace: FONT_BOLD, fontSize: 42, color: pal.ink,
    bold: true, align: 'center', valign: 'middle',
  });

  if (subtitle) {
    slide.addText(subtitle, {
      x: 1, y: 4.5, w: 11.33, h: 0.8,
      fontFace: FONT_CN, fontSize: 20, color: pal.accent,
      align: 'center',
    });
  }

  slide.addText(`制作：${author}`, {
    x: 1, y: 6.3, w: 11.33, h: 0.4,
    fontFace: FONT_CN, fontSize: 14, color: pal.subtle, align: 'center',
  });
}

// ─── 内容页渲染 ───────────────────────────────────────

function renderContentTextbook(slide, { title, bullets, note }, pal, pageNo) {
  slide.background = { color: pal.bg };
  drawGridBackground(slide, pal.grid);
  drawDoubleBorder(slide, pal.frame);

  // 页码 / 课次（左上）
  slide.addText(`第 ${pageNo} 课`, {
    x: 0.7, y: 0.6, w: 2, h: 0.4,
    fontFace: FONT_CN, fontSize: 14, color: pal.accent, italic: true,
  });

  // 标题下加红色下划线
  slide.addText(title, {
    x: 0.8, y: 1.0, w: 11.73, h: 0.9,
    fontFace: FONT_BOLD, fontSize: 34, color: pal.ink,
    bold: true, align: 'left', valign: 'middle',
  });
  slide.addShape('line', {
    x: 0.8, y: 1.95, w: 11.73, h: 0,
    line: { color: pal.accent, width: 2 },
  });

  // Bullets
  const bulletText = (bullets || []).map((b) => ({
    text: b,
    options: {
      bullet: { code: '25CF' },
      breakLine: true,
    },
  }));
  slide.addText(bulletText, {
    x: 1.2, y: 2.2, w: 11.0, h: 4.2,
    fontFace: FONT_CN, fontSize: 22, color: pal.ink,
    paraSpaceAfter: 14, valign: 'top',
  });

  // 页脚
  slide.addText(note || `—— 第 ${pageNo} 页 ——`, {
    x: 0.8, y: 6.7, w: 11.73, h: 0.4,
    fontFace: FONT_CN, fontSize: 12, color: pal.subtle,
    align: 'center', italic: true,
  });
}

function renderContentAward(slide, { title, bullets, note }, pal, pageNo) {
  slide.background = { color: pal.bg };
  drawAwardBorder(slide, pal.frame);

  slide.addText(title, {
    x: 0.8, y: 0.9, w: 11.73, h: 0.9,
    fontFace: FONT_BOLD, fontSize: 34, color: pal.accent,
    bold: true, align: 'center', valign: 'middle',
  });

  const bulletText = (bullets || []).map((b) => ({
    text: b,
    options: {
      bullet: { code: '2605' },  // ★
      breakLine: true,
    },
  }));
  slide.addText(bulletText, {
    x: 1.5, y: 2.2, w: 10.33, h: 4.0,
    fontFace: FONT_CN, fontSize: 22, color: pal.ink,
    paraSpaceAfter: 16, valign: 'top',
  });

  // 页脚
  slide.addText(note || `—— 第 ${pageNo} 篇 ——`, {
    x: 0.8, y: 6.7, w: 11.73, h: 0.4,
    fontFace: FONT_CN, fontSize: 12, color: pal.subtle, align: 'center',
  });
}

function renderContentQuotation(slide, { title, bullets, note }, pal, pageNo) {
  slide.background = { color: pal.bg };

  // 金色边框
  slide.addShape('rect', {
    x: 0.4, y: 0.4, w: 12.53, h: 6.7,
    line: { color: pal.frame, width: 2.5 }, fill: { type: 'none' },
  });

  // 标题
  slide.addText(title, {
    x: 0.8, y: 0.8, w: 11.73, h: 1.0,
    fontFace: FONT_BOLD, fontSize: 32, color: pal.accent,
    bold: true, align: 'center', valign: 'middle',
  });

  // 分隔线
  slide.addShape('line', {
    x: 3, y: 1.9, w: 7.33, h: 0,
    line: { color: pal.accent, width: 1.5 },
  });

  const bulletText = (bullets || []).map((b) => ({
    text: `「 ${b} 」`,
    options: {
      breakLine: true,
    },
  }));
  slide.addText(bulletText, {
    x: 1.2, y: 2.2, w: 10.93, h: 4.2,
    fontFace: FONT_CN, fontSize: 24, color: pal.ink,
    paraSpaceAfter: 18, align: 'center', valign: 'top',
  });

  slide.addText(note || `—— 语录 · 第 ${pageNo} 则 ——`, {
    x: 0.8, y: 6.7, w: 11.73, h: 0.4,
    fontFace: FONT_CN, fontSize: 12, color: pal.subtle, align: 'center',
  });
}

function renderContentCalendar(slide, { title, bullets, note }, pal, pageNo) {
  slide.background = { color: pal.bg };
  drawDoubleBorder(slide, pal.frame);

  // 左侧大号"日"字块（模拟挂历日期格）
  slide.addShape('rect', {
    x: 0.8, y: 1.0, w: 2.6, h: 5.4,
    fill: { color: pal.green }, line: { color: pal.green, width: 0 },
  });
  slide.addText(String(pageNo).padStart(2, '0'), {
    x: 0.8, y: 1.4, w: 2.6, h: 2.0,
    fontFace: FONT_BOLD, fontSize: 96, color: 'FFFFFF',
    bold: true, align: 'center', valign: 'middle',
  });
  slide.addText('第 ' + pageNo + ' 页', {
    x: 0.8, y: 3.6, w: 2.6, h: 0.5,
    fontFace: FONT_CN, fontSize: 14, color: 'FFFFFF', align: 'center',
  });
  slide.addShape('line', {
    x: 1.1, y: 4.2, w: 2.0, h: 0,
    line: { color: pal.accent, width: 2 },
  });
  slide.addText('CLAWPET', {
    x: 0.8, y: 4.4, w: 2.6, h: 0.5,
    fontFace: FONT_BOLD, fontSize: 14, color: 'FFFFFF', bold: true, align: 'center',
  });

  // 右侧标题 + 内容
  slide.addText(title, {
    x: 3.8, y: 1.0, w: 8.73, h: 0.9,
    fontFace: FONT_BOLD, fontSize: 30, color: pal.green,
    bold: true, align: 'left', valign: 'middle',
  });
  slide.addShape('line', {
    x: 3.8, y: 1.95, w: 8.73, h: 0,
    line: { color: pal.accent, width: 1.5 },
  });

  const bulletText = (bullets || []).map((b) => ({
    text: b,
    options: {
      bullet: { code: '25A0' },  // ■
      breakLine: true,
    },
  }));
  slide.addText(bulletText, {
    x: 4.0, y: 2.2, w: 8.5, h: 4.2,
    fontFace: FONT_CN, fontSize: 20, color: pal.ink,
    paraSpaceAfter: 14, valign: 'top',
  });

  slide.addText(note || `—— ${new Date().getFullYear()} 挂历 ——`, {
    x: 3.8, y: 6.7, w: 8.73, h: 0.4,
    fontFace: FONT_CN, fontSize: 12, color: pal.subtle, align: 'center',
  });
}

// ─── 模板分派 ───────────────────────────────────────

const COVER_RENDERERS = {
  textbook:  renderCoverTextbook,
  award:     renderCoverAward,
  quotation: renderCoverQuotation,
  calendar:  renderCoverCalendar,
};

const CONTENT_RENDERERS = {
  textbook:  renderContentTextbook,
  award:     renderContentAward,
  quotation: renderContentQuotation,
  calendar:  renderContentCalendar,
};

// ─── 主生成函数 ───────────────────────────────────────

async function generatePpt(options) {
  const {
    title,
    subtitle = '',
    author = 'ClawPet',
    template = 'textbook',
    slides = [],
    outputPath,
  } = options || {};

  if (!title || typeof title !== 'string') {
    throw new Error('必须提供 title（演示文稿主标题）');
  }
  if (!Array.isArray(slides) || slides.length === 0) {
    throw new Error('必须提供 slides 数组，且至少包含 1 页');
  }
  if (!COVER_RENDERERS[template]) {
    throw new Error(`未知模板：${template}，可选：textbook/award/quotation/calendar`);
  }

  const pal = PALETTE[template];
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 英寸
  pptx.title = title;
  pptx.author = author;
  pptx.company = author;
  pptx.subject = subtitle || title;

  // 封面
  const cover = pptx.addSlide();
  COVER_RENDERERS[template](cover, { title, subtitle, author }, pal);

  // 内容页
  slides.forEach((s, idx) => {
    const slide = pptx.addSlide();
    CONTENT_RENDERERS[template](
      slide,
      {
        title: s.title || `第 ${idx + 1} 章`,
        bullets: Array.isArray(s.bullets) ? s.bullets : [],
        note: s.note,
      },
      pal,
      idx + 1
    );
  });

  return { pptx, slideCount: slides.length + 1 };
}

// ─── 工具入口：execute(input, context) ────────────────

async function execute(input, context) {
  try {
    const { pptx, slideCount } = await generatePpt(input);

    // 决定输出路径
    let outPath = input?.outputPath;
    if (!outPath) {
      const baseDir = (context && context.dataDir) || process.cwd();
      ensureDir(baseDir);
      const fname = `${safeFilename(input?.title)}_${nowStamp()}.pptx`;
      outPath = path.join(baseDir, fname);
    } else {
      ensureDir(path.dirname(outPath));
    }

    await pptx.writeFile({ fileName: outPath });

    return {
      success: true,
      filePath: outPath,
      slideCount,
      template: input?.template || 'textbook',
      message: `已生成 ${slideCount} 页 80 年代风格 PPT，保存到：${outPath}`,
    };
  } catch (err) {
    return {
      success: false,
      error: err && err.message ? err.message : String(err),
    };
  }
}

// ─── 导出 ───────────────────────────────────────────

module.exports = {
  execute,
  generatePpt,       // 便于测试
  PALETTE,
};
