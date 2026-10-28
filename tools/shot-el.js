// اسکرین‌شات یک المان با کیفیت ۲ برابر
const { spawn } = require('child_process');
const path = require('path'); const os = require('os'); const fs = require('fs');
const CHROME = 'C://Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9391;
const [URL, SEL, OUT, W, H] = [process.argv[2], process.argv[3], process.argv[4],
  parseInt(process.argv[5] || '1440', 10), parseInt(process.argv[6] || '900', 10)];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const ch = spawn(CHROME, ['--headless=new','--remote-debugging-port='+PORT,
    '--user-data-dir='+path.join(os.tmpdir(),'cdp-se-'+Date.now()),
    '--window-size='+W+','+H,'--hide-scrollbars','--no-first-run','about:blank'],{stdio:'ignore'});
  let list=null; for(let i=0;i<40;i++){await sleep(500);try{list=await(await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();if(list.length)break;}catch(_){}}
  const ws=new WebSocket(list.find(t=>t.type==='page').webSocketDebuggerUrl);
  let id=0; const pend=new Map();
  ws.onmessage=e=>{const m=JSON.parse(e.data); if(m.id&&pend.has(m.id)){const p=pend.get(m.id);pend.delete(m.id);m.error?p.rej(new Error(JSON.stringify(m.error))):p.res(m.result);}};
  await new Promise(r=>{ws.onopen=r;});
  const send=(method,params={})=>new Promise((res,rej)=>{const i=++id;pend.set(i,{res,rej});ws.send(JSON.stringify({id:i,method,params}));setTimeout(()=>{if(pend.has(i)){pend.delete(i);rej(new Error('timeout '+method));}},60000);});
  await send('Runtime.enable'); await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:W,height:H,deviceScaleFactor:2,mobile:W<700});
  await send('Page.navigate',{url:URL});
  await sleep(4500);
  const r = await send('Runtime.evaluate',{expression:`(()=>{const e=document.querySelector(${JSON.stringify(SEL)});if(!e)return null;e.scrollIntoView({block:'center'});const b=e.getBoundingClientRect();return {x:b.x+scrollX,y:b.y+scrollY,w:b.width,h:b.height};})()`,returnByValue:true});
  if(!r.result.value){console.log('NOT FOUND',SEL);ws.close();ch.kill();return;}
  await sleep(1200);
  const v=r.result.value;
  const shot = await send('Page.captureScreenshot',{format:'png',fromSurface:true,clip:{x:v.x,y:v.y,width:v.w,height:v.h,scale:1}});
  fs.writeFileSync(OUT, Buffer.from(shot.data,'base64'));
  console.log('SHOT',OUT,Math.round(v.w)+'x'+Math.round(v.h));
  ws.close(); ch.kill();
})();
