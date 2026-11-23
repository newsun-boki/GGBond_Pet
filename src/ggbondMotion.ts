/** GG Bond motion controller. Character/layout integration follows KuroCat's DaFeiYuRenderer.
 * Exact key contacts, interruptible raised travel arcs and a continuously attached 2-bone arm.
 * Pure time-based math: no refresh-rate-dependent physics and no frame/PNG swapping for hands.
 */
export interface Point { x:number; y:number }
export const clamp=(x:number,a:number,b:number)=>Math.max(a,Math.min(b,x));
export const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export const dist=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export function spring(p:number,v:number,target:number,omega:number,dt:number):[number,number] {
 const e=Math.exp(-omega*dt),d=p-target,j=v+omega*d;
 return [target+(d+j*dt)*e,(v-omega*j*dt)*e];
}
export interface Travel { from:Point; velocity:Point; to:Point; at:number; duration:number; lift:number }
export function travelPoint(s:Travel,now:number):Point {
 const t=clamp((now-s.at)/s.duration,0,1),t2=t*t,t3=t2*t,d=s.duration/1000;
 return {x:(2*t3-3*t2+1)*s.from.x+(t3-2*t2+t)*s.velocity.x*d+(-2*t3+3*t2)*s.to.x,
 y:(2*t3-3*t2+1)*s.from.y+(t3-2*t2+t)*s.velocity.y*d+(-2*t3+3*t2)*s.to.y-16*t2*(1-t)*(1-t)*s.lift};
}
export type HandMode='idle'|'key'|'mouse'|'cheer'|'privacy';
export class HandMotion {
 pos:Point; velocity:Point={x:0,y:0}; target:Point; mode:HandMode='idle'; travel:Travel|null=null;
 held=new Map<number,{pt:Point;at:number}>(); lastKeyAt=-1e6; contactAt=-1e6; releasedAt=-1e6;
 squash=0; palmAngle=0; private palmVelocity=0; lastVk:number|null=null; contactSerial=0; private landed=false;
 constructor(public side:'left'|'right',point:Point){this.pos={...point};this.target={...point};}
 start(target:Point,mode:HandMode,now:number,lift=14){
  const distance=dist(this.pos,target),duration=mode==='key'?clamp(72+distance*.55,78,165):clamp(130+distance*.25,140,220);
  this.target={...target};this.mode=mode;this.travel={from:{...this.pos},velocity:{x:clamp(this.velocity.x,-450,450),y:clamp(this.velocity.y,-450,450)},to:{...target},at:now,duration,lift:mode==='key'?clamp(distance*.16,6,23):lift};
  this.contactAt=now+duration;this.landed=false;
 }
 key(vk:number,point:Point,now:number){this.held.set(vk,{pt:{...point},at:now});this.lastVk=vk;this.lastKeyAt=now;this.releasedAt=-1e6;this.start(point,'key',now);}
 up(vk:number,now:number){if(this.held.delete(vk))this.releasedAt=now;}
 isTyping(now:number){return this.held.size>0||(this.mode==='key'&&now<Math.max(this.contactAt+100,this.lastKeyAt+210));}
 update(dt:number,now:number,desired:Point,mode:HandMode){
  if(mode!==this.mode)this.start(desired,mode,now,mode==='privacy'?12:8);
  const before={...this.pos};
  [this.palmAngle,this.palmVelocity]=spring(this.palmAngle,this.palmVelocity,mode==='cheer'||mode==='privacy'?Math.PI:0,16,dt);
  if(this.travel&&now<this.travel.at+this.travel.duration){
   // During mouse acquisition the destination follows the actual mouse; never teleport the palm.
   if(mode==='mouse')this.travel.to={...desired};
   this.pos=travelPoint(this.travel,now);
  }else{
   if(this.travel){this.pos={...this.travel.to};this.travel=null;if(mode==='key'){this.contactSerial++;this.landed=true;}}
   if(mode==='key'){
    this.pos={...this.target};
    // A second held key is restored once the newer key is released.
    if(this.lastVk!==null&&!this.held.has(this.lastVk)&&this.held.size&&now>this.contactAt+90){
     const [vk,val]=[...this.held].sort((a,b)=>b[1].at-a[1].at)[0];this.lastVk=vk;this.start(val.pt,'key',now);
    }
   }else if(mode==='mouse')this.pos={...desired};
   else{[this.pos.x,this.velocity.x]=spring(this.pos.x,this.velocity.x,desired.x,20,dt);[this.pos.y,this.velocity.y]=spring(this.pos.y,this.velocity.y,desired.y,20,dt);}
  }
  if(mode==='key'||mode==='mouse'||this.travel){this.velocity={x:(this.pos.x-before.x)/dt,y:(this.pos.y-before.y)/dt};}
  const contactAge=now-this.contactAt;
  this.squash=mode==='key'&&this.landed?Math.max(0,Math.sin(Math.PI*clamp(contactAge/95,0,1))):0;
 }
 reset(now:number,point:Point){this.held.clear();this.lastKeyAt=-1e6;this.lastVk=null;this.start(point,'idle',now);}
 snapshot(){return{side:this.side,position:{...this.pos},target:{...this.target},mode:this.mode,vk:this.lastVk,contactAt:this.contactAt,palmAngle:this.palmAngle,squash:this.squash,held:[...this.held.keys()],travel:this.travel?{...this.travel}:null};}
}
export interface ArmPose { shoulder:Point; elbow:Point; wrist:Point; tip:Point; extension:number }
export function solveArm(shoulder:Point,tip:Point,side:'left'|'right',squash=0,palmAngle=0):ArmPose {
 const wrist={x:tip.x+Math.sin(palmAngle)*12,y:tip.y-Math.cos(palmAngle)*12*(1-squash*.12)},dx=wrist.x-shoulder.x,dy=wrist.y-shoulder.y,d=Math.max(.001,Math.hypot(dx,dy));
 // The torso does most reaching. Small elastic extension keeps the fingertip exact at edge keys.
 const compression=clamp(d/103,.3,1),extension=Math.max(1,d/(111*compression)),a=58*compression*extension,b=56*compression*extension;
 const along=(a*a-b*b+d*d)/(2*d),height=Math.sqrt(Math.max(0,a*a-along*along));
 const sign=side==='left'?-1:1,ux=dx/d,uy=dy/d;
 return{shoulder:{...shoulder},elbow:{x:shoulder.x+ux*along+uy*height*sign,y:shoulder.y+uy*along-ux*height*sign},wrist,tip:{...tip},extension};
}
