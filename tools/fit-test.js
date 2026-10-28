// تست: عکس بیسبال باید contain باشد و روی هاور زوم نکند
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9356;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(os.tmpdir(), 'cdp-fit-' + Date.now()),
    '--window-size=1440,900', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  let list = null;
  for (let i = 0; i < 40; i++) { await sleep(500); try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) break; } catch (_) {} }
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } };
  await new Promise((r) => { ws.onopen = r; });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('timeout ' + method)); } }, 60000); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.value;

  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  for (const url of ['http://127.0.0.1:8080/index.html', 'http://127.0.0.1:8080/portfolio.html']) {
    await send('Page.navigate', { url });
    await sleep(6000);
    await ev(`document.querySelectorAll('.reveal').forEach(n=>{n.classList.add('is-visible');n.style.opacity=1;n.style.transform='none'})`);
    await ev(`document.querySelector('img[src*="baseball"]').scrollIntoView({block:'center'})`);
    await sleep(900);

    const info = await ev(`(()=>{const i=document.querySelector('img[src*="baseball"]');const r=i.getBoundingClientRect();
      return JSON.stringify({fit:getComputedStyle(i).objectFit, tf:getComputedStyle(i).transform,
        box:Math.round(r.width)+'x'+Math.round(r.height), nat:i.naturalWidth+'x'+i.naturalHeight,
        cx:Math.round(r.x+r.width/2), cy:Math.round(r.y+r.height/2)})})()`);
    const o = JSON.parse(info);

    // هاور واقعی
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: o.cx, y: o.cy, buttons: 0 });
    await sleep(700);
    const hover = await ev(`getComputedStyle(document.querySelector('img[src*="baseball"]')).transform`);

    console.log(url.split('/').pop(), '| fit=' + o.fit, '| box=' + o.box, '| nat=' + o.nat, '| transform(no hover)=' + o.tf, '| transform(hover)=' + hover);

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('C:/Users/MyPc_ir/AppData/Local/Temp/fit-' + url.split('/').pop().replace('.html', '') + '.png', Buffer.from(shot.data, 'base64'));
  }
  chrome.kill();
  process.exit(0);
})();
