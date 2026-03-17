'use strict';

const blessed  = require('blessed');
const figlet   = require('figlet');
const path     = require('path');
const fs       = require('fs');

const { CONFIG }       = require('../config/settings');
const { imageToAscii } = require('../config/converter');

// ── Color Theme ───────────────────────────────────────────
// A curated palette for a premium, mysterious purple terminal aesthetic
const C = {
  bg:     '#130a21', // Deep dark plum/mysterious purple
  bg2:    '#1c0f2e', // Slightly lighter purple
  bg3:    '#2b1b42', // Highlight purple
  border: '#452c63', // Soft purple borders
  text:   '#e6d5f7', // Soft off-white with purple tint
  muted:  '#997db8', // Muted pastel purple
  dim:    '#5c457a', // Dim purple
  accent: '#ff7eb6', // Cute pastel pink/magenta
  green:  '#82ebb3', // Soft mint green
  blue:   '#a3b8ff', // Soft pastel blue
  yellow: '#ffdb70', // Soft warm yellow
  cyan:   '#7cd5f2', // Soft pastel cyan
};



// ── Helpers ───────────────────────────────────────────────

/** Escape blessed tag-like braces in user-supplied strings */
function esc(str) {
  return String(str ?? '').replace(/{/g, '{open}').replace(/}/g, '{close}');
}

function makeFiglet(text, font) {
  try {
    return figlet.textSync(String(text), { font: String(font), horizontalLayout: 'fitted' });
  } catch {
    return String(text);
  }
}

function tabBarContent(active) {
  const tabs = ['home', 'about', 'work', 'projects', 'contact'];
  const items = tabs.map(t => {
    if (t === active) return `{${C.accent}-fg}{bold}[ ${t.toUpperCase()} ]{/}`; // Accent active tab
    return `{${C.dim}-fg}  ${t}  {/}`;
  });
  return '  ' + items.join('   ') + ` {|}  {${C.dim}-fg}[ bash ]{/} `;
}

// ── Main UI ───────────────────────────────────────────────
async function createUI(stream, ptyInfo) {

  // Load ASCII portrait — prefer handcrafted profile.txt, fallback to auto-convert
  const assetsDir = path.join(__dirname, '..', 'assets');
  let profileTxt = path.join(assetsDir, 'profile.txt');
  if (!fs.existsSync(profileTxt)) {
    profileTxt = path.join(assetsDir, 'profilePic.txt');
  }
  
  let portrait = '';

  if (fs.existsSync(profileTxt)) {
    portrait = fs.readFileSync(profileTxt, 'utf8').trimEnd();
  } else {
    // Auto-generate from image if no .txt file found
    const imgExts = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff'];
    let foundImg = null;
    if (fs.existsSync(assetsDir)) {
      const entries = fs.readdirSync(assetsDir);
      for (const entry of entries) {
        if (imgExts.includes(path.extname(entry).toLowerCase())) {
          foundImg = path.join(assetsDir, entry);
          break;
        }
      }
    }
    if (foundImg) {
      try { 
        // Use a slightly larger width for auto-convert to capture more detail
        portrait = await imageToAscii(foundImg, { width: 45, charset: 'block', invert: false }); 
      }
      catch { /* empty */ }
    }
  }

  const portraitLines = portrait.split('\n');
  const PORTRAIT_WIDTH = Math.max(...portraitLines.map(l => l.length), 20);
  const PORTRAIT_BOX_WIDTH = PORTRAIT_WIDTH + 2;
  const BIO_LEFT = 2 + PORTRAIT_BOX_WIDTH + 1;
  const BIO_WIDTH = `100%-${BIO_LEFT + 2}`;

  const nameArt = makeFiglet(CONFIG.name, CONFIG.figletFont);
  const nameArtLines = nameArt.split('\n');
  const nameArtHeight = nameArtLines.length + 1;

  // ── Screen ────────────────────────────────────────────
  const screen = blessed.screen({
    input:       stream,
    output:      stream,
    terminal:    ptyInfo.term || 'xterm-256color',
    fullUnicode: true,
    smartCSR:    true,
    useBCE:      true,
    title:       `${CONFIG.handle}@personal`,
  });

  // ── UI State ─────────────────────────────────────────────
  let currentTab = 'home';     // Currently active content section
  let termMode   = false;      // Whether we are in 'bash' mode
  let cmdHistory = [];         // Stores previously run commands
  let histIdx    = -1;         // Index for history navigation (arrow keys)
  let inputBuf   = '';         // Current characters being typed

  // ── Layout Components ─────────────────────────────────────
  
  // The very top bar showing status icons and name
  const titleBar = blessed.box({
    parent: screen,
    top: 0, left: 0, width: '100%', height: 1,
    tags: true,
    content: ` {${C.accent}-fg}♥{/} {${C.yellow}-fg}★{/} {${C.green}-fg}✧{/}   {${C.text}-fg}{bold}Terminal{/}: {${C.accent}-fg}${CONFIG.handle}@personal{/} — ~{/}{|}{${C.dim}-fg}ssh://connect {/}`,
    style: { bg: C.bg3 },
  });

  const topSpacer = blessed.box({
    parent: screen,
    top: 1, left: 0, width: '100%', height: 1,
    tags: true,
    style: { bg: C.bg }, // match deep purple background
  });

  const tabBar = blessed.box({
    parent: screen,
    top: 2, left: 0, width: '100%', height: 1,
    tags: true,
    style: { bg: C.bg2, transparent: false },
  });

  // Main scrolling content area where sections (About, Work, etc) are displayed
  const contentArea = blessed.box({
    parent: screen,
    top: 3, left: 0, width: '100%', height: '100%-5',
    style: { bg: C.bg },
  });

  const inputRow = blessed.box({
    parent: screen,
    bottom: 1, left: 0, width: '100%', height: 1,
    tags: true,
    style: { bg: C.bg2 },
  });

  const statusBar = blessed.box({
    parent: screen,
    bottom: 0, left: 0, width: '100%', height: 1,
    tags: true,
    style: { bg: C.bg3 },
  });

  // ── Home pane ─────────────────────────────────────────
  const homePane = blessed.box({
    parent: contentArea,
    top: 0, left: 0, width: '100%', height: '100%',
    hidden: false,
    tags: true,
    style: { bg: C.bg },
  });

  // Welcome message with name art
  blessed.box({
    parent: homePane,
    top: '20%', left: 0, width: '100%', height: nameArtHeight,
    content: nameArt,
    align: 'center',
    tags: false,
    style: { fg: C.accent, bg: C.bg },
  });

  blessed.box({
    parent: homePane,
    top: '20%+' + (nameArtHeight + 2), left: 'center', width: 'shrink', height: 1,
    content: `{${C.text}-fg}Welcome to my terminal portfolio{/}`,
    align: 'center',
    tags: true,
    style: { bg: C.bg },
  });

  blessed.box({
    parent: homePane,
    top: '20%+' + (nameArtHeight + 4), left: 'center', width: 'shrink', height: 1,
    content: `{${C.dim}-fg}Press [TAB] to navigate or type 'help' below{/}`,
    align: 'center',
    tags: true,
    style: { bg: C.bg },
  });

  blessed.box({
    parent: homePane,
    bottom: 2, left: 'center', width: 'shrink', height: 1,
    content: `{${C.accent}-fg}Pro Tip:{/} {${C.muted}-fg}Maximize terminal for full 110-char HD detail!{/}`,
    align: 'center',
    tags: true,
    style: { bg: C.bg },
  });

  // ── About pane ────────────────────────────────────────
  const aboutPane = blessed.box({
    parent: contentArea,
    top: 0, left: 0, width: '100%', height: '100%',
    hidden: true,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    tags: true,
    scrollbar: { ch: '▌', style: { fg: C.dim } },
    style: { bg: C.bg },
  });

  // Big figlet name at the top
  blessed.box({
    parent: aboutPane,
    top: 1, left: 2, width: '100%-4', height: nameArtHeight,
    content: nameArt,
    tags: false,
    style: { fg: C.accent, bg: C.bg },
  });

  // Portrait on the left, below the name art
  const portraitHeight = portraitLines.length + 1;
  blessed.box({
    parent: aboutPane,
    top: nameArtHeight + 2, left: 2, width: PORTRAIT_BOX_WIDTH, height: portraitHeight,
    content: portrait,
    tags: false,
    style: { fg: C.text, bg: C.bg },
  });

  // Bio on the right
  const bioBox = blessed.box({
    parent: aboutPane,
    top: nameArtHeight + 2, left: BIO_LEFT, width: BIO_WIDTH, height: '100%-' + (nameArtHeight + 4),
    tags: true,
    scrollable: true,
    style: { fg: C.text, bg: C.bg },
  });

  bioBox.setContent([
    `{${C.blue}-fg}const{/} {${C.text}-fg}developer{/} {${C.cyan}-fg}={/} {`,
    `  {${C.accent}-fg}name:{/} {${C.green}-fg}'${esc(CONFIG.name)}'{/},`,
    `  {${C.accent}-fg}role:{/} {${C.green}-fg}'${esc(CONFIG.title)}'{/},`,
    `  {${C.accent}-fg}base:{/} {${C.green}-fg}'${esc(CONFIG.location)}'{/},`,
    `  {${C.accent}-fg}skills:{/} [`,
    `    {${C.green}-fg}'Node.js'{/}, {${C.green}-fg}'Java'{/}, {${C.green}-fg}'Python'{/},`,
    `    {${C.green}-fg}'Machine Learning'{/}, {${C.green}-fg}'REST APIs'{/}`,
    `  ],`,
    `  {${C.accent}-fg}status:{/} {${C.yellow}-fg}'Building Clinical DSS & ML Systems'{/}`,
    `};`,
    '',
    `{${C.dim}-fg}// ${esc(CONFIG.bio[0])}{/}`,
    `{${C.dim}-fg}// ${esc(CONFIG.bio[1])}{/}`,
    '',
    `{${C.dim}-fg}${'─'.repeat(28)}{/}`,
    `{${C.muted}-fg}> type {/}{${C.accent}-fg}help{/}{${C.muted}-fg} to explore{/}`,
    `{${C.muted}-fg}> tab / click to navigate {/}`,
  ].join('\n'));

  // ── Contact pane ──────────────────────────────────────
  const contactPane = blessed.box({
    parent: contentArea,
    top: 0, left: 0, width: '100%', height: '100%',
    hidden: true,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    tags: true,
    scrollbar: { ch: '▌', style: { fg: C.dim } },
    style: { bg: C.bg },
  });

  const LINK_ICONS = {
    github:   '★',
    email:    '✉',
    linkedin: '⚙',
    phone:    '☏'
  };

  const linksContent = [
    `\n  {${C.accent}-fg}// Where to find me{/}\n`,
  ];

  CONFIG.links.forEach((l) => {
    const icon = LINK_ICONS[l.label.toLowerCase()] || '❖';
    linksContent.push(
      `  {${C.accent}-fg}♥{/} {${C.text}-fg}${icon} ${esc(l.label)}{/}`,
      `    {${C.muted}-fg}→ ${esc(l.url)}{/}\n`
    );
  });
  
  contactPane.setContent(linksContent.join('\n'));

  // ── Work pane ─────────────────────────────────────────
  const workPane = blessed.box({
    parent: contentArea,
    top: 0, left: 0, width: '100%', height: '100%',
    hidden: true,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    tags: true,
    scrollbar: { ch: '▌', style: { fg: C.dim } },
    style: { bg: C.bg },
  });

  const workContent = [
    `\n  {${C.accent}-fg}// Professional Timeline...{/}\n`,
  ];

  // Wrap text to fit inside the box (box is 58 chars wide, minus "│ " prefix = ~54 usable)
  const BOX_WIDTH = 58;
  const BOX_INNER = 54;

  function wrapText(text, maxLen) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const word of words) {
      if (cur.length + word.length + 1 > maxLen && cur.length > 0) {
        lines.push(cur);
        cur = word;
      } else {
        cur = cur ? cur + ' ' + word : word;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }

  // Strip blessed tags to get visible character count
  function visLen(str) {
    return str.replace(/\{[^}]*\}/g, '').length;
  }

  // Build a box line: "  │ <content padded to BOX_WIDTH> │"
  function boxLine(content) {
    const inner = `  {${C.dim}-fg}│{/} ${content}`;
    const vis = visLen(inner);
    // We want total visible width = 2 + 1 + BOX_WIDTH + 1 = 62 (matching "  ╭───...───╮")
    const targetVis = 2 + BOX_WIDTH + 2; // "  " + box content + "  "
    const pad = Math.max(0, targetVis - vis - 1); // -1 for closing │
    return inner + ' '.repeat(pad) + `{${C.dim}-fg}│{/}`;
  }

  CONFIG.work.forEach((w) => {
    const period = w.duration ?? w.year ?? '';
    const descLines = wrapText(esc(w.desc), BOX_INNER);
    const techLines = wrapText(esc(w.tech), BOX_INNER - 9);

    workContent.push(
      `  {${C.dim}-fg}╭${'─'.repeat(BOX_WIDTH)}╮{/}`
    );
    workContent.push(boxLine(`{${C.accent}-fg}✿{/} {${C.text}-fg}{bold}${esc(w.name)}{/}`));
    workContent.push(boxLine(`{${C.cyan}-fg}Timeline:{/} {${C.muted}-fg}${esc(period)}{/}`));
    // Tech stack (possibly wrapped)
    workContent.push(boxLine(`{${C.cyan}-fg}Stack:   {/} {${C.green}-fg}${techLines[0]}{/}`));
    for (let i = 1; i < techLines.length; i++) {
      workContent.push(boxLine(`         {${C.green}-fg}${techLines[i]}{/}`));
    }
    // Description (wrapped)
    for (const dl of descLines) {
      workContent.push(boxLine(`{${C.dim}-fg}${dl}{/}`));
    }
    workContent.push(
      `  {${C.dim}-fg}╰${'─'.repeat(BOX_WIDTH)}╯{/}\n`
    );
  });
  workPane.setContent(workContent.join('\n'));

  // ── Projects pane ─────────────────────────────────────
  const projectsPane = blessed.box({
    parent: contentArea,
    top: 0, left: 0, width: '100%', height: '100%',
    hidden: true,
    scrollable: true,
    alwaysScroll: true,
    keys: true,
    vi: true,
    tags: true,
    scrollbar: { ch: '▌', style: { fg: C.dim } },
    style: { bg: C.bg },
  });

  const projContent = [
    `\n  {${C.accent}-fg}// Recent builds & experiments...{/}\n`,
  ];

  if (Array.isArray(CONFIG.projects) && CONFIG.projects.length) {
    CONFIG.projects.forEach((p) => {
      const period = p.duration ?? p.year ?? '';
      projContent.push(
        `  {${C.accent}-fg}✮{/}  {${C.text}-fg}{bold}${esc(p.name)}{/}`,
        `      {${C.dim}-fg}built in ${esc(period)}{/}`,
        `      {${C.blue}-fg}[ ${esc(p.tech)} ]{/}`,
        `      {${C.muted}-fg}${esc(p.desc)}{/}\n`
      );
    });
  } else {
    projContent.push(`  {${C.dim}-fg}// No projects listed...{/}`);
  }
  projectsPane.setContent(projContent.join('\n'));

  // ── Terminal pane ─────────────────────────────────────
  const termPane = blessed.box({
    parent: contentArea,
    top: 0, left: 0, width: '100%', height: '100%',
    hidden: true,
    style: { bg: C.bg },
  });

  const termLog = blessed.log({
    parent: termPane,
    top: 0, left: 0, width: '100%', height: '100%',
    tags: true,
    scrollable: true,
    alwaysScroll: true,
    scrollbar: { ch: '▌', style: { fg: C.dim } },
    style: { fg: C.text, bg: C.bg },
  });

  // ── UI update helpers ─────────────────────────────────
  function updateTabBar() {
    tabBar.setContent(tabBarContent(termMode ? '' : currentTab));
    screen.render();
  }

  let blinkState = true;
  function updateInput() {
    const cursor = blinkState ? `█` : `_`;
    inputRow.setContent(
      ` {${C.accent}-fg}✧{/} {${C.cyan}-fg}♡{/} {${C.dim}-fg}${termMode ? '$' : '❯'}{/} ${esc(inputBuf)}{${C.accent}-fg}${cursor}{/}`
    );
    screen.render();
  }

  const cuteFrames = ['(◡‿◡✿)', '(◕‿◕✿)', '(◠‿◠✿)', '(◕‿◕✿)'];
  let cuteFrameIdx = 0;

  function updateStatus() {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const anim = cuteFrames[cuteFrameIdx % cuteFrames.length];
    statusBar.setContent(
      ` {${C.dim}-fg}↑↓ scroll (tabs)  ·  Ctrl+↑↓ = history  ·  tab = switch section  ·  PgUp/PgDn = scroll  ·  ? help{/}{|}{${C.accent}-fg}${anim}{/}  {${C.muted}-fg}${termMode ? 'terminal' : currentTab}  ${time} {/}`
    );
    screen.render();
  }

  function showPane(name) {
    homePane.hidden     = name !== 'home';
    aboutPane.hidden    = name !== 'about';
    contactPane.hidden  = name !== 'contact';
    workPane.hidden     = name !== 'work';
    projectsPane.hidden = name !== 'projects';
    termPane.hidden     = name !== 'terminal';
  }

  function switchTab(name) {
    if (!['home', 'about', 'contact', 'work', 'projects'].includes(name)) return;
    termMode   = false;
    currentTab = name;
    showPane(name);
    updateTabBar();
    screen.render();
  }

  function enterTermMode() {
    termMode = true;
    showPane('terminal');
    updateTabBar();
    screen.render();
  }

  // ── Command system ────────────────────────────────────
  function tlog(line) { termLog.log(line); }

  const COMMANDS = {
    help() {
      tlog('');
      tlog(`{${C.muted}-fg}available commands:{/}`);
      tlog('');
      const rows = [
        ['home',    'show home section'],
        ['about',   'show about section'],
        ['contact', 'show contact section'],
        ['work',    'show work section'],
        ['projects','show projects section'],
        ['whoami',  'print name & title'],
        ['ls',      'list sections'],
        ['pwd',     'print working path'],
        ['date',    'print current date/time'],
        ['echo',    'echo arguments'],
        ['banner',  'banner <text> [font]  — render figlet ASCII'],
        ['fonts',   'list figlet fonts'],
        ['convert', 'convert <path> [block|dense|fade]  — convert image to ASCII art'],
        ['neofetch','system info'],
        ['clear',   'clear terminal output'],
        ['exit',    'exit terminal mode'],
      ];
      rows.forEach(([c, d]) =>
        tlog(`  {${C.accent}-fg}${c.padEnd(12)}{/}{${C.muted}-fg}${d}{/}`)
      );
      tlog('');
    },

    whoami() {
      tlog(CONFIG.name);
      tlog(CONFIG.title);
      tlog(CONFIG.location);
    },

    ls() { tlog('home/  about/  contact/  work/  projects/'); },

    pwd() { tlog(`/home/${CONFIG.handle}`); },

    date() { tlog(new Date().toString()); },

    echo(args) { tlog(esc(args.join(' '))); },

    banner(args) {
      const text = args[0] ?? CONFIG.name;
      const font = args[1] ?? CONFIG.figletFont;
      try {
        const art = figlet.textSync(text, { font });
        tlog('');
        art.split('\n').forEach(l => tlog(`{${C.accent}-fg}${esc(l)}{/}`));
        tlog('');
      } catch {
        tlog(`{red-fg}✗ font "${esc(font)}" not found — try: fonts{/}`);
      }
    },

    fonts() {
      tlog('');
      tlog(`{${C.muted}-fg}favourite fonts:{/}`);
      [
        ['Flower Power', 'elegant flowery script (Your favorite!)'],
        ['Big',       'clean, readable, good default'],
        ['Banner3',   'bold thick strokes'],
        ['Ogre',      'ornate fantasy style'],
        ['Puffy',     'rounded bubbly letters'],
        ['Standard',  'compact, classic'],
        ['Star Wars', 'wide, iconic'],
        ['Stop',      'dense block style'],
        ['Wideterm',  'wide spaced, techy'],
      ].forEach(([f, d]) =>
        tlog(`  {${C.green}-fg}${f.padEnd(13)}{/}{${C.muted}-fg}${d}{/}`)
      );
      tlog('');
      tlog(`{${C.muted}-fg}usage: {/}banner "Hello" Big`);
      tlog('');
    },

    async convert(args) {
      const CHARSETS = ['block', 'dense', 'fade'];
      let charset = 'dense';
      const pathTokens = [];

      for (const arg of args) {
        if (CHARSETS.includes(arg.toLowerCase())) { charset = arg.toLowerCase(); }
        else if (arg)                             { pathTokens.push(arg); }
      }

      // Join remaining tokens so unquoted paths with spaces still work
      const imgArg = pathTokens.length ? pathTokens.join(' ') : null;

      // Resolve path: absolute, relative to cwd, or default
      let imgPath;
      if (imgArg) {
        imgPath = path.isAbsolute(imgArg)
          ? imgArg
          : path.resolve(process.cwd(), imgArg);
      } else {
        imgPath = path.join(__dirname, '..', 'assets', 'photo.jpg');
      }

      if (!fs.existsSync(imgPath)) {
        tlog(`{red-fg}✗ file not found: ${esc(imgPath)}{/}`);
        tlog(`{${C.muted}-fg}usage: convert <path> [block|dense|fade]{/}`);
        tlog(`{${C.muted}-fg}       convert ~/photo.jpg dense{/}`);
        return;
      }

      tlog(`{${C.muted}-fg}converting: ${esc(imgPath)}{/}`);
      tlog(`{${C.muted}-fg}charset: ${charset}…{/}`);
      screen.render();

      try {
        const art = await imageToAscii(imgPath, { width: 60, charset });
        tlog('');
        art.split('\n').forEach(l => tlog(`{${C.muted}-fg}${esc(l)}{/}`));
        tlog('');

        // Save to <image-basename>.txt next to the source image
        const outPath = imgPath.replace(/\.[^.]+$/, '') + '.txt';
        fs.writeFileSync(outPath, art, 'utf8');
        tlog(`{${C.green}-fg}✓ saved → ${esc(outPath)}{/}`);
      } catch (err) {
        tlog(`{red-fg}✗ ${esc(err.message)}{/}`);
      }
    },

    neofetch() {
      const lines = [
        '',
        `  {${C.accent}-fg}${esc(CONFIG.handle)}{/}{${C.muted}-fg}@personal{/}`,
        `  {${C.dim}-fg}${'─'.repeat(25)}{/}`,
        `  {${C.muted}-fg}name    {/} ${esc(CONFIG.name)}`,
        `  {${C.muted}-fg}role    {/} ${esc(CONFIG.title)}`,
        `  {${C.muted}-fg}location{/} ${esc(CONFIG.location)}`,
        `  {${C.muted}-fg}links   {/} ${CONFIG.links.length} configured`,
        `  {${C.muted}-fg}work    {/} ${CONFIG.work.length} listed`,
        `  {${C.muted}-fg}projects{/} ${Array.isArray(CONFIG.projects) ? CONFIG.projects.length : 0} listed`,
        `  {${C.muted}-fg}shell   {/} bash`,
        `  {${C.muted}-fg}theme   {/} terminal-dark`,
        `  {${C.muted}-fg}font    {/} JetBrains Mono`,
        '',
      ];
      lines.forEach(l => tlog(l));
    },

    clear() { termLog.setContent(''); screen.render(); },

    exit() { switchTab(currentTab || 'about'); },

    sudo() { tlog(`{red-fg}nice try.{/}`); },
  };

  /**
   * Parse a command line into tokens, respecting single- and double-quoted
   * strings so paths with spaces work: convert "D:\My Pics\me.jpg"
   */
  function parseArgs(raw) {
    const tokens = [];
    let cur = '';
    let quote = null;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (quote) {
        if (ch === quote) { quote = null; }
        else { cur += ch; }
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (ch === ' ' || ch === '\t') {
        if (cur) { tokens.push(cur); cur = ''; }
      } else {
        cur += ch;
      }
    }
    if (cur) tokens.push(cur);
    return tokens;
  }

  function runCommand(raw) {
    const parts = parseArgs(raw.trim());
    const cmd   = parts[0].toLowerCase();
    const args  = parts.slice(1);

    if (['home', 'about', 'contact', 'work', 'projects'].includes(cmd)) {
      switchTab(cmd);
      return;
    }

    if (!termMode) enterTermMode();

    tlog(`{${C.green}-fg}▶ ~${esc('$')}{/} {${C.text}-fg}${esc(raw)}{/}`);

    const handler = COMMANDS[cmd];
    if (handler) {
      const result = handler(args);
      if (result instanceof Promise) {
        result.then(() => screen.render()).catch((err) => {
          tlog(`{red-fg}✗ ${esc(err.message)}{/}`);
          screen.render();
        });
      }
    } else {
      tlog(`{red-fg}command not found: ${esc(cmd)}{/} — try 'help'`);
    }

    screen.render();
  }

  // ── Keyboard handling ─────────────────────────────────
  screen.on('keypress', (ch, key) => {
    if (!key) return;

    // Hard exit
    if (key.ctrl && key.name === 'c') {
      stream.end();
      try { screen.destroy(); } catch { /* ignore */ }
      return;
    }

    if (key.name === 'return' || key.name === 'enter') {
      const cmd = inputBuf.trim();
      inputBuf = '';
      updateInput();
      if (cmd) {
        cmdHistory.unshift(cmd);
        histIdx = -1;
        runCommand(cmd);
      }
      return;
    }

    if (key.name === 'backspace') {
      inputBuf = inputBuf.slice(0, -1);
      updateInput();
      return;
    }

    // Global history navigation without breaking tab scrolling.
    if (key.ctrl && (key.name === 'up' || key.name === 'down')) {
      if (!termMode) enterTermMode();
      if (key.name === 'up') {
        if (histIdx < cmdHistory.length - 1) histIdx++;
      } else {
        histIdx = Math.max(-1, histIdx - 1);
      }
      inputBuf = histIdx >= 0 ? (cmdHistory[histIdx] ?? '') : '';
      updateInput();
      return;
    }

    if (termMode && key.name === 'up') {
      if (histIdx < cmdHistory.length - 1) histIdx++;
      inputBuf = cmdHistory[histIdx] ?? '';
      updateInput();
      return;
    }

    if (termMode && key.name === 'down') {
      histIdx = Math.max(-1, histIdx - 1);
      inputBuf = histIdx >= 0 ? (cmdHistory[histIdx] ?? '') : '';
      updateInput();
      return;
    }

    // Scroll content panes while browsing tabs (avoid hijacking command history).
    if (!termMode && (key.name === 'up' || key.name === 'down' || key.name === 'pageup' || key.name === 'pagedown')) {
      const pane =
        currentTab === 'about' ? bioBox :
        currentTab === 'contact' ? contactPane :
        currentTab === 'work' ? workPane :
        currentTab === 'projects' ? projectsPane :
        null;
      if (pane) {
        const delta =
          key.name === 'up' ? -1 :
          key.name === 'down' ? 1 :
          key.name === 'pageup' ? -4 :
          4;
        pane.scroll(delta);
        screen.render();
        return;
      }
    }

    // Tab key cycles sections
    if (key.name === 'tab' && !termMode) {
      const tabs = ['home', 'about', 'contact', 'work', 'projects'];
      switchTab(tabs[(tabs.indexOf(currentTab) + 1) % tabs.length]);
      return;
    }

    // Printable character
    if (ch && !key.ctrl && !key.meta && ch.length === 1) {
      inputBuf += ch;
      updateInput();
    }
  });

  // ── Clock & Animation Loop ────────────────────────────
  const clock = setInterval(() => { 
    blinkState = !blinkState;
    cuteFrameIdx++;
    updateInput();
    updateStatus(); 
  }, 500);

  stream.on('close', () => {
    clearInterval(clock);
    try { screen.destroy(); } catch { /* ignore */ }
  });

  // ── First render ──────────────────────────────────────
  updateTabBar();
  updateInput();
  updateStatus();
  screen.render();

  return { screen };
}

module.exports = { createUI };
