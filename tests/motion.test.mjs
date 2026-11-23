import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source=fs.readFileSync(new URL('../src/ggbondMotion.ts',import.meta.url),'utf8');
const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {HandMotion,solveArm,spring}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
test('a key contact is exact and a retarget preserves the current hand position',()=>{
 const h=new HandMotion('right',{x:200,y:300});h.key(65,{x:320,y:350},0);
 h.update(.04,40,h.target,'key');const before={...h.pos};h.key(80,{x:140,y:360},40);
 assert.deepEqual(h.pos,before);h.update(.2,300,h.target,'key');assert.deepEqual(h.pos,{x:140,y:360});
});
test('a released key remains down briefly, then returns to idle',()=>{
 const h=new HandMotion('left',{x:150,y:290});h.key(65,{x:170,y:350},0);h.update(.15,150,h.target,'key');h.up(65,160);
 assert.equal(h.isTyping(170),true);assert.equal(h.isTyping(500),false);
 h.update(.1,500,{x:150,y:290},'idle');h.update(.2,750,{x:150,y:290},'idle');assert.equal(h.isTyping(900),false);
});
test('IK preserves fingertip contact at distant keys and raised hands',()=>{
 for(const side of ['left','right'])for(const tip of [{x:40,y:330},{x:480,y:400},{x:150,y:180}]){
  const p=solveArm({x:240,y:250},tip,side,0,tip.y<250?Math.PI:0);assert.deepEqual(p.tip,tip);
  for(const v of [p.shoulder,p.elbow,p.wrist,p.tip])assert.ok(Number.isFinite(v.x)&&Number.isFinite(v.y));
 }
});
test('the body spring converges without a frame-rate-dependent result',()=>{
 const run=(dt)=>{let p=0,v=0;for(let i=0;i<Math.round(1/dt);i++)[p,v]=spring(p,v,80,11,dt);return p};
 assert.ok(Math.abs(run(1/30)-run(1/120))<1e-8);assert.ok(Math.abs(run(1/60)-80)<.1);
});
