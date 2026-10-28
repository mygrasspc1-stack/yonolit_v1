const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9346;
const URL = process.argv[2] || 'http://127.0.0.1:8080/services.html';
const OUT = process.argv[3] || 'C:\\Users\\MyPc_ir\\AppData\\Local\\Temp\\decor.png';
const W = parseInt(process.argv[4] || '1440', 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(os.tmpdir(), 'cdp-dc-' + Date.now()),
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
  await sleep(9000);

  await send('Runtime.evaluate', { expression: `document.documentElement.style.scrollBehavior='auto'; const b=document.querySelector('article#decor').getBoundingClientRect(); window.scrollTo(0, b.top + scrollY - 20);` });
  await sleep(3000);
  const r = await send('Runtime.evaluate', {
    expression: `(() => {
      const blk = document.querySelector('article#decor');
      const fig = blk.querySelector('.svc-media');
      const img = fig.querySelector('img');
      const body = blk.querySelector('.svc-body');
      const rb = (el) => { const b = el.getBoundingClientRect(); return Math.round(b.width) + 'x' + Math.round(b.height); };
      const fw = fig.getBoundingClientRect().width, fh = fig.getBoundingClientRect().height;
      const iw = img.naturalWidth, ih = img.naturalHeight;
      const fit = getComputedStyle(img).objectFit;
      let note = '';
      if (fit === 'cover') {
        const s = Math.max(fw / iw, fh / ih);
        note = 'visibleW=' + (fw / s / iw * 100).toFixed(1) + '% visibleH=' + (fh / s / ih * 100).toFixed(1) + '%';
      }
      return JSON.stringify({ block: rb(blk), figure: rb(fig), body: rb(body),
        img: iw + 'x' + ih, fit, note,
        figRatio: (fw / fh).toFixed(3), imgRatio: (iw / ih).toFixed(3),
        imgLoaded: img.complete && img.naturalWidth > 0 });
    })()`,
    returnByValue: true,
  });
  console.log('GEOM', r.result.value);

  await send('Runtime.evaluate', { expression: `document.documentElement.style.scrollBehavior='auto'; const b=document.querySelector('article#decor').getBoundingClientRect(); window.scrollTo(0, b.top + scrollY - 20);` });
  await sleep(1500);
  const rect = await send('Runtime.evaluate', { expression: `(() => { const b=document.querySelector('article#decor').getBoundingClientRect(); return JSON.stringify({x:b.x,y:b.y+scrollY,w:b.width,h:b.height}); })()`, returnByValue: true });
  const rc = JSON.parse(rect.result.value);
  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: rc.x, y: rc.y, width: rc.w, height: rc.h, scale: 0.55 } });
  fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
  console.log('SHOT', OUT);
  chrome.kill();
  process.exit(0);
})();
