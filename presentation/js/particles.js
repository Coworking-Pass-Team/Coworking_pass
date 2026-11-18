/* Stylized lon/lat outline. Relief and light intensity are artistic. */
window.Particles = (function () {
  const canvas = document.querySelector('#world');
  const lite = new URLSearchParams(location.search).has('lite');
  const count = lite ? 10000 : 30000;
  const state = {focus:0};
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
  const gl=canvas.getContext('webgl',{alpha:true,antialias:false,depth:false,powerPreference:'low-power'});
  if(!gl){
    // Keep a recognizable opening even on GPU-disabled machines.
    const flat=document.createElement('canvas'); flat.width=1920;flat.height=1080;canvas.replaceWith(flat);flat.id='world';
    const ctx=flat.getContext('2d');
    for(let i=0;i<count;i++){const [x,y,z,k,a]=data.subarray(i*6,i*6+5);ctx.fillStyle=k===2?'#8ce3bf':k===1?'#e8bc79':'rgba(210,179,130,'+(.12+a*.5)+')';ctx.fillRect(960+x*660,540-y*530-z*340,2,2)}
    function fallback(ms){flat.style.transform='translate('+ (state.focus*19+Math.sin(ms*.0002)*.4)+'%,'+Math.cos(ms*.00025)*.4+'%)';requestAnimationFrame(fallback)}requestAnimationFrame(fallback);return {state,count,renderer:'canvas'};
  }
  const vertex=`
    attribute vec3 pos, style;
    uniform float t,focus,pixel;
    varying vec4 tint;
    void main(){
      float angle=-.13+.065*sin(t*.12);
      vec2 xy=mat2(cos(angle),sin(angle),-sin(angle),cos(angle))*pos.xy;
      float wave=.008*sin(pos.x*8.+pos.y*4.+t*.55);
      float depth=pos.z+wave;
      float stars=step(2.5,style.x);
      float perspective=1./(1.-xy.y*.12-depth*.12);
      vec2 p=vec2(xy.x*.82,xy.y*.98+depth*.73)*perspective;
      p=mix(p,pos.xy+vec2(.012*sin(t*.14+style.y*9.),0.),stars);
      p.x+=focus*.42*(1.-stars);
      gl_Position=vec4(p,0.,1.);
      float ridge=smoothstep(-.04,.065,depth);
      vec3 base=mix(vec3(.23,.48,.54),vec3(.98,.75,.43),ridge);
      if(style.x==1.)base=vec3(.98,.73,.43);
      if(style.x==2.)base=vec3(.42,.99,.79);
      float pulse=.84+.16*sin(t*.85+style.y*5.);
      float a=(.2+.65*style.y)*pulse;
      if(stars>.5)a*=.36;
      gl_PointSize=pixel*(1.4+style.z*1.9+(style.x==2.?3.:0.));
      tint=vec4(base,a);
    }`;
  const fragment=`precision mediump float;varying vec4 tint;void main(){float d=length(gl_PointCoord-.5)*2.;gl_FragColor=vec4(tint.rgb,tint.a*(1.-smoothstep(.08,1.,d)));}`;
  function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
  const program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  ['pos','style'].forEach((name,i)=>{const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,24,i*12)});
  const time=gl.getUniformLocation(program,'t'),focus=gl.getUniformLocation(program,'focus'),pixel=gl.getUniformLocation(program,'pixel');
  gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);
  function draw(ms){
    const w=Math.max(32,Math.min(1920,Math.round(Math.min(innerWidth,innerHeight*16/9)*Math.min(devicePixelRatio,1.5))));
    const h=Math.round(w*9/16);
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
    const seconds=(Date.now()%86400000)/1000;
    gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform1f(time,seconds);gl.uniform1f(focus,state.focus);gl.uniform1f(pixel,w/1920);gl.drawArrays(gl.POINTS,0,count);requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
  return {state,count,renderer:'webgl'};
})();
