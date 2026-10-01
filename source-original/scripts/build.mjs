import {build} from 'esbuild';import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist/server',{recursive:true});await mkdir('dist/.openai',{recursive:true});
const assets={};for(const [name,type] of [['index.html','text/html; charset=utf-8'],['app.js','text/javascript; charset=utf-8'],['style.css','text/css; charset=utf-8']])assets['/'+name]={body:await readFile('static/'+name,'utf8'),type};
await writeFile('src/generated-assets.js','export default '+JSON.stringify(assets));
await build({entryPoints:['src/worker.js'],bundle:true,format:'esm',target:'es2022',platform:'browser',outfile:'dist/server/index.js',minify:true});
await writeFile('dist/.openai/hosting.json',await readFile('.openai/hosting.json'));await rm('src/generated-assets.js');
