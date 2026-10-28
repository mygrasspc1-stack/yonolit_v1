// اسکرین‌شات صفحه در چند تکه (برای دیدن کل صفحه بدون گم شدن جزئیات)
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9359;
const URL = process.argv[2];
const OUTBASE = process.argv[3];
const W = parseInt(process.argv[4] || '1440', 10);
const SLICES = parseInt(process.argv[5] || '4', 10);
const SCALE = parseFloat(process.argv[6] || '0.5');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(os.tmpdir(), 'cdp-sl-' + Date.now()),
    '--window-size=' + W + ',900', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
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
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: 900, deviceScaleFactor: 1, mobile: W < 700 });
  await send('Page.navigate', { url: URL });
  await sleep(6000);
  await ev(`document.querySelectorAll('.reveal').forEach(n=>{n.classList.add('is-visible');n.style.opacity=1;n.style.transform='none'})`);
  await ev(`(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,80))}window.scrollTo(0,0)})()`);
  await sleep(2500);

  const H = await ev(`document.body.scrollHeight`);
  const step = Math.ceil(H / SLICES);
  console.log('HEIGHT', H, 'slice', step);
  for (let i = 0; i < SLICES; i++) {
    const y = i * step;
    const h = Math.min(step, H - y);
    if (h <= 0) break;
    const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y, width: W, height: h, scale: SCALE } });
    const f = `${OUTBASE}-${i + 1}.png`;
    fs.writeFileSync(f, Buffer.from(shot.data, 'base64'));
    console.log('SLICE', f, `y=${y} h=${h}`);
  }
  chrome.kill();
  process.exit(0);
})();
