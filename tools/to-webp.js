// تبدیل یک تصویر روی سرور محلی به WebP با Chrome (بدون نیاز به Pillow/ImageMagick)
// استفاده: node tools/to-webp.js http://127.0.0.1:8080/assets/x.jpg assets/x.webp 0.88
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9357;
const URL = process.argv[2];
const OUT = process.argv[3];
const Q = parseFloat(process.argv[4] || '0.88');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(os.tmpdir(), 'cdp-w2p-' + Date.now()),
    '--window-size=1600,1000', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  let list = null;
  for (let i = 0; i < 40; i++) { await sleep(500); try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) break; } catch (_) {} }
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } };
  await new Promise((r) => { ws.onopen = r; });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('timeout ' + method)); } }, 120000); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.value;

  await send('Runtime.enable'); await send('Page.enable');
  // باید روی همان اوریجین سرور باشیم، وگرنه canvas با تصویر cross-origin آلوده می‌شود
  const origin = URL.split('/').slice(0, 3).join('/');
  await send('Page.navigate', { url: origin + '/robots.txt' });
  await sleep(400);

  const res = await ev(`(async () => {
    const img = new Image();
    img.src = ${JSON.stringify(URL)};
    await new Promise((ok, no) => { img.onload = ok; img.onerror = () => no(new Error('load fail')); });
    const c = document.createElement('canvas');
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    c.getContext('2d').drawImage(img, 0, 0);
    return JSON.stringify({ w: c.width, h: c.height, data: c.toDataURL('image/webp', ${Q}).split(',')[1] });
  })()`);

  if (typeof res !== 'string') { console.log('FAIL', JSON.stringify(res)); chrome.kill(); process.exit(1); }
  const o = JSON.parse(res);
  fs.writeFileSync(OUT, Buffer.from(o.data, 'base64'));
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log('WEBP', OUT, o.w + 'x' + o.h, kb + 'KB');
  chrome.kill();
  process.exit(0);
})();
