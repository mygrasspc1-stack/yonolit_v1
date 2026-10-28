// Screenshot one element by selector (used for the internal-link block).
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9350;
const URL = process.argv[2];
const SEL = process.argv[3] || '.ilinks';
const OUT = process.argv[4] || 'C:\\Users\\MyPc_ir\\AppData\\Local\\Temp\\block.png';
const W = parseInt(process.argv[5] || '1440', 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(os.tmpdir(), 'cdp-blk-' + Date.now()),
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
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: 900, deviceScaleFactor: 1, mobile: W < 700 });
  await send('Page.navigate', { url: URL });
  await sleep(7000);
  await send('Runtime.evaluate', { expression: `document.documentElement.style.scrollBehavior='auto'; const el=document.querySelector('${SEL}'); el.scrollIntoView({block:'center'});` });
  await sleep(1200);
  const r = await send('Runtime.evaluate', {
    expression: `(() => { const el=document.querySelector('${SEL}'); if(!el) return 'missing'; const b=el.getBoundingClientRect(); const cs=getComputedStyle(el); return JSON.stringify({w:Math.round(b.width),h:Math.round(b.height),cols:getComputedStyle(el.querySelector('.ilinks-grid')||el).gridTemplateColumns,bg:cs.backgroundColor}); })()`,
    returnByValue: true,
  });
  console.log('BLOCK', r.result.value);
  const rect = await send('Runtime.evaluate', { expression: `(() => { const b=document.querySelector('${SEL}').getBoundingClientRect(); return JSON.stringify({x:b.x,y:b.y+scrollY,w:b.width,h:b.height}); })()`, returnByValue: true });
  const rc = JSON.parse(rect.result.value);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: rc.x, y: rc.y, width: rc.w, height: rc.h, scale: 0.8 } });
  fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('SHOT', OUT);
  chrome.kill();
  process.exit(0);
})();
