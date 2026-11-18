window.SceneVisuals = function (page, step, mount) {
  const ns='http://www.w3.org/2000/svg';
  if([4,9].includes(page)){
    const canvas=document.createElement('canvas');canvas.width=650;canvas.height=100;mount.append(canvas);
    const ctx=canvas.getContext('2d');
    return Deck.watch({progress:0},({progress})=>{
      ctx.clearRect(0,0,650,100);ctx.lineWidth=2;
      const total=page===4?8:10;
      for(let i=0;i<total;i++){
        const lit=page===9?i<Math.ceil([2,4,7,10][step]*progress):step===0?i<Math.ceil(8*progress):step===1?i===3&&progress>.3:i%2===0&&i<Math.ceil(8*progress);
        ctx.strokeStyle=lit?'#7ed7b8':'#475361';ctx.fillStyle=lit?'#193c36':'#101925';
        const x=8+i*56,y=16;
        if(page===4){ctx.fillRect(x,y,36,27);ctx.strokeRect(x,y,36,27);ctx.strokeRect(x+9,y+31,18,7)}
        else{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+26,y);ctx.lineTo(x+24,y+16);ctx.lineTo(x+13,y+27);ctx.lineTo(x+2,y+16);ctx.closePath();ctx.fill();ctx.stroke()}
      }
    });
  }
  if([7,11].includes(page)&&step===1){
    const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 570 100');mount.append(svg);
    const path=document.createElementNS(ns,'path');
    path.setAttribute('d',page===7?'M5 87 H65 V64 H127 V71 H195 V46 H257 V53 H319 V31 H381 V39 H443 V22 H534':'M5 85 C150 85 310 74 385 47 S486 24 545 8');
    path.setAttribute('pathLength','1');path.setAttribute('fill','none');path.setAttribute('stroke','#85dbba');path.setAttribute('stroke-width','3');path.style.strokeDasharray='1';svg.append(path);
    return Deck.watch({progress:0},s=>path.style.strokeDashoffset=1-s.progress);
  }
};
