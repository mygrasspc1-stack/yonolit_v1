// Real-render check for the Spline block on services.html via Chrome DevTools Protocol.
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const URL = process.argv[2] || 'http://127.0.0.1:8080/services.html';
const OUT = process.argv[3] || 'C:\\Users\\MyPc_ir\\AppData\\Local\\Temp\\spline-check.png';
const PROFILE = path.join(require('os').tmpdir(), 'cdp-profile-spline-' + Date.now());

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJSON(url) {
  const res = await fetch(url);
  return res.json();
}

class CDP {
  constructor(wsUrl) { this.ws = new WebSocket(wsUrl); this.id = 0; this.pending = new Map(); }
  ready() {
    return new Promise((res, rej) => {
      this.ws.onopen = () => res();
      this.ws.onerror = (e) => rej(new Error('ws error'));
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((res, rej) => {
      this.pending.set(id, { res, rej });
      this.ws.send(JSON.stringify({ id, method, params }));
      setTimeout(() => { if (this.pending.has(id)) { this.pending.delete(id); rej(new Error('timeout ' + method)); } }, 60000);
    });
  }
  bind() {
    this.ws.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { res, rej } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? rej(new Error(JSON.stringify(msg.error))) : res(msg.result);
      }
    };
  }
}

(async () => {
  const chrome = spawn(CHROME, [
    '--headless=new',
    '--remote-debugging-port=' + PORT,
    '--user-data-dir=' + PROFILE,
    '--window-size=1440,900',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-gpu-sandbox',
    'about:blank',
  ], { stdio: 'ignore' });

  let targets = null;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    try { targets = await getJSON(`http://127.0.0.1:${PORT}/json/list`); if (targets.length) break; } catch (_) {}
  }
  if (!targets) { console.log('RESULT:FAIL chrome did not start'); chrome.kill(); process.exit(1); }

  const page = targets.find((t) => t.type === 'page');
  const cdp = new CDP(page.webSocketDebuggerUrl);
  cdp.bind();
  await cdp.ready();
  await cdp.send('Runtime.enable');
  await cdp.send('Page.enable');
  await cdp.send('Page.navigate', { url: URL });

  const t0 = Date.now();
  let state = null;
  let ready = false;

  for (let i = 0; i < 60; i++) {
    await sleep(1000);
    try {
      const r = await cdp.send('Runtime.evaluate', {
        expression: `(() => {
          const host = document.querySelector('[data-spline]');
          if (!host) return { error: 'host-missing' };
          const v = host.querySelector('spline-viewer');
          const cv = v && v.shadowRoot && v.shadowRoot.querySelector('canvas');
          const rect = host.getBoundingClientRect();
          const defined = !!customElements.get('spline-viewer');
          const scriptTag = !!document.querySelector('script[src*="spline-viewer.js"]');
          const overlay = host.querySelector('[data-spline-loading]');
          const ovOp = overlay ? getComputedStyle(overlay).opacity : 'n/a';
          return {
            defined, scriptTag,
            cls: host.className,
            boxW: Math.round(rect.width), boxH: Math.round(rect.height), top: Math.round(rect.top + scrollY),
            canvasW: cv ? cv.width : 0, canvasH: cv ? cv.height : 0,
            canvasCss: cv ? Math.round(cv.getBoundingClientRect().width) + 'x' + Math.round(cv.getBoundingClientRect().height) : 'none',
            overlayOpacity: ovOp,
            docH: document.body.scrollHeight,
          };
        })()`,
        returnByValue: true,
      });
      state = r.result.value;
    } catch (e) { state = { error: String(e.message) }; }

    if (state && state.defined && state.canvasW && state.canvasH && state.boxW && state.boxH
        && Math.abs((state.canvasW / state.canvasH) - (state.boxW / state.boxH)) <= 0.05
        && String(state.cls).includes('is-ready')) {
      ready = true;
      break;
    }
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log('ELAPSED_SEC', elapsed);
  console.log('STATE', JSON.stringify(state, null, 2));

  // Screenshot of the spline element
  try {
    const box = await cdp.send('Runtime.evaluate', {
      expression: `(() => { const h = document.querySelector('[data-spline]'); const r = h.getBoundingClientRect(); return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height}); })()`,
      returnByValue: true,
    });
    const b = JSON.parse(box.result.value);
    if (b.y < 0 || b.y > 900) {
      await cdp.send('Runtime.evaluate', { expression: `document.querySelector('[data-spline]').scrollIntoView({block:'center'})` });
      await sleep(1500);
    }
    const box2 = await cdp.send('Runtime.evaluate', {
      expression: `(() => { const h = document.querySelector('[data-spline]'); const r = h.getBoundingClientRect(); return JSON.stringify({x:r.x,y:r.y,w:r.width,h:r.height}); })()`,
      returnByValue: true,
    });
    const c = JSON.parse(box2.result.value);
    const shot = await cdp.send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: Math.max(0, c.x), y: Math.max(0, c.y), width: c.w, height: c.h, scale: 1 },
      captureBeyondViewport: true,
    });
    fs.writeFileSync(OUT, Buffer.from(shot.data, 'base64'));
    console.log('SCREENSHOT', OUT, Math.round(c.w) + 'x' + Math.round(c.h));
  } catch (e) {
    console.log('SCREENSHOT_ERR', e.message);
  }

  console.log('RESULT:' + (ready ? 'PASS' : 'FAIL'));
  chrome.kill();
  process.exit(ready ? 0 : 1);
})();
