// تست مسیر متن/HTML: انتخاب h1 دارای <em>، ویرایش، ذخیره روی فایل، بازگشت
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9352;
const URL = 'http://127.0.0.1:8080/dev/studio.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(os.tmpdir(), 'cdp-std2-' + Date.now()),
    '--window-size=1440,900', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  let list = null;
  for (let i = 0; i < 40; i++) { await sleep(500); try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) break; } catch (_) {} }
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); } };
  await new Promise((r) => { ws.onopen = r; });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('timeout ' + method)); } }, 60000); });
  const evalJs = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value;

  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: URL });
  await sleep(7000);

  console.log('TEXTAREA', await evalJs(`(()=>{
    const d=document.getElementById('frame').contentDocument;
    const el=d.querySelector('#hero-title');
    el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
    const t=document.getElementById('txt');
    return t ? JSON.stringify(t.value) : 'missing';
  })()`));

  console.log('SAVE', await evalJs(`(()=>{
    const t=document.getElementById('txt');
    t.value = t.value.replace('ماندگار.', 'ماندگار_TEST.');
    document.getElementById('saveTxt').click();
    return 'clicked';
  })()`));
  await sleep(1200);

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/MyPc_ir/AppData/Local/Temp/studio-text.png', Buffer.from(shot.data, 'base64'));
  console.log('STATUS', await evalJs(`document.getElementById('status').textContent`));

  // بازگشت به حالت اول تا فایل تمیز بماند
  console.log('REVERT', await evalJs(`fetch('/__text',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({page:'index.html',
      rawOld:'<em>تا فرم ماندگار_TEST.</em>',
      rawNew:'<em>تا فرم ماندگار.</em>'})}).then(r=>r.json()).then(j=>JSON.stringify(j))`));

  chrome.kill();
  process.exit(0);
})();
