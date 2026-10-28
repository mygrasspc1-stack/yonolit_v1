// تست خودکار استودیو: انتخاب المان، تغییر استایل، تأیید ذخیره روی دیسک
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9351;
const URL = 'http://127.0.0.1:8080/dev/studio.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(os.tmpdir(), 'cdp-std-' + Date.now()),
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

  // ۱) فریم لود شده؟
  console.log('IFRAME', await evalJs(`(()=>{const f=document.getElementById('frame');return f.contentDocument && f.contentDocument.readyState + ' | nodes=' + f.contentDocument.querySelectorAll('*').length})()`));

  // ۲) انتخاب المان با کلیک شبیه‌سازی‌شده
  console.log('SELECT', await evalJs(`(()=>{
    const d=document.getElementById('frame').contentDocument;
    const el=d.querySelector('.hero h1');
    if(!el) return 'no hero h1';
    const r=el.getBoundingClientRect();
    el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,clientX:r.left+5,clientY:r.top+5}));
    const p=document.getElementById('panel');
    return 'panelLen='+p.innerText.length+' | sel='+(p.querySelector('.sel')?p.querySelector('.sel').textContent:'-');
  })()`));
  await sleep(400);

  // ۳) تغییر استایل از پنل
  console.log('EDIT', await evalJs(`(()=>{
    const inp=document.querySelector('[data-p="letter-spacing"]');
    if(!inp) return 'no input';
    inp.value='-0.05em';
    inp.dispatchEvent(new Event('input',{bubbles:true}));
    const d=document.getElementById('frame').contentDocument;
    return 'inline='+d.querySelector('.hero h1').style.letterSpacing;
  })()`));
  await sleep(1600);

  // ۴) وضعیت ذخیره‌شده روی سرور
  console.log('STATE', await evalJs(`fetch('/__state').then(r=>r.json()).then(j=>JSON.stringify(j))`));
  console.log('CSS_TAIL', await evalJs(`fetch('/styles.css?x='+Date.now()).then(r=>r.text()).then(t=>t.slice(-160).replace(/\\n/g,' | '))`));

  // ۵) اسکرین‌شات پنل
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/MyPc_ir/AppData/Local/Temp/studio-test.png', Buffer.from(shot.data, 'base64'));
  console.log('SHOT ok');

  // ۶) پاک‌سازی
  console.log('RESET', await evalJs(`fetch('/__reset',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({all:true})}).then(r=>r.json()).then(j=>JSON.stringify(j))`));

  chrome.kill();
  process.exit(0);
})();
