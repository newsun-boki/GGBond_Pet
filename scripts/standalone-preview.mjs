import fs from 'node:fs';
import path from 'node:path';
const root='dist-ggbond-preview',assets=path.join(root,'assets');
const jsName=fs.readdirSync(assets).find(n=>n.endsWith('.js'));
if(!jsName)throw new Error('Build the preview with Vite first');
let js=fs.readFileSync(path.join(assets,jsName),'utf8');
for(const name of fs.readdirSync(assets).filter(n=>n.endsWith('.png'))){
 const data='data:image/png;base64,'+fs.readFileSync(path.join(assets,name)).toString('base64');
 const old='new URL('+JSON.stringify(name)+',import.meta.url).href';
 if(!js.includes(old))throw new Error('Missing asset reference: '+name);
 js=js.replaceAll(old,JSON.stringify(data));
}
let html=fs.readFileSync(path.join(root,'ggbond-preview.html'),'utf8').replace(/<script type="module"[^>]*src="[^"]+"[^>]*><\/script>/g,'');
html+='<script type="module">'+js.replaceAll('</script','<\\/script')+'</script>';
fs.writeFileSync(path.join(root,'GGBond-Pet-preview.html'),html);
console.log('Offline preview:',path.join(root,'GGBond-Pet-preview.html'));
