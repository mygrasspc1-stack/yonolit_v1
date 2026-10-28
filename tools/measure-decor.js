const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9345;
const URL = process.argv[2] || 'http://127.0.0.1:8080/services.html';
const W = parseInt(process.argv[3] || '1440', 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(os.tmpdir(), 'cdp-m-' + Date.now()),
    '--window-size=' + W + ',900', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  let list = null;
  for (let i = 0; i < 40; i++) { await sleep(500); try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) break; } catch (_) {} }
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } };
  await new Promise((r) => { ws.onopen = r; });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('timeout ' + method)); } }, 60000); });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: URL });
  await sleep(12000);
  const r = await send('Runtime.evaluate', {
    expression: `(() => {
      const blk = document.querySelector('article#decor');
      const fig = blk.querySelector('.svc-media');
      const img = fig.querySelector('img');
      const body = blk.querySelector('.svc-body');
      const rb = (el) => { const b = el.getBoundingClientRect(); return Math.round(b.width) + 'x' + Math.round(b.height); };
      return JSON.stringify({
        tag: blk.tagName + '.' + blk.className,
        sheets: document.styleSheets.length,
        display: getComputedStyle(blk).display,
        block: rb(blk), figure: rb(fig), body: rb(body),
        imgNatural: img.naturalWidth + 'x' + img.naturalHeight,
        imgRendered: rb(img),
        figRatio: (fig.getBoundingClientRect().width / fig.getBoundingClientRect().height).toFixed(3),
        imgRatio: (img.naturalWidth / img.naturalHeight).toFixed(3),
        fit: getComputedStyle(img).objectFit,
        cols: getComputedStyle(blk).gridTemplateColumns
      });
    })()`,
    returnByValue: true,
  });
  console.log(r.result.value);
  chrome.kill();
  process.exit(0);
})();
