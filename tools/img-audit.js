// شمارش تصاویر شکسته / لود‌نشده در صفحه
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9360;
const URL = process.argv[2];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(os.tmpdir(), 'cdp-im-' + Date.now()),
    '--window-size=1440,900', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  let list = null;
  for (let i = 0; i < 40; i++) { await sleep(500); try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) break; } catch (_) {} }
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pend = new Map(); const failed = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.method === 'Network.loadingFailed') failed.push(m.params);
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) failed.push({ url: m.params.response.url, status: m.params.response.status });
    if (m.id && pend.has(m.id)) { const p = pend.get(m.id); pend.delete(m.id); m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result); }
  };
  await new Promise((r) => { ws.onopen = r; });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('timeout ' + method)); } }, 90000); });
  const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.value;

  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: URL });
  await sleep(5000);
  await ev(`document.querySelectorAll('.reveal').forEach(n=>{n.classList.add('is-visible');n.style.opacity=1})`);
  await ev(`(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}})()`);
  await sleep(3000);

  const res = await ev(`(()=>{
    const all=[...document.images];
    const bad=all.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.currentSrc||i.src);
    const lazy=all.filter(i=>i.loading==='lazy').length;
    return JSON.stringify({total:all.length, bad:bad.length, lazy, sample:bad.slice(0,6)});
  })()`);
  console.log('IMG', res);
  console.log('NET-FAIL', failed.length, JSON.stringify(failed.slice(0, 5)));
  chrome.kill();
  process.exit(0);
})();
