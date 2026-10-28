// اسکرین‌شات واقعیِ انتهای صفحه: اسکرول تا کف، بعد گرفتن ویوپورت
const { spawn } = require('child_process');
const path = require('path'); const os = require('os'); const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9381;
const URL = process.argv[2];
const OUT = process.argv[3];
const W = parseInt(process.argv[4] || '1440', 10);
const H = parseInt(process.argv[5] || '900', 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const ch = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(os.tmpdir(), 'cdp-sb-' + Date.now()),
    '--window-size=' + W + ',' + H, '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });

  let list = null;
  for (let i = 0; i < 40; i++) { await sleep(500); try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) break; } catch (_) {} }
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } };
  await new Promise((r) => { ws.onopen = r; });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('timeout ' + method)); } }, 60000); });

  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: W < 700 });
  await send('Page.navigate', { url: URL });
  await sleep(4000);

  // اسکرول پله‌ای تا کف تا انیمیشن‌ها و تصاویر lazy بیدار شوند
  await send('Runtime.evaluate', { expression: `
    (async () => {
      const step = Math.round(innerHeight * 0.8);
      for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
        scrollTo(0, y); await new Promise(r => setTimeout(r, 90));
      }
      scrollTo(0, document.documentElement.scrollHeight);
    })()` , awaitPromise: true });
  await sleep(2200);
  await send('Runtime.evaluate', { expression: 'scrollTo(0, document.documentElement.scrollHeight)' });
  await sleep(1200);

  const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('SHOT', OUT, W + 'x' + H + ' @2x');
  ws.close(); ch.kill();
})();
