Deck.start(function (B) {
  const names=['','Platform identity','Commercial real estate','The ecosystem','Discovery & booking','Financial architecture','Loyalty engine','Partner operations','Technical architecture','Security remediation','Verification','Business impact','Deployment roadmap','Committee defense'];
  const shapes=[0,1,2,3,4,5,6,7,8,11,12,13,14,15];
  const actFor=p=>p<4?'I':p<8?'II':p<11?'III':'IV';
  let page=0, previous=null;
  function element(tag,cls,text){
    const el=document.createElement(tag);el.className=cls;if(text)el.textContent=text;return el;
  }
  B.sequence=function(title,beats){
    page++;B.scene(title);
    beats.forEach(([headline,accent,caption,en,ar],step)=>{
      const at=B.t(),panel=element('section','sequence scene-'+page);
      const heading=element('h1','',headline),emphasis=element('em','',accent);
      if(/[\u0600-\u06ff]/.test(accent)){emphasis.lang='ar';emphasis.dir='rtl'}
      panel.append(element('div','chapter','Act '+actFor(page)+'  /  '+names[page]),heading,emphasis,element('p','caption',caption));
      const visual=element('div','detail-visual');panel.append(visual);
      const illustration=SceneVisuals(page,step,visual);
      document.querySelector('#sequence').append(panel);
      gsap.set(panel,{autoAlpha:0,yPercent:-50,y:28});
      if(previous)B.timeline.to(previous,{autoAlpha:0,y:-18,duration:.28},at);
      B.timeline.to(panel,{autoAlpha:1,y:0,duration:.72,ease:'power2.out'},at+.27);
      const shape=page===8?8+Math.min(2,step):shapes[page];
      B.timeline.to(Particles.state,{focus:1,form:shape,duration:1.25,ease:'sine.inOut'},at);
      if(illustration)B.timeline.to(illustration,{progress:1,duration:.85},at+.3);
      if(page===10&&step===0){
        const metric=Deck.counter(heading,n=>Math.round(n)+' / 129');
        B.timeline.to(metric,{value:129,duration:.9,ease:'power1.out'},at+.28);
      }
      B.beat(headline,en+'\n\n'+ar);previous=panel;
    });
  };
  gsap.set(Particles.state,{focus:0,form:0});
  B.scene('Start');B.beat('Quiet opening','Let the four city lights settle. Press Next when the committee is ready.\n\nاترك أضواء المدن الأربع تتحرك بهدوء. اضغط زر التقدم عندما تكون اللجنة جاهزة.');
  for(const act of ['act1','act2','act3','act4'])B.slot(act);
});
