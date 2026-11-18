window.Deck = (function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const preview = new URLSearchParams(location.search).has('preview') && parent !== window;
  const timeline = gsap.timeline({paused:true});
  const pages=[], beats=[], watchers=[], extras=[], slots=Object.create(null);
  let current=0, moving=null, blank='', presenter=null, started=0, digits='', digitTimeout, cursorTimeout, flashTimeout;
  let ready=false, progress=false, tester=false;
  const controls=[
    ['next','Next beat','→ ↓ PgDn Space N Enter · left click'],
    ['back','Previous beat','← ↑ PgUp Backspace · right click'],
    ['fullscreen','Full screen','F / F5'],['black','Black screen','B / .'],['white','White screen','W / ,'],
    ['presenter','Presenter window','P'],['overview','Click overview','G / O'],['jump','Go to page','Digits then Enter'],
    ['first','First beat','Home'],['last','Last beat','End'],['help','Help','H / ?'],['tester','Key tester','D'],
    ['progress','Progress line','L'],['close','Close overlay','Esc']
  ];
  const bindings={ArrowRight:'next',ArrowDown:'next',PageDown:'next',' ':'next',n:'next',Enter:'next',ArrowLeft:'back',ArrowUp:'back',PageUp:'back',Backspace:'back',f:'fullscreen',F5:'fullscreen',b:'black','.':'black',w:'white',',':'white',p:'presenter',g:'overview',o:'overview',Home:'first',End:'last',h:'help','?':'help',d:'tester',l:'progress',Escape:'close'};
  const B={timeline,t:()=>timeline.duration(),slot(name){slots[name]?.(B)},scene(title){pages.push({title,first:beats.length})},beat(name,notes){beats.push({name,notes,page:pages.length-1,time:B.t()})}};
  function watch(obj,draw){const keys=Object.keys(obj).filter(k=>k!=='_gsap');let values=[];const update=()=>{if(keys.some((k,i)=>obj[k]!==values[i])){values=keys.map(k=>obj[k]);draw(obj)}};watchers.push(update);update();return obj}
  function split(el){const words=el.textContent.split(/(\s+)/u),chars=[];el.setAttribute('aria-label',el.textContent);el.replaceChildren();for(const w of words){if(!w.trim()){el.append(w);continue}const word=document.createElement('span');word.style.display='inline-block';word.setAttribute('aria-hidden','true');for(const c of Array.from(w)){const char=document.createElement('span');char.style.display='inline-block';char.textContent=c;word.append(char);chars.push(char)}el.append(word)}return chars}
  function textEffect(el,decode){const chars=Array.from(el.textContent);return watch({progress:0},s=>{const end=Math.floor(s.progress*chars.length);el.textContent=chars.map((c,i)=>i<end?c:decode&&c.trim()?'▱+·×01'[(i*7+end)%6]:c.trim()?'':' ').join('')})}
  function fit(){$('stage').style.transform='translate(-50%,-50%) scale('+Math.min(innerWidth/1920,innerHeight/1080)+')'}
  function durationLimit(p,ms){return new Promise(resolve=>{const timer=setTimeout(resolve,ms);Promise.resolve(p).catch(()=>{}).then(()=>{clearTimeout(timer);resolve()})})}
  function updateHud(){const b=beats[current];$('page').textContent=b.page?String(b.page).padStart(2,'0'):'';$('line').hidden=!progress||!b.page;$('line').style.transform='scaleX('+(current/Math.max(1,beats.length-1))+')';$('curtain').style.background=blank||'black';$('curtain').style.opacity=blank?'1':'0'}
  function snapshot(){return {type:'deck-state',current,time:timeline.time(),total:beats.length,title:pages[beats[current].page].title,notes:beats[current].notes,started,blank,progress,next:Math.min(current+1,beats.length-1),animating:!!moving,overlay:document.querySelector('dialog[open]')?.id||'',testKey:tester?$('tester').textContent:'',jumpText:$('digits').hidden?'':$('digits').textContent}}
  let lastSent='';
  function post(force=false){if(!ready||!presenter||presenter.closed)return;const state=snapshot(),signature=JSON.stringify(state);if(force||signature!==lastSent){presenter.postMessage(state,'*');lastSent=signature}}
  function go(index,instant=false){
    if(!ready||!Number.isInteger(index)||index<0||index>=beats.length)return;
    if(moving){moving.kill();moving=null;timeline.time(beats[current].time)}
    const previous=current;current=index;
    if(!started&&index>0&&!preview)started=Date.now();
    if(!preview)history.replaceState(null,'','#'+index);
    const target=beats[index].time;
    if(instant||Math.abs(index-previous)>1){
      if(!preview&&Math.abs(index-previous)>1){$('flash').style.transition='none';$('flash').style.opacity='1';void $('flash').offsetWidth;clearTimeout(flashTimeout);flashTimeout=setTimeout(()=>{$('flash').style.transition='opacity .16s';$('flash').style.opacity='0'},50)}
      timeline.time(target);
    }else if(target!==timeline.time()){
      moving=gsap.to(timeline,{time:target,duration:Math.abs(target-timeline.time())/(index<previous?1.8:1),ease:'none',onComplete(){moving=null;post()}});
    }
    updateHud();post();
  }
  function clearDigits(){digits='';clearTimeout(digitTimeout);$('digits').hidden=true}
  function close(){document.querySelector('dialog[open]')?.close();clearDigits()}
  function grid(){const cards=$('cards');cards.replaceChildren();pages.forEach((page,p)=>{const section=document.createElement('section'),heading=document.createElement('h3');heading.textContent=p+' · '+page.title;section.append(heading);beats.forEach((beat,i)=>{if(beat.page!==p)return;const btn=document.createElement('button'),src=window.DeckThumbs?.[i];if(src){const img=new Image();img.src=src;img.alt='';btn.append(img)}btn.append(document.createTextNode('Click '+(i+1)+' · '+beat.name));btn.setAttribute('aria-current',String(i===current));btn.onclick=()=>{close();go(i)};section.append(btn)});cards.append(section)})}
  function action(name){
    if(!ready)return;
    if(name==='help'||name==='overview'){const open=$(name).open;close();if(!open){if(name==='overview')grid();$(name).showModal()}return}
    if(name==='close'){close();blank='';tester=false;$('tester').hidden=true;updateHud();post();return}
    if(document.querySelector('dialog[open]'))close();
    switch(name){
      case 'next':case 'back':
        if(blank){blank='';break}go(Math.min(beats.length-1,Math.max(0,current+(name==='next'?1:-1))));return;
      case 'first':go(0);return;case 'last':go(beats.length-1);return;
      case 'black':case 'white':blank=blank===name?'':name;break;
      case 'presenter':if(!presenter||presenter.closed)presenter=window.open('presenter.html'+(location.search.includes('lite')?'?lite':''),'muttakaConsole','popup,width=1300,height=850');presenter?.focus();break;
      case 'fullscreen':(document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen()).catch(()=>{});break;
      case 'tester':tester=!tester;$('tester').hidden=!tester;break;
      case 'progress':progress=!progress;break;
      case 'jump':$('digits').hidden=false;$('digits').textContent='Type a page number, then Enter';break;
      case 'reset':started=Date.now();break;
    }
    updateHud();post();
  }
  function key(e){
    if(preview||!ready||e.ctrlKey||e.altKey||e.metaKey)return;
    const k=e.key.length===1?e.key.toLowerCase():e.key;
    const number=/^\d$/.test(k), mapped=number?'page digit':digits&&k==='Enter'?'jump':bindings[k];
    if(tester||mapped==='tester')$('tester').textContent=JSON.stringify(e.key)+' · '+e.code+' → '+(mapped||'unmapped');
    const modal=document.querySelector('dialog[open]');
    if(modal&&(k==='Enter'||k===' ')&&document.activeElement?.tagName==='BUTTON')return;
    if(!mapped)return;e.preventDefault();if(e.repeat)return;
    if(number){digits=(digits+k).slice(-6);$('digits').textContent='Page '+digits;$('digits').hidden=false;clearTimeout(digitTimeout);digitTimeout=setTimeout(clearDigits,5000);return}
    if(mapped==='jump'){const page=pages[Number(digits)];close();if(page)go(page.first);return}
    clearDigits();if(modal&&['next','back'].includes(mapped))return;action(mapped);
  }
  addEventListener('keydown',key);
  addEventListener('contextmenu',e=>{e.preventDefault();if(!preview&&!document.querySelector('dialog[open]'))action('back')});
  addEventListener('click',e=>{if(preview)return;const btn=e.target.closest('button');if(btn){if(btn.dataset.action)action(btn.dataset.action);return}if(!document.querySelector('dialog[open]'))action('next')});
  addEventListener('mousemove',()=>{document.body.classList.remove('idle');clearTimeout(cursorTimeout);cursorTimeout=setTimeout(()=>document.body.classList.add('idle'),2000)});
  addEventListener('hashchange',()=>{const i=Number(location.hash.slice(1));if(i!==current)go(i,true)});
  addEventListener('message',e=>{
    if(!ready||!e.data)return;
    if(preview&&e.source===parent&&e.data.type==='mirror'){
      const s=e.data;if(!beats[s.current])return;current=s.current;timeline.time(s.time??beats[current].time);blank=s.blank||'';progress=!!s.progress;updateHud();
      const open=document.querySelector('dialog[open]');if(open?.id!==s.overlay){open?.close();if(s.overlay==='help'||s.overlay==='overview'){if(s.overlay==='overview')grid();$(s.overlay).showModal()}}
      for(const [id,value] of [['tester',s.testKey],['digits',s.jumpText]]){const el=$(id);el.hidden=!value;if(value)el.textContent=value}
    }else if(presenter&&e.source===presenter){
      if(e.data.type==='hello')post(true);
      if(e.data.type==='control'&&['next','back','black','reset'].includes(e.data.action))action(e.data.action);
    }
  });
  async function start(build){
    fit();addEventListener('resize',fit);build(B);extras.forEach(fn=>fn(B));timeline.pause(0);
    controls.forEach(([name,title,keys])=>{const b=document.createElement('button'),k=document.createElement('kbd');k.textContent=keys;b.dataset.action=name;b.append(title,k);$('keys').append(b)});
    const fonts=Promise.all([document.fonts.load('16px Tight'),document.fonts.load('italic 16px Instrument'),document.fonts.load('16px Jet')]);
    await Promise.all([durationLimit(fonts.then(()=>document.fonts.ready),5000),durationLimit(Promise.all(Array.from(document.images,img=>img.decode())),8000)]);
    ready=true;const initial=Number(location.hash.slice(1));go(Number.isInteger(initial)&&beats[initial]?initial:0,true);$('loader').hidden=true;
    document.body.classList.add('idle');gsap.ticker.add(()=>{watchers.forEach(draw=>draw());post()});
    if(preview)parent.postMessage({type:'mirror-ready'},'*');
  }
  return {start,watch,split,typer:el=>textEffect(el,false),decode:el=>textEffect(el,true),counter:(el,format=String)=>watch({value:0},s=>{el.textContent=format(s.value)}),extras,slots,go,beats,pages,get ready(){return ready},snapshot};
})();
