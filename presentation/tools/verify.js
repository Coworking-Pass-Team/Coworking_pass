const assert=require('node:assert/strict');
require('./browser')(async ({call,evaluate,send,attach,until,url})=>{
  const key=async(key,code=key)=>{for(const type of ['keyDown','keyUp'])await call('Input.dispatchKeyEvent',{type,key,code})};
  const current=()=>evaluate('Deck.snapshot().current');
  const total=await evaluate('Deck.beats.length');
  assert.equal(await evaluate('Deck.pages.length'),14);assert.equal(total,33);
  const audit=await evaluate(`(() => {
    const issues=[];
    for(const beat of [...Deck.beats].reverse()){
      const i=Deck.beats.indexOf(beat);Deck.go(i,true);
      const visible=[...document.querySelectorAll('.sequence')].filter(el=>getComputedStyle(el).visibility==='visible');
      if(visible.length!==(i?1:0)||!beat.notes.includes('\\n\\n')||!/[ء-ي]/.test(beat.notes))issues.push(beat.name);
      if(visible[0]){const rect=visible[0].getBoundingClientRect();if(rect.top<0||rect.bottom>innerHeight)issues.push('Layout: '+beat.name)}
    }
    return issues;
  })()`);
  assert.deepEqual(audit,[]);
  assert.equal(await current(),0);assert.equal(await evaluate('Particles.count'),30000);
  await key('PageDown');assert.equal(await current(),1);await key('PageUp');assert.equal(await current(),0);
  await key('1','Digit1');await key('Enter');assert.equal(await current(),1);
  await key('b','KeyB');await key('PageUp');assert.equal(await current(),1);assert.equal(await evaluate('Deck.snapshot().blank'),'');
  await key('w','KeyW');await key('PageDown');assert.equal(await current(),1);
  await key('g','KeyG');assert.equal(await evaluate('document.querySelectorAll("#cards button").length'),total);
  await until(()=>evaluate('Array.from(document.querySelectorAll("#cards img")).filter(i=>i.complete&&i.naturalWidth>0).length===Deck.beats.length'),'overview images');
  await evaluate('document.querySelector("#cards button").click()');assert.equal(await current(),0);
  await key('h','KeyH');assert.ok(await evaluate('help.open'));await key('Escape');
  await key('d','KeyD');await key('End');assert.match(await evaluate('tester.textContent'),/last/);
  await key('l','KeyL');assert.ok(await evaluate('Deck.snapshot().progress'));
  await call('Page.reload');await until(()=>evaluate('window.Deck?.ready && Deck.snapshot().current===Deck.beats.length-1'),'saved click');
  await key('p','KeyP');let target;await until(async()=>{target=(await send('Target.getTargets')).targetInfos.find(t=>t.url.includes('/presenter.html'));return target},'presenter');
  const consolePage=await attach(target.targetId);
  await until(()=>consolePage.evaluate(`document.querySelector("#counter")?.textContent==="Click ${total} / ${total}"`),'presenter handshake');
  await consolePage.evaluate('document.querySelector("[data-action=back]").click()');await until(async()=>await current()===total-2,'presenter back');
  await until(()=>consolePage.evaluate('document.querySelector("#notes p[lang=ar]")!==null'),'bilingual notes');
  await call('Page.navigate',{url:url+'?lite'});await until(()=>evaluate('window.Deck?.ready && Particles.count===10000'),'lite mode');
  console.log('Offline clicker, jump, blanking, help, thumbnails, presenter, refresh, and lite checks passed.');
}).catch(e=>{console.error(e);process.exitCode=1});
