import {KuroCatEngine} from './catEngine';
import {keyboardEventToVk} from './webKeyMap';
import {getKeyboardLayout,resolveKeyByVk} from './keyboardLayout';
import {catAudio} from './audio';
catAudio.setPurrIntensity(0);
const canvas=document.querySelector<HTMLCanvasElement>('#pet')!;
let engine=new KuroCatEngine(canvas,{embedded:true});engine.setCatAppearance('ggbond');engine.showKeyBubbles=false;engine.start();
let timers:number[]=[],demoFrame=0,virtual:number|null=null;const nativeNow=performance.now.bind(performance);
function clearDemo(){timers.forEach(clearTimeout);timers=[];cancelAnimationFrame(demoFrame);}
function reset(){clearDemo();engine.setPrivacyMode(true);engine.setPrivacyMode(false);engine.setCatAppearance((document.querySelector('#skin') as HTMLSelectElement).value);(engine as any).lastMouseMoveAt=-1e6;document.querySelector('#state')!.textContent='可以开始打字了';}
const later=(fn:()=>void,t:number)=>{timers.push(window.setTimeout(fn,t));};
function tap(vk:number,t:number){later(()=>engine.onKeyDown(vk,false),t);later(()=>engine.onKeyUp(vk),t+85);}
document.querySelector('#skin')!.addEventListener('change',reset);
for(const id of ['layout','orientation'])document.querySelector('#'+id)!.addEventListener('change',()=>{clearDemo();engine.setKeyboardConfig((document.querySelector('#layout') as HTMLSelectElement).value as any,(document.querySelector('#orientation') as HTMLSelectElement).value as any);engine.ggbond.reset();});
document.querySelector('#keys')!.addEventListener('click',()=>{reset();const keys=[65,83,68,70,74,75,76,13,81,80,90,77,32,8];keys.forEach((vk,i)=>tap(vk,250+i*360));document.querySelector('#state')!.textContent='演示：按键对应位置与回弹';});
function mouseDemo(both=false){reset();const start=performance.now();function step(now:number){const age=(now-start)/1000;if(age>9)return;engine.onGlobalMouseMove(.5+Math.sin(age*1.9)*.46,.5+Math.cos(age*1.4)*.43);demoFrame=requestAnimationFrame(step)}demoFrame=requestAnimationFrame(step);for(let i=0;i<5;i++){later(()=>engine.onMouseDown(i%2?'right':'left'),700+i*1450);later(()=>engine.onMouseUp(i%2?'right':'left'),880+i*1450);}if(both)for(let i=0;i<22;i++)tap([65,70,75,80,32,13][i%6],400+i*330);document.querySelector('#state')!.textContent=both?'演示：握鼠与打字同时进行':'演示：移动、左键、右键与身体联动';}
document.querySelector('#mouse')!.addEventListener('click',()=>mouseDemo());document.querySelector('#both')!.addEventListener('click',()=>mouseDemo(true));
document.querySelector('#combo')!.addEventListener('click',()=>{reset();for(let i=0;i<100;i++)tap([65,75,83,76,68,74][i%6],i*105);document.querySelector('#state')!.textContent='演示：×10 → ×30 → ×60 → ×100';});
document.querySelector('#privacy')!.addEventListener('click',()=>{clearDemo();engine.setPrivacyMode(!engine.privacyMode)});document.querySelector('#reset')!.addEventListener('click',reset);
const held=new Set<number>();window.addEventListener('keydown',e=>{if(['SELECT','INPUT','BUTTON'].includes((e.target as HTMLElement).tagName))return;const vk=keyboardEventToVk(e);if(vk!==null){held.add(vk);engine.onKeyDown(vk,e.repeat)}if(['Space','Tab'].includes(e.code))e.preventDefault()});window.addEventListener('keyup',e=>{const vk=keyboardEventToVk(e);if(vk!==null){held.delete(vk);engine.onKeyUp(vk)}});window.addEventListener('blur',()=>{held.forEach(vk=>engine.onKeyUp(vk));held.clear()});
canvas.addEventListener('pointermove',e=>{const r=canvas.getBoundingClientRect();engine.onGlobalMouseMove((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height)});canvas.addEventListener('mousedown',e=>engine.onMouseDown(e.button===2?'right':'left'));window.addEventListener('mouseup',e=>engine.onMouseUp(e.button===2?'right':'left'));canvas.addEventListener('contextmenu',e=>e.preventDefault());canvas.addEventListener('wheel',()=>engine.onMouseWheel());
// Preview-only replay API. Production Tauri entry does not import this module.
(window as any).ggQA={
 engine:()=>engine,ready:()=>engine.ggbond.ready,
 async reset(layout='65',orientation='cat'){
  clearDemo();engine.stop();virtual=10000;Object.defineProperty(performance,'now',{configurable:true,value:()=>virtual??nativeNow()});
  engine=new KuroCatEngine(canvas,{embedded:true});engine.showKeyBubbles=false;engine.setCatAppearance('ggbond');engine.setKeyboardConfig(layout as any,orientation as any);
  await Promise.all(Array.from(document.images).map(i=>i.decode().catch(()=>{})));while(!engine.ggbond.ready)await new Promise(r=>setTimeout(r,10));this.step(600);return this.snapshot();
 },
 step(ms:number){const n=Math.max(1,Math.ceil(ms/8));for(let i=0;i<n;i++){virtual=(virtual??nativeNow())+ms/n;(engine as any).update(Math.max(.001,ms/n/1000),virtual)}(engine as any).render();return this.snapshot();},
 key(vk:number,down=true,repeat=false){down?engine.onKeyDown(vk,repeat):engine.onKeyUp(vk);},
 mouse(x:number,y:number){engine.onGlobalMouseMove(x,y)},button(which:string,down:boolean){down?engine.onMouseDown(which):engine.onMouseUp(which)},
 privacy(active:boolean){engine.setPrivacyMode(active)},
 snapshot(){return engine.ggbond.snapshot()},
 keyPoint(vk:number){const spec=resolveKeyByVk(vk,engine.keyboardLayout);return spec?(engine as any).getKeyWorldCenter(spec):null},
 keys(){return getKeyboardLayout(engine.keyboardLayout).keys.map(k=>({id:k.id,vk:k.vkCodes[0],point:(engine as any).getKeyWorldCenter(k)}))},
 png(){return canvas.toDataURL('image/png')},
 resume(){virtual=null;Object.defineProperty(performance,'now',{configurable:true,value:nativeNow});engine.start()},
};
