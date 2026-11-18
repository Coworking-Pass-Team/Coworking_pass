// Node tooling only. Audience and presenter pages run without Node.
const {spawn} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const root=path.resolve(__dirname,'..');
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const url=pathToFileURL(path.join(root,'index.html')).href;
async function browser(run){
  const executable=[process.env.BROWSER_EXE,'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(f=>f&&fs.existsSync(f));
  if(!executable)throw Error('Set BROWSER_EXE to the path of Edge or Chrome.');
  const profile=fs.mkdtempSync(path.join(os.tmpdir(),'muttaka-cdp-'));
  const proc=spawn(executable,['--headless=new','--no-first-run','--disable-extensions','--disable-background-networking','--remote-debugging-pipe','--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:['ignore','ignore','ignore','pipe','pipe']});
  const closed=new Promise(resolve=>proc.once('close',resolve));
  let serial=0,buffer='';const pending=new Map(),errors=[];
  proc.stdio[4].setEncoding('utf8');proc.stdio[4].on('data',chunk=>{buffer+=chunk;let at;while((at=buffer.indexOf('\0'))>=0){const msg=JSON.parse(buffer.slice(0,at));buffer=buffer.slice(at+1);if(msg.method==='Runtime.exceptionThrown')errors.push(msg.params.exceptionDetails.exception?.description||msg.params.exceptionDetails.text);pending.get(msg.id)?.(msg)}});
  function send(method,params={},sessionId){const id=++serial;return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{pending.delete(id);reject(Error('Timed out: '+method))},12000);pending.set(id,msg=>{clearTimeout(timeout);pending.delete(id);msg.error?reject(Error(msg.error.message)):resolve(msg.result)});proc.stdio[3].write(JSON.stringify({id,method,params,sessionId})+'\0')})}
  async function attach(targetId){const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});const call=(m,p)=>send(m,p,sessionId);await call('Runtime.enable');const evaluate=async expression=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value};return {call,evaluate}}
  async function until(fn,label){for(let n=0;n<100;n++){if(await fn())return;await delay(100)}throw Error('Timed out waiting for '+label)}
  try{
    const {targetId}=await send('Target.createTarget',{url:'about:blank'});const page=await attach(targetId);
    await page.call('Emulation.setDeviceMetricsOverride',{width:960,height:540,deviceScaleFactor:1,mobile:false});
    await page.call('Page.navigate',{url});await until(()=>page.evaluate('window.Deck?.ready'),'audience page');
    await run({...page,send,attach,until,delay,root,url});if(errors.length)throw Error(errors.join('\n'));
  }finally{
    if(proc.exitCode===null){await send('Browser.close').catch(()=>proc.kill());await closed}
    fs.rmSync(profile,{recursive:true,force:true,maxRetries:5,retryDelay:200});
  }
}
module.exports=browser;
