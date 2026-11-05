#!/usr/bin/env node
/** Deterministic semantic terminal mockups and clickable state storyboard.
 * No React/termcn runtime is loaded. Previews are approximations of declared UI contracts.
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {getBundle,featureDir,requireFeature,resolveRepoRoot,parseArgs} from './generate-html.mjs';

const DEFAULT_THEMES={
 dark:{bg:'#0e1626',panel:'#162338',fg:'#eef4ff',muted:'#91a5c1',accent:'#65e8d6',border:'#3b526e',error:'#ff9a9a'},
 light:{bg:'#f8fafc',panel:'#ffffff',fg:'#1e293b',muted:'#64748b',accent:'#137a72',border:'#b8c7d9',error:'#b42331'}
};
const xml=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const jsonForScript=x=>JSON.stringify(x).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
function readMaybe(dir,file){const p=path.join(dir,file);if(!fs.existsSync(p))return null;if(fs.lstatSync(p).isSymbolicLink())throw new Error('Symlinked input refused: '+p);return JSON.parse(fs.readFileSync(p,'utf8'));}
function addManifestFiles(dir,names){
 const p=path.join(dir,'manifest.json');if(!fs.existsSync(p))return;safeOutput(p);const obj=JSON.parse(fs.readFileSync(p,'utf8'));if(!Array.isArray(obj.files))throw new Error('Invalid manifest.files');obj.files=[...new Set([...obj.files,...names])].sort();fs.writeFileSync(p,JSON.stringify(obj,null,2)+'\n');
}
function safeOutput(p){let n=p;while(n!==path.dirname(n)){if(fs.existsSync(n)&&fs.lstatSync(n).isSymbolicLink())throw new Error('Symlinked output refused: '+n);n=path.dirname(n);}}
function cellWidth(s){let n=0;for(const c of String(s)){const u=c.codePointAt(0);if(u<32||u>=0x300&&u<=0x36f||u===0x200d)continue;n+=(u>=0x1100&&u<=0x115f||u>=0x2e80&&u<=0xa4cf||u>=0xac00&&u<=0xd7a3||u>=0xf900&&u<=0xfaff||u>=0xfe10&&u<=0xfe6f||u>=0xff01&&u<=0xff60||u>=0xffe0&&u<=0xffe6||u>=0x1f300&&u<=0x1faff)?2:1;}return n;}
function fit(s,width){let out='',count=0;for(const c of String(s).replace(/[\u0000-\u001f\u007f\u001b]/g,' ').replace(/\s+/g,' ')){const w=cellWidth(c);if(count+w>width)break;out+=c;count+=w;}return out+' '.repeat(Math.max(0,width-count));}
function printable(value){if(value==null)return '';if(typeof value==='object')return Array.isArray(value)?value.map(printable).join(', '):JSON.stringify(value);return String(value);}
function flatten(region){return [region,...(region.children||[]).flatMap(flatten)];}
function lineNodes(node,ctx,depth=0){
 const ind=' '.repeat(Math.min(depth*2,10)),kind=node.kind||'unknown',label=node.label||node.id||kind;
 const override=ctx.fixture.components?.[node.id]||{};
 const designProps=ctx.design?.componentProps?.[ctx.screen.id+'/'+node.id]||{};
 if(override.hidden)return [];
 if(kind==='container'){const children=(node.children||[]).flatMap(n=>lineNodes(n,ctx,depth+(node.id==='root'?0:1)));
   if(node.orientation==='horizontal'&&children.length>1)return [ind+children.map(l=>l.trim()).join('  │  ')];return children;}
 if(kind==='text'){
   const val=override.text??(node.data_ref?ctx.fixture.data?.[node.data_ref]:undefined);
   if(val!==undefined)return [ind+label+': '+printable(val)];
   return [ind+label];}
 if(kind==='list'){
   const items=override.items??ctx.fixture.data?.[node.data_ref]??[];
   const arr=Array.isArray(items)?items:[];
   return [ind+label, ...(arr.length?arr.slice(0,7).map((item,i)=>ind+(i===(ctx.fixture.selectedIndex||0)?'  ▸ ':'    ')+(typeof item==='object'?(item.title||item.label||printable(item)):printable(item))):[ind+'  (no sample items)'])];}
 if(kind==='input'){
   const val=override.value??ctx.fixture.state?.draft_title??designProps.defaultValue??'';
   const disabled=ctx.state.id.endsWith('.saving')||(override.disabled??ctx.fixture.disabled??designProps.disabled??false);
   const focused=ctx.fixture.focus===node.id;
   const shown=printable(val)||(designProps.placeholder?'‹'+printable(designProps.placeholder)+'›':'');
   return [ind+label+': '+(disabled?'[ '+shown+' ] (disabled)':focused?'⟦'+shown+'▌⟧':'[ '+shown+' ]')];}
 if(kind==='button'){
   const disabled=override.disabled??false;
   return [ind+(disabled?'( '+label+' )':'[ '+label+' ]')+(ctx.fixture.focus===node.id?' ◀':'')];}
 if(kind==='status'){
   const message=override.text??(node.id.toLowerCase().includes('error')?ctx.fixture.state?.error_message:undefined)??(node.id.toLowerCase().includes('detail')?ctx.fixture.status:undefined);
   const meaningful=message||(!ctx.fixture.suppressDefaultStatus?ctx.state.description:null);
   return meaningful?[ind+(ctx.state.id.endsWith('.error')||ctx.state.id.endsWith('.invalid')?'! ':'· ')+printable(meaningful)]:[];
 }
 return [ind+'['+kind+': '+label+' — unsupported preview]'];
}
export function renderSnapshot(screen,state,fixture={},options={}){
 const cols=options.cols||80,rows=options.rows||24;
 if(!Number.isInteger(cols)||!Number.isInteger(rows)||cols<20||cols>240||rows<8||rows>90)throw new Error('Viewport must be 20-240 cols and 8-90 rows');
 const violations=[];if(cols<screen.min_size.cols||rows<screen.min_size.rows)violations.push(`Below declared minimum ${screen.min_size.cols}×${screen.min_size.rows}`);
 const inner=cols-4;
 const raw=[` ${screen.title} / ${state.id}${state.terminal?' [TERMINAL]':''}`,'─'.repeat(Math.max(0,Math.min(inner,cols-4))), ...(state.terminal?['Flow ended (terminal state).']:screen.regions.flatMap(r=>lineNodes(r,{state,fixture,design:options.design,screen},0))), '',...screen.keybindings.map(k=>`${k.key} → ${k.event}`)];
 let clipped=raw.some(s=>cellWidth(s)>inner)||raw.length>rows-2;
 const lines=['┌'+'─'.repeat(cols-2)+'┐',...raw.slice(0,rows-2).map(s=>'│ '+fit(s,inner)+' │')];
 while(lines.length<rows-1)lines.push('│ '+fit('',inner)+' │');
 lines.push('└'+'─'.repeat(cols-2)+'┘');
 if(clipped)violations.push('Preview content clipped at selected viewport');
 return {text:lines.join('\n'),lines,clipped,warnings:violations};
}
function stateFixture(scenarios,state){const base=scenarios?.defaults||{};const over=scenarios?.states?.[state.id]||{};
 return {...base,...over,data:{...(base.data||{}),...(over.data||{})},state:{...(base.state||{}),...(over.state||{})},components:{...(base.components||{}),...(over.components||{})}};}
function validThemes(design){const themes={...DEFAULT_THEMES,...(design?.themes||{})};for(const [k,v] of Object.entries(themes)){
 if(!/^[a-z][\w-]*$/.test(k))throw new Error('Invalid theme id: '+k);
 for(const [key,c]of Object.entries(v))if(!/^(#[0-9a-fA-F]{3,8})$/.test(c))throw new Error('Invalid color token: '+k+'.'+key);
 }return themes;
}
function snapshots(bundle,scenarios,options){
 const screens=bundle.screens?.screens||[],states=bundle.machine?.states||[],transitions=bundle.machine?.transitions||[];
 if(!screens.length||!states.length)throw new Error('Mockups require full screens.json and machine.json; contracts-only features are unsupported');
 const screenIndex=new Map(screens.map(s=>[s.id,s]));const stateIds=new Set(states.map(s=>s.id));
 for(const s of states)if(!screenIndex.has(s.screen))throw new Error('State references missing screen: '+s.id);
 for(const tr of transitions)if(!stateIds.has(tr.from)||!stateIds.has(tr.to))throw new Error('Transition has invalid endpoint: '+tr.id);
 const catalogNames=new Set((options.catalog?.components||[]).map(c=>c.name));const mappings=options.design?.componentMappings||{};
 const mappingWarnings=[];for(const [kind,target]of Object.entries(mappings))if(!catalogNames.has(target))mappingWarnings.push(`Mapping ${kind} → ${target} is not in imported termcn catalog`);
 const allStates=states.map(state=>{
  const screen=screenIndex.get(state.screen),fixture=stateFixture(scenarios,state);
  return {...state,screenTitle:screen.title,preview:renderSnapshot(screen,state,fixture,options),fixtureType:scenarios?.states?.[state.id]?'declared sample':'generated fallback'};
 });
 return {screens:screens.map(s=>({id:s.id,title:s.title,states:allStates.filter(t=>t.screen===s.id).map(t=>t.id)})),states:allStates,transitions,initial:bundle.machine.initial,mappingWarnings};
}
function svgSnapshot(state,theme){const lines=state.preview.lines,cols=lines[0]?cellWidth(lines[0]):80;
 const w=cols*9+40,h=lines.length*19+42;
 const tspans=lines.map((line,i)=>`<text x="20" y="${32+i*19}" xml:space="preserve" fill="${xml(i===1?theme.accent:theme.fg)}">${xml(line)}</text>`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${xml(state.id)} sample terminal mockup" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><rect width="100%" height="100%" rx="12" fill="${xml(theme.bg)}"/><g font-family="DejaVu Sans Mono,monospace" font-size="15">${tspans}</g></svg>\n`;
}
function stylesheet(){return `<style>
:root{font-family:Inter,system-ui,sans-serif;color-scheme:dark;--bg:#0a1020;--fg:#e2e8f0;--sub:#98a9c0;--panel:#131e32;--border:#30425b;--accent:#5eead4}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg)}header{position:sticky;top:0;z-index:5;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 24px;background:#111a2b;border-bottom:1px solid #30425b;flex-wrap:wrap}h1{font-size:18px;margin:0}small,.muted{color:var(--sub)}.controls{display:flex;gap:8px;align-items:center;flex-wrap:wrap}select,input{background:#1d2c43;color:var(--fg);border:1px solid #46617f;border-radius:8px;padding:8px;min-width:120px}label{font-size:12px;color:var(--sub)}main{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:16px;padding:20px;max-width:1800px;margin:auto}.lane{margin-bottom:22px;border:1px solid var(--border);border-radius:12px;background:#0e1728;padding:18px}.lane h2{font-size:15px;display:flex;justify-content:space-between;align-items:center;margin:0 0 14px}.lane .states{display:grid;grid-template-columns:repeat(auto-fill,minmax(350px,1fr));gap:12px}.card{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:12px;min-width:0}.card:focus-within,.card.active{border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)}.card h3{margin:0;font-size:13px;display:flex;justify-content:space-between;gap:8px}.badge{font-size:10px;font-weight:600;color:#92b4cf;background:#1e354a;border-radius:4px;padding:3px 6px}.card p{color:var(--sub);font-size:12px;margin:6px 0 10px}.terminal{background:var(--mock-bg);color:var(--mock-fg);border:1px solid var(--mock-border);padding:10px 12px;border-radius:8px;overflow:auto;max-height:470px}.terminal pre{margin:0;line-height:1.32;font:12px/1.35 'DejaVu Sans Mono',Consolas,monospace;white-space:pre;width:max-content}.edges{padding-top:9px;display:flex;gap:5px;flex-wrap:wrap}button.edge{border:1px solid #375c69;background:#172f3d;color:#9ef0df;border-radius:5px;padding:5px 7px;cursor:pointer;font:11px monospace}button.edge:hover{background:#25475b}aside{position:sticky;top:88px;align-self:start;background:#121e31;border:1px solid var(--border);border-radius:10px;padding:16px;max-height:calc(100vh - 105px);overflow:auto}aside h2{font-size:15px;margin:0 0 12px}aside h3{font-size:13px}aside pre{white-space:pre-wrap;word-break:break-word;font-size:12px;color:#c6d6e9}.warn{font-size:11px;color:#ffbf9a}.note{font-size:11px;color:#92a3b8}.sr{position:absolute;left:-9999px}footer{padding:12px 24px;color:#92a3b8;border-top:1px solid var(--border);font-size:11px}
@media(max-width:970px){main{display:block}aside{position:static;margin-bottom:16px;max-height:none}.lane .states{grid-template-columns:repeat(auto-fill,minmax(min(100%,320px),1fr))}}
</style>`;}
function generateHTML(model,themes,chosen){
 const view=model.screens.map(screen=>`<section class="lane" id="screen-${xml(screen.id)}"><h2>${xml(screen.title)} <small>${screen.states.length} state${screen.states.length===1?'':'s'}</small></h2><div class="states">${screen.states.map(id=>{
 const s=model.states.find(x=>x.id===id);
 const outgoing=model.transitions.filter(t=>t.from===s.id);
 return `<article class="card" id="state-${xml(s.id)}" data-state="${xml(s.id)}" data-screen="${xml(s.screen)}"><h3><span>${xml(s.id)}</span><span class="badge">${s.terminal?'TERMINAL':s.fixtureType}</span></h3><p>${xml(s.description||'')}</p><div class="terminal"><pre>${xml(s.preview.text)}</pre></div><div class="edges">${outgoing.map(t=>`<button type="button" class="edge" data-transition="${xml(t.id)}" title="${xml(t.description||'')}">${xml(t.event)} → ${xml(t.to)}</button>`).join('')||'<span class="note">No outgoing transitions</span>'}</div>${s.preview.warnings.map(w=>`<p class="warn">${xml(w)}</p>`).join('')}</article>`;}).join('')}</div></section>`).join('');
 const profiles=Object.keys(themes);const colors={...themes[chosen]};
 const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TUI screen-flow storyboard</title>${stylesheet()}</head><body><header><div><h1>Screen-flow storyboard</h1><small>${model.screens.length} screens · ${model.states.length} states · ${model.transitions.length} transitions · semantic preview, not runtime capture</small></div><div class="controls"><label for="find">Find state</label><input id="find" placeholder="Filter states…"><label for="profile">Theme</label><select id="profile">${profiles.map(p=>`<option value="${xml(p)}" ${p===chosen?'selected':''}>${xml(p)}</option>`).join('')}</select></div></header><main><div id="story">${view}</div><aside aria-live="polite"><h2>Selection inspector</h2><p class="note">Select a state or transition to inspect the canonical metadata.</p><pre id="details">Initial state: ${xml(model.initial)}</pre><h3>Component adapter status</h3><p class="note">termcn is a schema source; these snapshots are semantic approximations, not live Ink/OpenTUI captures.</p>${model.mappingWarnings.map(w=>`<p class="warn">${xml(w)}</p>`).join('')}</aside></main><footer>Self-contained offline output · No application commands are executed · Sample data is illustrative</footer><script>const MODEL=${jsonForScript(model)};const THEMES=${jsonForScript(themes)};
const applyTheme=name=>{const t=THEMES[name];if(!t)return;document.querySelectorAll('.terminal').forEach(e=>{e.style.setProperty('--mock-bg',t.bg);e.style.setProperty('--mock-fg',t.fg);e.style.setProperty('--mock-border',t.border);});};
applyTheme(${jsonForScript(chosen)});document.getElementById('profile').addEventListener('change',e=>applyTheme(e.target.value));
const details=document.getElementById('details');document.getElementById('find').addEventListener('input',e=>{const q=e.target.value.toLowerCase();document.querySelectorAll('.card').forEach(c=>{const s=MODEL.states.find(x=>x.id===c.dataset.state);c.hidden=!(s.id.toLowerCase().includes(q)||s.description?.toLowerCase().includes(q));});});
const choose=(id)=>{document.querySelectorAll('.card.active').forEach(c=>c.classList.remove('active'));const s=MODEL.states.find(x=>x.id===id);if(!s)return;const el=document.getElementById('state-'+id);el?.classList.add('active');details.textContent=JSON.stringify({state:s.id,screen:s.screen,description:s.description,terminal:s.terminal,fixture:s.fixtureType,preview_warnings:s.preview.warnings,outgoing:MODEL.transitions.filter(t=>t.from===id)},null,2);};
document.querySelectorAll('.card').forEach(c=>c.addEventListener('click',e=>{if(!e.target.closest('button.edge'))choose(c.dataset.state)}));
document.querySelectorAll('button.edge').forEach(b=>b.addEventListener('click',()=>{const t=MODEL.transitions.find(x=>x.id===b.dataset.transition);if(!t)return;choose(t.to);details.textContent=JSON.stringify(t,null,2);document.getElementById('state-'+t.to)?.scrollIntoView({behavior:'smooth',block:'center'});}));
choose(MODEL.initial);</script></body></html>`;
 return html;
}
export function generateMockups({repoRoot,feature,cols=80,rows=24,theme='dark'}){
 const dir=featureDir(repoRoot,requireFeature(feature));const bundle=getBundle(repoRoot,feature),design=readMaybe(dir,'design.json'),scenarios=readMaybe(dir,'scenarios.json'),catalog=readMaybe(dir,'components.catalog.json');
 const themes=validThemes(design);if(!themes[theme])throw new Error('Unknown theme: '+theme);
 const data=snapshots(bundle,scenarios,{cols,rows,catalog,design});const outputDir=path.join(dir,'mockups');safeOutput(outputDir);fs.mkdirSync(outputDir,{recursive:true});
 const items=[];for(const state of data.states){const name=state.id.replace(/[^a-zA-Z0-9_.-]/g,'_');const txt=path.join(outputDir,name+'.txt'),svg=path.join(outputDir,name+'.svg');safeOutput(txt);safeOutput(svg);
   fs.writeFileSync(txt,state.preview.text+'\n');fs.writeFileSync(svg,svgSnapshot(state,themes[theme]));items.push({state:state.id,screen:state.screen,text:'mockups/'+name+'.txt',svg:'mockups/'+name+'.svg',warnings:state.preview.warnings});}
 const manifest={schema_version:'1.0.0',generator:'semantic-tui-mockup-v1',source:'canonical screens.json + machine.json',note:'Mockups are semantic previews, not termcn runtime captures.',viewport:{cols,rows},theme,components_cataloged:catalog?.components?.length||0,screen_count:data.screens.length,state_count:data.states.length,transition_count:data.transitions.length,items,mapping_warnings:data.mappingWarnings};
 safeOutput(path.join(outputDir,'index.json'));fs.writeFileSync(path.join(outputDir,'index.json'),JSON.stringify(manifest,null,2)+'\n');
 const htmlPath=path.join(dir,'storyboard.html');safeOutput(htmlPath);fs.writeFileSync(htmlPath,generateHTML(data,themes,theme));
 addManifestFiles(dir,['storyboard.html']);
 return {html:htmlPath,manifest:path.join(outputDir,'index.json'),...manifest};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const argv=parseArgs(process.argv.slice(2));const o=generateMockups({repoRoot:resolveRepoRoot(argv['repo-root']),feature:argv.feature,cols:argv.cols?Number(argv.cols):80,rows:argv.rows?Number(argv.rows):24,theme:argv.theme||'dark'});console.log(`Generated ${o.state_count} mockups and storyboard: ${o.html}`);for(const w of o.mapping_warnings)console.warn('WARN '+w);}
 catch(e){console.error('Error: '+e.message);process.exitCode=1;}
}
