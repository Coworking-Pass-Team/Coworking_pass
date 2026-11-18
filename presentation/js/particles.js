/* Stylized lon/lat outline. Relief and light intensity are artistic. */
window.Particles = (function () {
  const canvas = document.querySelector('#world');
  const lite = new URLSearchParams(location.search).has('lite');
  const count = lite ? 10000 : 30000;
  const state = {focus:0,form:0};
  const border = [[34.6,28.1],[35,29.35],[36.1,29.5],[36.8,29.9],[37.5,30],[37,30.5],[38,31.5],[39.2,32.15],[40.4,31.95],[42.1,31.1],[44.7,29.2],[46.55,29.1],[47.5,30],[47.8,29.9],[47.7,28.55],[48.45,28.5],[48.8,27.6],[49.4,27.1],[50.15,26.6],[50.2,26],[50.6,25.45],[50.8,24.75],[51.25,24.55],[51.55,24.27],[52.57,22.95],[55.1,22.63],[55.67,22],[55,20],[52,19],[49,18.63],[47.45,17.1],[46.75,17.23],[45.4,17.33],[44.4,17.43],[43.35,17.46],[43.2,16.65],[42.77,16.4],[42.55,17],[41.7,18],[41.4,19],[40.7,19.8],[39.5,20.9],[39.15,21.4],[39,22.4],[38.45,23.7],[37.5,24.45],[37.2,25.5],[36.65,26],[36.05,27],[35.3,27.6]];
  const cities = [[46.68,24.71],[39.19,21.49],[39.86,21.39],[50.21,26.22]];
  let seed=1937;
  function rand(){seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296}
  function inside(x,y){let hit=false;for(let i=0,j=border.length-1;i<border.length;j=i++){const a=border[i],b=border[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit}return hit}
  function terrain(x,y){return .045*Math.sin(x*1.4+y*.7)+.032*Math.cos(y*1.9-x*.22)+.017*Math.sin(x*3-y)}
  const data=new Float32Array(count*6);
  for(let i=0;i<count;i++){
    let x,y,z,kind=0;
    const r=rand();
    if(r<.035){x=(rand()-.5)*4;y=(rand()-.5)*2.2;z=rand()*.3;kind=3}
    else{
      if(r<.058){const c=cities[i%4],angle=rand()*Math.PI*2,rad=rand()**2*.28;x=c[0]+Math.cos(angle)*rad;y=c[1]+Math.sin(angle)*rad;kind=2}
      else if(r<.14){const n=Math.floor(rand()*border.length),a=border[n],b=border[(n+1)%border.length],t=rand();x=a[0]+(b[0]-a[0])*t;y=a[1]+(b[1]-a[1])*t;kind=1}
      else{do{x=34+rand()*22;y=16+Math.floor(rand()*124)*.135+rand()*.024}while(!inside(x,y))}
      z=terrain(x,y);x=(x-45)*.082;y=(y-24.1)*.093;
    }
    data.set([x,y,z,kind,rand(),rand()],i*6);
  }
  const cache=new Map();
  function form(id){
    if(cache.has(id))return cache.get(id);
    const points=new Float32Array(count*4);
    for(let i=0;i<count;i++){
      const k=i*6, stars=data[k+3]===3;
      const p=id<2||(stars&&id!==12)?data.subarray(k,k+4):MuttakaForms.sample(id,i,data[k+4],data[k+5],((i+1)*.61803398875)%1);
      points.set(p,i*4);
    }
    cache.set(id,points);return points;
  }
  function frame(){const low=Math.floor(state.form);return [low,Math.ceil(state.form),state.form-low]}
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,powerPreference:'low-power'});
  if(!gl){
    const flat=document.createElement('canvas');flat.id='world';flat.width=1280;flat.height=720;canvas.replaceWith(flat);
    const ctx=flat.getContext('2d'),colors=['#96876d','#dda963','#6de0ba','#586877','#d35d65','#5a899e','#85ffcf','#152734'];
    let last=-100;
    function fallback(ms){
      requestAnimationFrame(fallback);if(ms-last<60)return;last=ms;
      const [a,b,f]=frame(),src=form(a),dst=form(b),drift=Math.sin(ms*.00014)*.02;
      ctx.clearRect(0,0,1280,720);ctx.globalAlpha=.62;
      for(let i=0;i<count;i+=i<129?1:3){const j=i*4,k=src[j+3],star=k===3;const x=src[j]+(dst[j]-src[j])*f,y=src[j+1]+(dst[j+1]-src[j+1])*f,z=src[j+2]+(dst[j+2]-src[j+2])*f;
        ctx.fillStyle=colors[Math.round(k+(dst[j+3]-k)*f)];const size=k===6?4:1.6;ctx.fillRect(640+(x*(star?640:350)+z*40)+(star?0:state.focus*300),360-(y+z*.3+drift*x)*320,size,size)}
    }requestAnimationFrame(fallback);return {state,count,renderer:'canvas'};
  }
  const vertex=`
    attribute vec4 origin,target;
    attribute vec2 seed;
    uniform float t,focus,pixel,blend,shape;
    varying vec4 tint;
    vec3 color(float k,float z){
      if(k==1.)return vec3(.98,.73,.43);
      if(k==2.)return vec3(.36,.96,.72);
      if(k==4.)return vec3(.94,.28,.32);
      if(k==5.)return vec3(.34,.65,.79);
      if(k==6.)return vec3(.41,1.,.73);
      if(k==7.)return vec3(.13,.21,.28);
      return mix(vec3(.23,.48,.54),vec3(.98,.75,.43),smoothstep(-.04,.065,z));
    }
    void main(){
      vec3 p=mix(origin.xyz,target.xyz,blend);
      float ambient=step(2.9,origin.w)*(1.-step(3.1,origin.w));
      float orbit=(1.-min(1.,abs(shape-5.)))*float(target.w==1.)*.22*sin(t*.7);
      p.yz=mat2(cos(orbit),sin(orbit),-sin(orbit),cos(orbit))*p.yz;
      float yaw=.18+.14*sin(t*.18);
      p.xz=mat2(cos(yaw),sin(yaw),-sin(yaw),cos(yaw))*p.xz;
      float special=1.-min(1.,abs(shape-14.));
      float tunnelDepth=fract((1.-p.z)*.5+t*.09);
      p.xy=mix(p.xy,normalize(p.xy+vec2(.0001))*(.07+tunnelDepth*tunnelDepth)*vec2(1.,.84),special*(1.-ambient));
      float wave=.013*sin(p.x*6.+p.y*4.+t*.58);
      float friction=1.-min(1.,abs(shape-2.));
      p.xy+=friction*.026*vec2(sin(p.x*7.+t),cos(p.y*9.+t*.7));
      float hostile=step(3.9,target.w)*(1.-step(4.1,target.w))*(1.-min(1.,abs(shape-11.)));
      p.xy*=1.+hostile*.09*abs(sin(t*2.+seed.x));
      vec2 xy=vec2(p.x*(.76-.24*focus),(p.y+p.z*.28+wave)*.93)/(1.-p.z*.09);
      xy.x+=focus*.46;
      xy=mix(xy,p.xy,ambient);
      gl_Position=vec4(xy,0.,1.);
      vec3 rgb=mix(color(origin.w,origin.z),color(target.w,target.z),blend);
      float pulse=.86+.14*sin(t*.85+seed.x*5.);
      if(abs(shape-12.)<.01)pulse=.83+.17*sin(t*2.4);
      float a=(.20+.70*seed.x)*pulse*(1.-ambient*.69);
      float node=mix(float(origin.w==6.),float(target.w==6.),blend);
      float dust=mix(float(origin.w==7.),float(target.w==7.),blend);
      a*=1.-dust*.95;
      gl_PointSize=max(1.,pixel*(1.7+seed.y*2.2+(target.w==2.?1.6:0.)+node*(8.+2.*pulse)));
      tint=vec4(rgb,a);
    }`;
  const fragment=`precision mediump float;varying vec4 tint;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(tint.rgb,tint.a*(1.-smoothstep(.08,1.,d)));}`;
  function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const locations=Object.fromEntries(['origin','target','seed'].map(k=>[k,gl.getAttribLocation(program,k)]));
  const uniforms=Object.fromEntries(['t','focus','pixel','blend','shape'].map(k=>[k,gl.getUniformLocation(program,k)]));
  function bind(loc,buffer,size,stride=0,offset=0){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,size,gl.FLOAT,false,stride,offset)}
  const seeds=gl.createBuffer();bind(locations.seed,seeds,2,24,16);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  const buffers=new Map();
  function buffer(id){if(!buffers.has(id)){const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,form(id),gl.STATIC_DRAW);buffers.set(id,buf);cache.delete(id)}return buffers.get(id)}
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
  function draw(){
    const w=Math.max(32,Math.min(1920,Math.round(Math.min(innerWidth,innerHeight*16/9)*Math.min(devicePixelRatio,1.5)))),h=Math.round(w*9/16);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
    const [a,b,f]=frame();bind(locations.origin,buffer(a),4);bind(locations.target,buffer(b),4);
    gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(uniforms.t,(Date.now()%86400000)/1000);gl.uniform1f(uniforms.focus,state.focus);gl.uniform1f(uniforms.pixel,w/1920);gl.uniform1f(uniforms.blend,f);gl.uniform1f(uniforms.shape,state.form);gl.drawArrays(gl.POINTS,0,count);requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);return {state,count,renderer:'webgl'};
})();
