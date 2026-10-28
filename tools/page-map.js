// نقشهٔ بخش‌های صفحه: ارتفاع هر سکشن و فاصله‌های خالی بین آن‌ها
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9358;
const URL = process.argv[2] || 'http://127.0.0.1:8080/index.html';
const W = parseInt(process.argv[3] || '1440', 10);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(os.tmpdir(), 'cdp-map-' + Date.now()),
    '--window-size=' + W + ',900', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
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
  await send('Emulation.setDeviceMetricsOverride', { width: W, height: 900, deviceScaleFactor: 1, mobile: W < 700 });
  await send('Page.navigate', { url: URL });
  await sleep(6000);
  await ev(`document.querySelectorAll('.reveal').forEach(n=>{n.classList.add('is-visible');n.style.opacity=1;n.style.transform='none'})`);
  // کل صفحه را اسکرول کن تا همهٔ محتوای lazy بالا بیاید
  await ev(`(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60))}window.scrollTo(0,0)})()`);
  await sleep(1500);

  const out = await ev(`(()=>{
    const body = document.body;
    const rows = [];
    let prevBottom = 0;
    for (const el of (document.querySelector('main')||body).children){
      const r = el.getBoundingClientRect();
      const top = Math.round(r.top + scrollY), bottom = Math.round(r.bottom + scrollY);
      if (r.height < 2) continue;
      const gap = top - prevBottom;
      rows.push({ tag: el.tagName.toLowerCase(), cls: (el.className||'').toString().split(' ').slice(0,3).join('.'),
                  h: Math.round(r.height), gap, bg: getComputedStyle(el).backgroundColor,
                  txt: (el.innerText||'').trim().length });
      prevBottom = bottom;
    }
    return JSON.stringify({ total: Math.round(body.scrollHeight), rows });
  })()`);
  const o = JSON.parse(out);
  console.log('TOTAL', o.total);
  for (const r of o.rows) {
    const flag = (r.gap > 40 ? ' GAP+' + r.gap : '') + (r.h > 700 && r.txt < 200 ? ' EMPTY?' : '') + (r.txt === 0 ? ' NOTEXT' : '');
    console.log(`${String(r.h).padStart(5)}  gap=${String(r.gap).padStart(4)}  ${r.tag}.${r.cls}  bg=${r.bg}  txt=${r.txt}${flag}`);
  }
  chrome.kill();
  process.exit(0);
})();
