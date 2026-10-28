const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9343;
const URL = process.argv[2] || 'http://127.0.0.1:8080/services.html';
const OUT = process.argv[3] || 'C:\\Users\\MyPc_ir\\AppData\\Local\\Temp\\spline-shot.png';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(os.tmpdir(), 'cdp-shot-' + Date.now()),
    '--window-size=1440,900', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
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

  let ok = false;
  for (let i = 0; i < 40; i++) {
    await sleep(1000);
    const r = await send('Runtime.evaluate', {
      expression: `(() => { const h=document.querySelector('[data-spline]'); const v=h.querySelector('spline-viewer'); const c=v.shadowRoot&&v.shadowRoot.querySelector('canvas'); return JSON.stringify({ ready: h.classList.contains('is-ready'), canvas: c?c.width+'x'+c.height:'none' }); })()`,
      returnByValue: true,
    });
    const s = JSON.parse(r.result.value);
    if (s.ready && s.canvas !== 'none' && s.canvas !== '300x150') { ok = true; console.log('READY', (i + 1) + 's', s.canvas); break; }
  }
  if (!ok) console.log('NOT_READY');

  await send('Runtime.evaluate', { expression: `document.documentElement.style.scrollBehavior='auto'; window.scrollTo(0, document.querySelector('[data-spline]').getBoundingClientRect().top + scrollY - 200);` });
  await sleep(2500);
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('SHOT', OUT);
  chrome.kill();
  process.exit(ok ? 0 : 1);
})();
