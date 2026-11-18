(function(){
  const $=id=>document.getElementById(id);
  const frames=[$('now'),$('next')];let state=null,lastNotes='';
  const lite=new URLSearchParams(location.search).has('lite');
  frames.forEach(f=>{f.src='index.html?preview'+(lite?'&lite':'')});
  function control(action){window.opener?.postMessage({type:'control',action},'*')}
  function mirror(){if(!state)return;frames.forEach((f,i)=>f.contentWindow.postMessage({type:'mirror',current:i?state.next:state.current,time:i?null:state.time,blank:i?'':state.blank,progress:state.progress,overlay:i?'':state.overlay,testKey:i?'':state.testKey,jumpText:i?'':state.jumpText},'*'))}
  function clocks(){const seconds=state?.started?Math.max(0,Math.floor((Date.now()-state.started)/1000)):0;$('timer').textContent=[Math.floor(seconds/60),seconds%60].map(n=>String(n).padStart(2,'0')).join(':');$('clock').textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
  addEventListener('message',e=>{
    if(frames.some(f=>f.contentWindow===e.source)&&e.data?.type==='mirror-ready'){mirror();return}
    if(!window.opener||e.source!==window.opener||e.data?.type!=='deck-state')return;
    state=e.data;$('counter').textContent='Click '+(state.current+1)+' / '+state.total;$('title').textContent=state.title;
    if(state.notes!==lastNotes){lastNotes=state.notes;$('notes').replaceChildren(...state.notes.split(/\n\s*\n/).map(s=>{const p=document.createElement('p');p.dir='auto';p.lang=/[\u0600-\u06ff]/.test(s)?'ar':'en';p.textContent=s;return p}))}
    mirror();clocks();
  });
  document.querySelectorAll('button').forEach(b=>b.onclick=()=>control(b.dataset.action));
  addEventListener('keydown',e=>{const map={PageDown:'next',ArrowRight:'next',ArrowDown:'next',n:'next',Enter:'next',' ':'next',PageUp:'back',ArrowLeft:'back',ArrowUp:'back',Backspace:'back',b:'black','.':'black'};if(e.target.tagName==='BUTTON'&&['Enter',' '].includes(e.key))return;const action=map[e.key];if(action){e.preventDefault();if(!e.repeat)control(action)}});
  clocks();setInterval(clocks,500);window.opener?.postMessage({type:'hello'},'*');
})();
