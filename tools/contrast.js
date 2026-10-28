const { spawn } = require('child_process');
const path = require('path'); const os = require('os');
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9421; const sleep = ms => new Promise(r => setTimeout(r, ms));
const PAGES = ['index.html','services.html','cnc.html','portfolio.html','applications.html','contact.html'];
(async () => {
  const ch = spawn(CHROME, ['--headless=new','--remote-debugging-port='+PORT,
    '--user-data-dir='+path.join(os.tmpdir(),'cdp-ct-'+Date.now()),
    '--window-size=1440,900','--hide-scrollbars','--no-first-run','about:blank'],{stdio:'ignore'});
  let list=null; for(let i=0;i<40;i++){await sleep(500);try{list=await(await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();if(list.length)break;}catch(_){}}
  const ws=new WebSocket(list.find(t=>t.type==='page').webSocketDebuggerUrl);
  let id=0; const pend=new Map();
  ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);m.error?p.rej(new Error(JSON.stringify(m.error))):p.res(m.result);}};
  await new Promise(r=>{ws.onopen=r;});
  const send=(m,p={})=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});ws.send(JSON.stringify({id:i,method:m,params:p}));setTimeout(()=>{if(pend.has(i)){pend.delete(i);rej(new Error('timeout '+m));}},60000);});
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
  const expr = `(() => {
    const parse = c => { const m = c.match(/rgba?\\(([^)]+)\\)/); if(!m) return null;
      const p = m[1].split(',').map(Number); return {r:p[0],g:p[1],b:p[2],a:p.length>3?p[3]:1}; };
    const bgOf = el => { let e = el;
      while (e && e !== document.documentElement) {
        const c = parse(getComputedStyle(e).backgroundColor);
        if (c && c.a > 0.5) return c; e = e.parentElement; }
      return {r:255,g:255,b:255,a:1}; };
    const bad = [];
    document.querySelectorAll('a,button,span,p,h1,h2,h3,h4,li,summary,b,strong,small,em').forEach(el => {
      const txt = (el.textContent||'').trim();
      if (!txt || txt.length > 60) return;
      if (el.querySelector('a,button,span,p,div,li')) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') return;
      const fg = parse(cs.color); if (!fg || fg.a < 0.5) return;
      const bg = bgOf(el);
      const d = Math.abs(fg.r-bg.r)+Math.abs(fg.g-bg.g)+Math.abs(fg.b-bg.b);
      if (d < 24) bad.push({ t: txt.slice(0,40), fg: cs.color, bg: 'rgb('+bg.r+','+bg.g+','+bg.b+')', sel: el.tagName.toLowerCase()+(el.className?'.'+String(el.className).split(' ')[0]:'') });
    });
    return JSON.stringify(bad);
  })()`;
  for (const p of PAGES) {
    await send('Page.navigate',{url:'http://127.0.0.1:8080/'+p});
    await sleep(3500);
    await send('Runtime.evaluate',{expression:"document.querySelectorAll('.reveal').forEach(n=>{n.classList.add('is-visible')})"});
    await sleep(600);
    const r = await send('Runtime.evaluate',{expression:expr,returnByValue:true});
    const bad = JSON.parse(r.result.value||'[]');
    console.log((bad.length?'FAIL ':'OK   ')+p+(bad.length?'  '+JSON.stringify(bad.slice(0,4)):''));
  }
  ws.close(); ch.kill();
})();
