import idleUrl from './assets/ggbond/idle.png';
import smirkUrl from './assets/ggbond/smirk.png';
import coolUrl from './assets/ggbond/cool.png';
import surpriseUrl from './assets/ggbond/surprise.png';
import leftUrl from './assets/ggbond/left-arm.png';
import rightUrl from './assets/ggbond/right-arm.png';
import type { DaFeiYuLayout } from './dafeiyuRenderer';
import { HandMotion, spring, solveArm, clamp, mix, type Point, type ArmPose } from './ggbondMotion';

type Mood='idle'|'smirk'|'cool'|'surprise';
interface Reaction { level:number; at:number; until:number; mood:Mood; title:string }
type Layout=DaFeiYuLayout & { mouseCenterX:number; mouseCenterY:number; mouseAngle:number; mouseNY:number; mouseMiddle:boolean; mouseScroll:number };

/** An eighth built-in KuroCat skin. Like 大肥鱼: registered body sprites, live arms,
 * shared projected keyboard/mouse, shared native input and privacy events. */
export class GGBondRenderer {
 private images:Record<Mood|'left'|'right',HTMLImageElement>;
 private left=new HandMotion('left',{x:154,y:300});
 private right=new HandMotion('right',{x:278,y:300});
 private shift=0;private shiftV=0;private tilt=0;private tiltV=0;private bob=0;private bobV=0;
 private lastKey=-1e6;private held=new Set<number>();private count=0;private best=0;private reaction:Reaction|null=null;
 private comboUntil=0;private lastPeak=0;private configured='';private now=0;private bodyX=214;private bodyY=346;
 private scale=.285;private lastLayout:Layout|null=null;private leftPose:ArmPose|null=null;private rightPose:ArmPose|null=null;
 private mouseL=0;private mouseR=0;
 private prevContacts=0;private vertices:Record<'left'|'right',Point[]>={left:[],right:[]};
 constructor(){const image=(url:string)=>{const i=new Image();i.src=url;return i};this.images={idle:image(idleUrl),smirk:image(smirkUrl),cool:image(coolUrl),surprise:image(surpriseUrl),left:image(leftUrl),right:image(rightUrl)};}
 public get ready(){return Object.values(this.images).every(i=>i.complete&&i.naturalWidth>0);}
 public onPrivacyModeChanged(active:boolean){if(active){this.held.clear();this.left.held.clear();this.right.held.clear();this.count=0;this.reaction=null;this.comboUntil=0;}}
 public onPrivacyTyping(){this.bobV+=4;}
 public resetLeftHandForMouse(){this.left.held.clear();this.left.lastKeyAt=-1e6;}
 public reset(){this.configured='';this.held.clear();this.count=0;this.lastKey=-1e6;this.reaction=null;this.comboUntil=0;}
 public onKeyDown(vk:number,pt:Point,layout:DaFeiYuLayout,repeat:boolean){
  if(layout.privacyMode||repeat||this.held.has(vk))return;
  const now=performance.now();this.held.add(vk);
  const mouseBusy=layout.mouseLeft||layout.mouseRight||now-layout.mouseActiveAt<650;
  const hand=mouseBusy?this.right:pt.x<layout.kbCenterX?this.left:this.right;
  hand.key(vk,pt,now);this.bobV+=4;
  // Keep the pre-existing combo feature. Modifier keys animate but do not count.
  if(![16,17,18,20,91,92,160,161,162,163,164,165,27,37,38,39,40].includes(vk)&&![17,18,91,92,162,163,164,165].some(k=>this.held.has(k))){
   if(now-this.lastKey>2500)this.count=0;
   this.count++;this.best=Math.max(this.best,this.count);this.lastKey=now;this.comboUntil=now+2500;
   if([10,30,60,100].includes(this.count)||(this.count>100&&this.count%100===0)){
    const level=this.count,mood=level===30?'cool':'smirk';this.reaction={level,at:now,until:now+(level>=60?3000:1800),mood,title:level===10?'嘿嘿，有了':level===30?'GG BOND':level===60?'超级棒棒糖':'猪猪侠驾到'};
   }
  }
 }
 public onKeyUp(vk:number){this.held.delete(vk);this.left.up(vk,performance.now());this.right.up(vk,performance.now());}
 private point(x:number,y:number):Point{const lx=(x-744)*this.scale,ly=(y-1000)*this.scale,c=Math.cos(this.tilt),s=Math.sin(this.tilt);return{x:this.bodyX+lx*c-ly*s,y:this.bodyY+lx*s+ly*c};}
 public update(dt:number,now:number,raw:DaFeiYuLayout){
  const l=raw as Layout;this.now=now;this.lastLayout=l;dt=clamp(dt,.001,.05);
  const config=`${l.is108}-${l.kbCenterX}-${l.kbWidth}`;
  if(config!==this.configured){this.configured=config;this.shift=0;this.shiftV=0;this.bodyX=l.kbCenterX-10;this.bodyY=346;this.left.reset(now,{x:this.bodyX-48,y:300});this.right.reset(now,{x:this.bodyX+48,y:300});}
  if(this.count&&now-this.lastKey>2500){this.lastPeak=this.count;this.count=0;this.comboUntil=now+1250;if(this.lastPeak>=30)this.reaction={level:0,at:now,until:now+1200,mood:'surprise',title:'啊？断了？'};}
  if(this.reaction&&now>this.reaction.until)this.reaction=null;
  const mouse=!l.privacyMode&&(l.mouseLeft||l.mouseRight||l.mouseMiddle||now-l.mouseActiveAt<650);
  const lt=this.left.isTyping(now)&&!mouse,rt=this.right.isTyping(now),base=l.kbCenterX-10;
  let destination=base,desiredTilt=0;
  if(mouse){destination=rt?(l.mouseBtnX+this.right.target.x)*.5:base-(l.is108?110:58);desiredTilt=-.04+(l.mouseNX-.5)*.04;}
  else if(lt||rt){const targetX=lt&&rt?(this.left.target.x+this.right.target.x)*.5:lt?this.left.target.x+48:this.right.target.x-48;destination=mix(base,targetX,.65);desiredTilt=clamp((targetX-base)/100,-1,1)*.045;}
  destination=clamp(destination,base-(l.is108?135:92),base+(l.is108?105:65));
  if(l.privacyMode){destination=base;desiredTilt=Math.sin(now*.003)*.012;}
  [this.shift,this.shiftV]=spring(this.shift,this.shiftV,destination-base,11,dt);
  [this.tilt,this.tiltV]=spring(this.tilt,this.tiltV,desiredTilt,13,dt);
  [this.bob,this.bobV]=spring(this.bob,this.bobV,0,18,dt);
  this.bodyX=base+this.shift;this.bodyY=346+this.bob+Math.sin(now*.0022)*.7;
  const shL=this.point(485,650),shR=this.point(990,650);
  let leftTarget={x:shL.x-10,y:shL.y+83},rightTarget={x:shR.x+10,y:shR.y+83};
  let lm:Parameters<HandMotion['update']>[3]='idle',rm:Parameters<HandMotion['update']>[3]='idle';
  if(l.privacyMode){leftTarget=this.point(600,390);rightTarget=this.point(860,405);lm=rm='privacy';}
  else{
   if(mouse){
    // Palm rests behind the buttons; fingertips reach the active button independently.
    leftTarget={x:l.mouseCenterX+Math.sin(l.mouseAngle)*10.5,y:l.mouseCenterY-Math.cos(l.mouseAngle)*10.5};lm='mouse';
   }else if(lt){leftTarget=this.left.target;lm='key';}
   if(rt){rightTarget=this.right.target;rm='key';}
   // Celebration never steals a hand from a held key or mouse.
   if(this.reaction&&this.reaction.level>=60&&now-this.reaction.at>180){
    const wave=Math.sin((now-this.reaction.at)*.009)*6;
    if(lm==='idle'){leftTarget={x:shL.x-24,y:shL.y-48+wave};lm='cheer';}
    if(rm==='idle'&&this.reaction.level>=100){rightTarget={x:shR.x+24,y:shR.y-48-wave};rm='cheer';}
   }
  }
  this.left.update(dt,now,leftTarget,lm);this.right.update(dt,now,rightTarget,rm);
  const contacts=this.left.contactSerial+this.right.contactSerial;if(contacts!==this.prevContacts){this.prevContacts=contacts;this.bobV+=9;}
  this.mouseL+=(Number(l.mouseLeft)-this.mouseL)*(1-Math.exp(-34*dt));this.mouseR+=(Number(l.mouseRight)-this.mouseR)*(1-Math.exp(-34*dt));
  this.leftPose=solveArm(shL,this.left.pos,'left',this.left.squash,this.left.palmAngle);this.rightPose=solveArm(shR,this.right.pos,'right',this.right.squash,this.right.palmAngle);
 }
 public renderBody(ctx:CanvasRenderingContext2D,now:number,raw:DaFeiYuLayout){
  if(!this.ready)return;const l=raw as Layout,mood=l.privacyMode?'cool':this.reaction?.mood??(l.petEnergy>.3?'smirk':'idle');
  ctx.save();ctx.beginPath();ctx.rect(0,0,l.logicalW,440);ctx.clip();ctx.translate(this.bodyX,this.bodyY);ctx.rotate(this.tilt);
  ctx.drawImage(this.images[mood],-744*this.scale,-1000*this.scale,1448*this.scale,1086*this.scale);ctx.restore();
 }
 public renderForeground(ctx:CanvasRenderingContext2D,_dt:number,now:number,raw:DaFeiYuLayout){
  if(!this.ready||!this.leftPose||!this.rightPose)return;
  this.drawArm(ctx,'left',this.leftPose,this.left.squash);this.drawArm(ctx,'right',this.rightPose,this.right.squash);
  const l=raw as Layout;if(l.privacyMode)return;
  if(this.reaction&&this.reaction.level>=60&&this.left.mode==='cheer')this.drawCandy(ctx,this.left.pos,now);
  if(this.count||now<this.comboUntil||this.reaction){
   const count=this.count||this.lastPeak;ctx.save();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 29px system-ui';ctx.lineWidth=4.5;ctx.lineJoin='round';ctx.strokeStyle='#562324';ctx.strokeText(`×${count}`,this.bodyX,29);ctx.fillStyle='#ffe08c';ctx.fillText(`×${count}`,this.bodyX,29);
   ctx.font='700 10px system-ui';const label=this.reaction?.title??'COMBO';ctx.lineWidth=3;ctx.strokeText(label,this.bodyX,51);ctx.fillStyle='#fff5dd';ctx.fillText(label,this.bodyX,51);ctx.restore();
  }
  if(this.reaction&&this.reaction.level>0){const age=(now-this.reaction.at)/1000;ctx.save();ctx.fillStyle='#ffd45c';ctx.globalAlpha=Math.max(0,1-age/2);for(let i=0;i<(this.reaction.level>=100?22:8);i++){const a=i*2.399,rx=110+age*22,ry=80+age*12;const x=this.bodyX+Math.cos(a)*rx,y=190+Math.sin(a)*ry-age*24;ctx.beginPath();ctx.moveTo(x-3,y);ctx.lineTo(x,y-6);ctx.lineTo(x+3,y);ctx.lineTo(x,y+6);ctx.closePath();ctx.fill();}ctx.restore();}
 }
 private drawCandy(ctx:CanvasRenderingContext2D,p:Point,now:number){
  // Vector accessory, matching the keyboard's drawn style; the character art stays raster.
  ctx.save();ctx.translate(p.x,p.y-8);ctx.rotate(Math.sin(now*.009)*.1);ctx.strokeStyle='#fff2c5';ctx.lineWidth=4;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(0,3);ctx.lineTo(0,-39);ctx.stroke();ctx.fillStyle='#ff94bf';ctx.strokeStyle='#8d334d';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,-50,17,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.strokeStyle='#fff3ba';ctx.lineWidth=3.5;ctx.beginPath();for(let i=0;i<=90;i++){const a=i*.21,r=i/90*14;const x=Math.cos(a)*r,y=-50+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();ctx.restore();
 }
 private drawArm(ctx:CanvasRenderingContext2D,side:'left'|'right',p:ArmPose,squash:number){
  const im=this.images[side],w=im.naturalWidth,h=im.naturalHeight;
  const src=side==='left'?[{x:312,y:70},{x:222,y:220},{x:146,y:335},{x:140,y:405}]:[{x:80,y:70},{x:160,y:220},{x:200,y:335},{x:210,y:405}];
  const dst=[p.shoulder,p.elbow,p.wrist,p.tip];
  function bone(v:Point,index:number){const a=src[index],b=src[index+1],c=dst[index],d=dst[index+1],dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,wx=d.x-c.x,wy=d.y-c.y,wl=Math.max(.01,Math.hypot(wx,wy));const along=((v.x-a.x)*ux+(v.y-a.y)*uy)/len,normal=(-(v.x-a.x)*uy+(v.y-a.y)*ux)*(index===2?.145*(1+squash*.07):.19);return{x:c.x+wx*along-wy/wl*normal,y:c.y+wy*along+wx/wl*normal};}
  function deform(v:Point){let a:number,b:number,t:number;if(v.y<150){a=b=0;t=0;}else if(v.y<265){a=0;b=1;t=(v.y-150)/115;}else if(v.y<310){a=b=1;t=0;}else if(v.y<365){a=1;b=2;t=(v.y-310)/55;}else{a=b=2;t=0;}t=t*t*(3-2*t);const x=bone(v,a),y=bone(v,b);return{x:mix(x.x,y.x,t),y:mix(x.y,y.y,t)};}
  const cols=8,rows=16,source:Point[]=[],target:Point[]=[];
  for(let y=0;y<=rows;y++)for(let x=0;x<=cols;x++){const v={x:x/cols*w,y:y/rows*h};source.push(v);const deformed=deform(v);if(side==='left'&&this.left.mode==='mouse'&&v.y>345){const cat=Math.cos(this.lastLayout!.mouseAngle)<0;const lX=cat?190:100,rX=cat?100:190;const weight=clamp((v.y-345)/60,0,1);deformed.y+=weight*(this.mouseL*Math.exp(-Math.pow((v.x-lX)/48,2))+this.mouseR*Math.exp(-Math.pow((v.x-rX)/48,2)))*2.0;}target.push(deformed);}
  this.vertices[side]=target;
  // Every triangle uses the same intact arm image. No sliced elbows/wrists or overlaid extra hands.
  ctx.save();ctx.imageSmoothingEnabled=true;
  for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=y*(cols+1)+x,b=a+1,c=a+cols+1,d=c+1;this.triangle(ctx,im,[source[a],source[b],source[d]],[target[a],target[b],target[d]]);this.triangle(ctx,im,[source[a],source[d],source[c]],[target[a],target[d],target[c]]);}
  ctx.restore();
 }
 private triangle(ctx:CanvasRenderingContext2D,img:HTMLImageElement,s:Point[],d:Point[]){
  const [a,b,c]=s,[p,q,r]=d,det=(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);if(Math.abs(det)<1e-8)return;
  const aa=((q.x-p.x)*(c.y-a.y)-(r.x-p.x)*(b.y-a.y))/det,bb=((q.y-p.y)*(c.y-a.y)-(r.y-p.y)*(b.y-a.y))/det;
  const cc=((r.x-p.x)*(b.x-a.x)-(q.x-p.x)*(c.x-a.x))/det,dd=((r.y-p.y)*(b.x-a.x)-(q.y-p.y)*(c.x-a.x))/det;
  const center={x:(p.x+q.x+r.x)/3,y:(p.y+q.y+r.y)/3};
  ctx.save();ctx.beginPath();for(let i=0;i<3;i++){const v=d[i],dx=v.x-center.x,dy=v.y-center.y,ln=Math.hypot(dx,dy)||1,x=v.x+dx/ln*.22,y=v.y+dy/ln*.22;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.clip();ctx.transform(aa,bb,cc,dd,p.x-aa*a.x-cc*a.y,p.y-bb*a.x-dd*a.y);ctx.drawImage(img,0,0);ctx.restore();
 }
 public snapshot(){return{ready:this.ready,now:this.now,combo:this.count,best:this.best,reaction:this.reaction,body:{x:this.bodyX,y:this.bodyY,tilt:this.tilt},left:this.left.snapshot(),right:this.right.snapshot(),leftArm:this.leftPose,rightArm:this.rightPose,vertices:this.vertices,layout:this.lastLayout};}
}
