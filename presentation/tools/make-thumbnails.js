const fs=require('node:fs');
const path=require('node:path');
require('./browser')(async ({evaluate,call,root,delay})=>{
  const total=await evaluate('Deck.beats.length'),files=[];
  for(let i=0;i<total;i++){
    await evaluate('Deck.go('+i+',true)');await delay(320);
    const {data}=await call('Page.captureScreenshot',{format:'jpeg',quality:84,fromSurface:true});
    const file='assets/thumbs/beat-'+String(i).padStart(3,'0')+'.jpg';
    fs.writeFileSync(path.join(root,file),Buffer.from(data,'base64'));files.push(file);
  }
  fs.writeFileSync(path.join(root,'assets/thumbs/thumbs.js'),'window.DeckThumbs = '+JSON.stringify(files,null,2)+';\n');
  console.log('Saved '+files.length+' click previews.');
}).catch(e=>{console.error(e);process.exitCode=1});
