/* Each sample is [x, y, z, color]. Shapes use the same stable particle IDs. */
window.MuttakaForms = (function () {
  const tau = 2 * Math.PI;
  const gold=1, mint=2, rust=4, blue=5;
  function line(a,b,t,color=gold){return a.map((v,i)=>v+(b[i]-v)*t).concat(color)}
  function path(points,t,color){const u=t*(points.length-1),i=Math.min(points.length-2,Math.floor(u));return line(points[i],points[i+1],u-i,color)}
  function box(x,y,z,w,h,d,t,color){
    const corners=Array.from({length:8},(_,i)=>[x+(i&1?w:-w),y+(i&2?h:-h),z+(i&4?d:-d)]);
    const edge=Math.floor(t*12),axis=Math.floor(edge/4),bits=edge%4;
    const first=[bits*2,(bits&1)+(bits>>1)*4,bits][axis];
    return line(corners[first],corners[first+(1<<axis)],t*12-edge,color);
  }
  function ring(x,y,z,rx,ry,t,color=gold){return [x+rx*Math.cos(t*tau),y+ry*Math.sin(t*tau),z,color]}
  function hex(cx,cy,t){const a=Math.floor(t*6)*tau/6,b=a+tau/6;return line([cx+.22*Math.cos(a),cy+.22*Math.sin(a),0],[cx+.22*Math.cos(b),cy+.22*Math.sin(b),0],t*6%1,blue)}
  function floor(x,y,z){return [x+.39*z,y+.43*z,z]}
  const shield=[[-.68,.53,0],[-.32,.57,0],[0,.71,0],[.32,.57,0],[.68,.53,0],[.62,.06,0],[.49,-.27,0],[.25,-.49,0],[0,-.65,0],[-.25,-.49,0],[-.49,-.27,0],[-.62,.06,0],[-.68,.53,0]];
  let ink;
  function emblem(){
    if(ink)return ink;
    const c=document.createElement('canvas');c.width=768;c.height=320;const ctx=c.getContext('2d');ctx.direction='rtl';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 208px "Traditional Arabic", "Times New Roman", serif';ctx.fillText('مُتَّكَأ',384,166);
    const bytes=ctx.getImageData(0,0,c.width,c.height).data;ink=[];
    for(let y=0;y<c.height;y+=2)for(let x=0;x<c.width;x+=2)if(bytes[(y*c.width+x)*4+3]>110)ink.push([(x-384)/280,(160-y)/250]);
    return ink;
  }
  function sample(id,i,u,v,w){
    const t=u*tau, n=i%12;
    switch(id){
      case 2:{const a=(i%7)*tau/7;return [.68*Math.cos(a)+.24*Math.cos(t)*v,.48*Math.sin(a)+.22*Math.sin(t)*v,(w-.5)*.6,rust]}
      case 3:{if(i%3===0)return hex(((i%15)%5-2)*.33,(Math.floor((i%15)/5)-1)*.38+((i%15)%5%2)*.18,u);
        const sign=i%2?1:-1;return [sign*.8+.19*Math.cos(t)*v,.32*Math.sin(t)*v,(w-.5)*.3,sign>0?mint:gold]}
      case 4:{let p;if(n<7){const j=i%20;p=box((j%5-2)*.31,-.17,((j/5|0)-1.5)*.34,.105,.07,.095,u,j===12?mint:gold)}
        else if(n<10)p=box(0,-.22,0,.93,.08,.77,u,blue);else p=box(n===10?-.59:.59,-.01,.62,.26,.26,.14,u,mint);
        return floor(...p).concat(p[3])}
      case 5:{if(n<5)return box(0,0,0,.45,.39,.24,u,blue);if(n<8)return ring(0,0,-.24,.27,.27,u,mint);
        return [.8*Math.cos(t),.16*Math.sin(t)+(n-9)*.12,.52*Math.sin(t),gold]}
      case 6:{if(n<6){const y=v*.62;return [(.14+.48*Math.sqrt(v))*Math.cos(t),y-.02,(.14+.48*Math.sqrt(v))*Math.sin(t),gold]}
        if(n<8)return ring(n===6?-.45:.45,.33,0,.24,.19,u,gold);
        if(n<10)return path([[0,0,0],[0,-.39,0],[-.28,-.48,0],[.28,-.48,0],[0,-.39,0]],u,mint);
        const a=(i%17)*tau/17;return [(.73+u*.21)*Math.cos(a),.17+(.47+u*.17)*Math.sin(a),0,blue]}
      case 7:{if(n<8){const j=i%7,h=[.18,.29,.24,.39,.31,.49,.59][j];return box(-.67+j*.215,-.45+h,0,.07,h,.095,u,j>4?mint:gold)}
        return box(0,.02,(n-9)*.12,.92,.65,.018,u,blue)}
      case 8:{if(n<5)return path([[-.34,-.4,0],[-.34,.4,0],[.42,-.47,0],[.42,.4,0]],u,mint);
        const a=(n%3)*Math.PI/3;return [.86*Math.cos(t)*Math.cos(a)-.25*Math.sin(t)*Math.sin(a),.86*Math.cos(t)*Math.sin(a)+.25*Math.sin(t)*Math.cos(a),.35*Math.sin(t),blue]}
      case 9:{if(n<9)return ring(0,(i%6)*.15-.375,0,.57,.12,u,n<3?mint:gold);return line([.57*Math.cos(t),-.38,.22*Math.sin(t)],[.57*Math.cos(t),.38,.22*Math.sin(t)],v,blue)}
      case 10:{const cloud=[[-.71,-.16,0],[-.8,.02,0],[-.71,.19,0],[-.48,.21,0],[-.38,.41,0],[-.13,.51,0],[.1,.45,0],[.23,.29,0],[.45,.33,0],[.58,.19,0],[.74,.13,0],[.8,-.04,0],[.68,-.23,0],[-.66,-.23,0],[-.71,-.16,0]];const p=path(cloud,u,mint);p[2]=(v-.5)*.34;return p}
      case 11:{if(n<9){const p=path(shield,u,n<5?mint:gold),s=n<6?1:Math.sqrt(v);return [p[0]*s,p[1]*s,.19*(1-s*s)+(w-.5)*.1,p[3]]}
        const a=(i%10)*tau/10,r=.86+.27*v;return [r*Math.cos(a),r*.76*Math.sin(a),w*.1,rust]}
      case 12:{if(i>=129)return [(u-.5)*3.5,(v-.5)*2.3,w*.1,7];
        const p=path([[-.71,-.01,0],[-.23,-.48,0],[.74,.54,0]],i/128,6);
        p[2]=.045*Math.sin(i/128*Math.PI);return p}
      case 13:{if(n<8)return [u*1.8-.9,-.45+1.1*u*u*u,(v-.5)*.16,mint];
        const j=i%12/11;return n%2?[u*1.8-.9,-.48+j*.93,-.12,blue]:[j*1.8-.9,-.48+u*.93,-.12,blue]}
      case 14:{const r=.12+v*.95;return [r*Math.cos(t),r*.78*Math.sin(t),1-v*2,n%4?blue:gold]}
      case 15:{const pts=emblem(),p=pts[Math.floor(u*pts.length)];return [p[0],p[1],(w-.5)*.12,n<3?mint:gold]}
    }
  }
  return {sample};
})();
