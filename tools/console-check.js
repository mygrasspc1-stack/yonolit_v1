// بررسی خطاهای کنسول و درخواست‌های ناموفق در چند صفحه
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9361;
const BASE = process.argv[2] || 'http://127.0.0.1:8080/';
const PAGES = ['index.html', 'services.html', 'cnc.html', 'portfolio.html',
  'applications.html', 'contact.html'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + path.join(os.tmpdir(), 'cdp-cc-' + Date.now()),
    '--window-size=1440,900', '--hide-scrollbars', '--no-first-run',
    '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });

  let list = null;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    try { list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (list.length) break; } catch (_) {}
  }
  const page = list.find((t) => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  const events = [];
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) {
      const p = pend.get(m.id); pend.delete(m.id);
      m.error ? p.rej(new Error(JSON.stringify(m.error))) : p.res(m.result);
    } else if (m.method === 'Runtime.exceptionThrown') {
      events.push('EXC  ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      events.push('ERR  ' + m.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
    } else if (m.method === 'Network.loadingFailed') {
      events.push('NET  ' + m.params.errorText);
    }
  };
  await new Promise((r) => { ws.onopen = r; });
  const send = (method, params = {}) => new Promise((res, rej) => {
    const i = ++id; pend.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params }));
    setTimeout(() => { if (pend.has(i)) { pend.delete(i); rej(new Error('timeout ' + method)); } }, 60000);
  });

  await send('Runtime.enable'); await send('Page.enable'); await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  for (const p of PAGES) {
    events.length = 0;
    await send('Page.navigate', { url: BASE + p });
    await sleep(4500);
    // اسکرول تا انتها برای بیدار کردن reveal و تصاویر lazy
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, document.body.scrollHeight)' });
    await sleep(2500);
    const clean = events.filter((e) => !/ERR_BLOCKED_BY_CLIENT|favicon/.test(e));
    console.log(`${clean.length ? 'FAIL' : 'OK  '} ${p}${clean.length ? '\n     ' + clean.slice(0, 6).join('\n     ') : ''}`);
  }
  ws.close(); chrome.kill();
})();
