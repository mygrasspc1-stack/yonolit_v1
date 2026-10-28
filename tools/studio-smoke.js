// تست دود استودیو: چند المان مختلف + چند صفحه + گرفتن خطای JS
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9353;
const URL = 'http://127.0.0.1:8080/dev/studio.html';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(os.tmpdir(), 'cdp-smoke-' + Date.now()),
    '--window-size=1440,900', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  let list = null;
  for (let i = 0; i < 40; i++) { await sleep(500); try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) break; } catch (_) {} }
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  const errs = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.text + ' ' + (m.params.exceptionDetails.exception || {}).description);
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  };
  await new Promise((r) => { ws.onopen = r; });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('timeout ' + method)); } }, 60000); });
  const evalJs = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.value;

  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: URL });
  await sleep(7000);

  const pick = (sel) => evalJs(`(()=>{
    const d=document.getElementById('frame').contentDocument;
    const el=d.querySelector('${sel}');
    if(!el) return 'MISSING';
    el.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));
    const t=document.getElementById('txt');
    const p=document.querySelector('[data-p="font-size"]');
    return JSON.stringify({sel:document.querySelector('.sel')?.textContent, txt:(t?t.value:'').slice(0,40), fs:p?p.placeholder:'-'});
  })()`);

  console.log('A .hero-lead      ', await pick('.hero-lead'));
  console.log('B .service-card   ', await pick('.service-card'));
  console.log('C .ilinks         ', await pick('.ilinks'));
  console.log('D .marquee        ', await pick('.marquee'));
  console.log('E footer          ', await pick('footer'));

  // تغییر صفحه
  await evalJs(`(()=>{const s=document.getElementById('page');s.value='cnc.html';s.dispatchEvent(new Event('change'));return 1})()`);
  await sleep(6000);
  console.log('F cnc .page-hero h1', await pick('.page-hero h1'));
  console.log('G cnc .svc-media img', await pick('.svc-media img'));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('C:/Users/MyPc_ir/AppData/Local/Temp/studio-smoke.png', Buffer.from(shot.data, 'base64'));
  console.log('ERRORS', errs.length ? errs.slice(0, 3) : 'none');
  chrome.kill();
  process.exit(0);
})();
