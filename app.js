'use strict';
const $=(s,r=document)=>r.querySelector(s);
const n2=v=>Math.round(v*100)/100;
let _id=1;const uid=()=>'s'+(_id++);

/* ---------------- random ---------------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let rnd=Math.random;
const ri=(a,b)=>Math.floor(a+(b-a+1)*rnd());
const rf=(a,b)=>a+(b-a)*rnd();
const pick=a=>a[Math.floor(rnd()*a.length)];
function shuffleArr(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const newSeed=()=>Math.floor(Math.random()*999999999);

/* ---------------- color (OKLab) ---------------- */
const clamp01=v=>Math.min(1,Math.max(0,v));
function hexToRgb(h){h=String(h).replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16)||0;return[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]}
const toLin=c=>c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);
const toGam=c=>c<=0.0031308?12.92*c:1.055*Math.pow(c,1/2.4)-0.055;
function rgbToOklab(rgb){const[r,g,b]=rgb.map(toLin);
  const l=Math.cbrt(0.4122214708*r+0.5363325363*g+0.0514459929*b),m=Math.cbrt(0.2119034982*r+0.6806995451*g+0.1073969566*b),s=Math.cbrt(0.0883024619*r+0.2817188376*g+0.6299787005*b);
  return[0.2104542553*l+0.7936177850*m-0.0040720468*s,1.9779984951*l-2.4285922050*m+0.4505937099*s,0.0259040371*l+0.7827717662*m-0.8086757660*s]}
function oklabToLinear([L,a,b]){const l=(L+0.3963377774*a+0.2158037573*b)**3,m=(L-0.1055613458*a-0.0638541728*b)**3,s=(L-0.0894841775*a-1.2914855480*b)**3;
  return[4.0767416621*l-3.3077115913*m+0.2309699292*s,-1.2684380046*l+2.6097574011*m-0.3413193965*s,-0.0041960863*l-0.7034186147*m+1.7076147010*s]}
function labToHex(lab){return'#'+oklabToLinear(lab).map(c=>Math.round(toGam(clamp01(c))*255).toString(16).padStart(2,'0')).join('')}
function oklch(L,C,H){const h=H*Math.PI/180;let c=C;for(let i=0;i<40;i++){const lab=[L,c*Math.cos(h),c*Math.sin(h)];if(oklabToLinear(lab).every(v=>v>=-0.001&&v<=1.001))return labToHex(lab);c*=0.9}return labToHex([L,0,0])}
const WHITE=[0.985,0,0],DARK=[0.18,0,0];
let palLab=[];
function updatePalLab(){palLab=S.palette.map(h=>rgbToOklab(hexToRgb(h)))}
function fillColor(f){
  let lab;
  if(f.hex){lab=rgbToOklab(hexToRgb(f.hex))}
  else{const P=palLab.length;lab=[0,0,0];let tw=0;
    for(const[i,w]of f.mix){if(!(w>0))continue;const c=palLab[((i%P)+P)%P];lab[0]+=c[0]*w;lab[1]+=c[1]*w;lab[2]+=c[2]*w;tw+=w}
    if(tw>0)lab=lab.map(v=>v/tw);else lab=palLab[((f.mix[0][0]%P)+P)%P].slice()}
  const k=f.k||0;
  if(!k&&f.hex)return f.hex;
  if(k){const t=Math.min(1,Math.abs(k)),T=k>0?WHITE:DARK;lab=lab.map((v,i)=>v+(T[i]-v)*t)}
  return labToHex(lab)}

/* ---------------- palettes ---------------- */
const PRESETS=[
  {name:'Farbenkugel',bg:'#f2ead8',c:['#2d5f8a','#2e7d6b','#7fa33c','#e8c632','#e8862c','#c7372f','#7a3f6e']},
  {name:'Itten primaries',bg:'#f3efe6',c:['#e03c31','#f28a2e','#f4d03f','#3e9b57','#2b6cb0','#6b4c9a']},
  {name:'Watercolor study',bg:'#f6f3ec',c:['#a8c0cc','#ecd872','#86b07f','#f3a35e','#e35e57','#a06c99']},
  {name:'Light and Colour',bg:'#efe6c9',c:['#d2504a','#e6a15e','#e5d06b','#a6c27e','#8eb4c7','#6a7a90','#d6a0a8']},
  {name:'Interaction',bg:'#faf8f2',c:['#e8432e','#4ba6d1','#c94fa8','#3a7ed9','#db3d4f','#8dc04a']},
  {name:'Halftone',bg:'#ddd6d1',c:['#ff4512','#f55ad6','#8fd6d2','#b5a2f2','#f0b9a0']},
  {name:'Spectrum',bg:'#e6e3e0',c:['#0d0c0c','#e2dfdc','#2e9de0','#e3260f','#f3a01b','#1440c8']},
  {name:'Bauhaus',bg:'#f4f0e6',c:['#d62e2e','#f2c12e','#1f4fa3','#151515','#e9e1cf']},
];
const HARMONIES={any:'Any harmony',analogous:'Analogous',complementary:'Complementary',split:'Split complementary',triadic:'Triadic',tetradic:'Tetradic',spectrum:'Spectrum',tonal:'Tonal'};
function harmonyPalette(mode){
  if(mode==='any')mode=pick(Object.keys(HARMONIES).filter(m=>m!=='any'));
  const h=rf(0,360),C=rf(.11,.19);
  const Lh=H=>0.66+0.14*Math.cos((H-105)*Math.PI/180);
  const spec=[];
  const add=(H,dl=0,cm=1)=>{H=((H%360)+360)%360;spec.push([Math.min(.95,Math.max(.28,Lh(H)+dl+rf(-.05,.05))),C*cm,H])};
  switch(mode){
    case'analogous':for(let i=0;i<5;i++)add(h-48+i*24,rf(-.12,.1));break;
    case'complementary':add(h);add(h+180);add(h,.16,.6);add(h+180,-.16,.9);add(h+20,.06);break;
    case'split':add(h);add(h+150);add(h+210);add(h,.18,.5);add(h+180,-.2,.7);break;
    case'triadic':add(h);add(h+120);add(h+240);add(h+60,.15,.6);break;
    case'tetradic':add(h);add(h+90);add(h+180);add(h+270);break;
    case'spectrum':{const n=ri(6,8);for(let i=0;i<n;i++)add(h+i*360/n);break}
    case'tonal':for(let i=0;i<5;i++)spec.push([.32+i*.15,C*(1-Math.abs(i-2)*.18),h+rf(-6,6)]);break;
  }
  const bg=rnd()<.82?oklch(rf(.93,.97),rf(.006,.02),h+rf(-30,30)):oklch(rf(.16,.22),rf(.005,.02),h);
  return{palette:spec.map(([L,c,H])=>oklch(L,c,H)),bg,name:HARMONIES[mode]}}
function matchBg(){let a=0,b=0;for(const c of palLab){a+=c[1];b+=c[2]}const H=Math.atan2(b,a)*180/Math.PI;return oklch(.95,.014,H)}

/* ---------------- geometry ---------------- */
const ell=(rx,ry)=>`M${n2(-rx)},0A${n2(rx)},${n2(ry)} 0 1 0 ${n2(rx)},0A${n2(rx)},${n2(ry)} 0 1 0 ${n2(-rx)},0Z`;
function polyPts(n,w,h){const pts=[];for(let i=0;i<n;i++){const a=(-90+i*360/n)*Math.PI/180;pts.push([Math.cos(a),Math.sin(a)])}
  const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);const x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
  return pts.map(([x,y])=>[-w/2+(x-x0)/(x1-x0)*w,-h/2+(y-y0)/(y1-y0)*h])}
const wp=(rx,ry,deg)=>{const a=deg*Math.PI/180;return`${n2(rx*Math.sin(a))},${n2(-ry*Math.cos(a))}`};
function shapePath(s){
  const w=s.w/2,h=s.h/2;
  switch(s.type){
    case'rect':{const r=Math.min(Math.max(s.radius||0,0),.5)*Math.min(s.w,s.h);
      if(r<.5)return`M${n2(-w)},${n2(-h)}H${n2(w)}V${n2(h)}H${n2(-w)}Z`;
      return`M${n2(-w+r)},${n2(-h)}H${n2(w-r)}A${n2(r)},${n2(r)} 0 0 1 ${n2(w)},${n2(-h+r)}V${n2(h-r)}A${n2(r)},${n2(r)} 0 0 1 ${n2(w-r)},${n2(h)}H${n2(-w+r)}A${n2(r)},${n2(r)} 0 0 1 ${n2(-w)},${n2(h-r)}V${n2(-h+r)}A${n2(r)},${n2(r)} 0 0 1 ${n2(-w+r)},${n2(-h)}Z`}
    case'ellipse':return ell(w,h);
    case'ring':{const k=Math.min(.98,Math.max(.01,s.inner??.6));return ell(w,h)+ell(w*k,h*k)}
    case'polygon':{const p=polyPts(Math.max(3,Math.round(s.sides||3)),s.w,s.h);return'M'+p.map(([x,y])=>`${n2(x)},${n2(y)}`).join('L')+'Z'}
    case'wedge':{
      const sw=Math.min(360,Math.max(.1,s.sweep??90)),a0=s.start||0,a1=a0+sw,k=Math.min(.98,Math.max(0,s.inner||0));
      if(sw>=359.9)return k>0?ell(w,h)+ell(w*k,h*k):ell(w,h);
      const big=sw>180?1:0;
      let d=`M${wp(w,h,a0)}A${n2(w)},${n2(h)} 0 ${big} 1 ${wp(w,h,a1)}`;
      if(k>0)d+=`L${wp(w*k,h*k,a1)}A${n2(w*k)},${n2(h*k)} 0 ${big} 0 ${wp(w*k,h*k,a0)}Z`;else d+='L0,0Z';
      return d}
  }return''}
const tf=s=>`translate(${n2(s.x)} ${n2(s.y)}) rotate(${n2(s.rot||0)})`;
function shapeEl(s,withId=true){
  let a=`<path${withId?` data-id="${s.id}"`:''} d="${shapePath(s)}" fill="${fillColor(s.fill)}" fill-rule="evenodd" transform="${tf(s)}"`;
  if((s.opacity??1)<1)a+=` opacity="${n2(s.opacity)}"`;
  if(s.sw>0)a+=` stroke="${s.sc||'#000'}" stroke-width="${s.sw}" stroke-linejoin="round"`;
  if(s.blend&&s.blend!=='normal')a+=` style="mix-blend-mode:${s.blend}"`;
  return a+'/>'}
function rotPt(s,lx,ly){const a=(s.rot||0)*Math.PI/180,c=Math.cos(a),si=Math.sin(a);return[s.x+lx*c-ly*si,s.y+lx*si+ly*c]}

/* ---------------- state ---------------- */
const S={
  aspect:'16:9',W:1200,H:675,margin:60,bg:'#f2ead8',palette:PRESETS[0].c.slice(),paletteName:'Farbenkugel',
  gen:'sphere',params:{},seed:417203,blend:'normal',opacity:1,outline:1.25,outlineColor:'#3b3027',
  shapes:[],sel:new Set(),tool:'select',
};
function setAspect(a){S.aspect=a;const[x,y]=a.split(':').map(Number);if(x>=y){S.W=1200;S.H=Math.round(1200*y/x)}else{S.H=1200;S.W=Math.round(1200*x/y)}}
const P=()=>S.palette.length;
const F=(i,k=0)=>({mix:[[i,1]],k:n2(k)});
const F2=(a,b,t,k=0)=>({mix:[[a,n2(1-t)],[b,n2(t)]],k:n2(k)});
function distinct(n){const idx=shuffleArr([...Array(P()).keys()]);const out=[];for(let i=0;i<n;i++)out.push(idx[i%idx.length]);return out}
function area(){const m=Math.min(S.margin,S.W/2-20,S.H/2-20);return{x:m,y:m,w:S.W-2*m,h:S.H-2*m,cx:S.W/2,cy:S.H/2}}
function base(type,x,y,w,h,fill,extra){return Object.assign({id:uid(),type,x:n2(x),y:n2(y),w:n2(w),h:n2(h),rot:0,fill,opacity:S.opacity,blend:S.blend,sw:S.outline,sc:S.outlineColor},extra||{})}
function cell(kind,x,y,w,h,fill){
  switch(kind){case'circle':{const d=Math.min(w,h);return base('ellipse',x,y,d,d,fill)}
    case'diamond':return base('polygon',x,y,w,h,fill,{sides:4});
    case'rounded':return base('rect',x,y,w,h,fill,{radius:.22});
    default:return base('rect',x,y,w,h,fill,{radius:0})}}
function gridCells(rows,cols,gap,fn){const a=area();const cw=(a.w-gap*(cols-1))/cols,ch=(a.h-gap*(rows-1))/rows;const pad=gap===0?.75:0;
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++)fn(i,j,a.x+j*(cw+gap)+cw/2,a.y+i*(ch+gap)+ch/2,cw+pad,ch+pad)}
const CELL_OPTS=[['square','Square'],['rounded','Rounded'],['circle','Circle'],['diamond','Diamond']];

/* ---------------- generators ---------------- */
const GENS={
  tonal:{name:'Tonal grid',group:'Grids & checkerboards',
    icon:'<rect x="3" y="3" width="6" height="6" opacity=".35"/><rect x="9" y="3" width="6" height="6" opacity=".55"/><rect x="15" y="3" width="6" height="6" opacity=".8"/><rect x="3" y="9" width="6" height="6" opacity=".5"/><rect x="9" y="9" width="6" height="6" opacity=".7"/><rect x="15" y="9" width="6" height="6" opacity=".9"/><rect x="3" y="15" width="6" height="6" opacity=".65"/><rect x="9" y="15" width="6" height="6" opacity=".85"/><rect x="15" y="15" width="6" height="6"/>',
    params:[
      {k:'rows',label:'Rows',min:2,max:14,step:1,def:6,rmin:3,rmax:9},
      {k:'cols',label:'Columns',min:2,max:14,step:1,def:6,rmin:3,rmax:9},
      {k:'gap',label:'Gap',min:0,max:40,step:1,def:0,r:()=>pick([0,0,0,3,8,14])},
      {k:'cell',label:'Cell shape',type:'select',options:CELL_OPTS,def:'square',r:()=>pick(['square','square','square','rounded','circle','diamond'])},
      {k:'jitter',label:'Painterly variation',min:0,max:1,step:.05,def:.15,rmax:.4},
      {k:'sweep',label:'Light to dark sweep',min:-1,max:1,step:.05,def:0,r:()=>pick([0,0,rf(-.8,.8)])},
    ],
    build(p){const out=[];const[c00,c10,c01,c11]=distinct(4);
      gridCells(p.rows,p.cols,p.gap,(i,j,x,y,w,h)=>{
        const u=p.cols>1?j/(p.cols-1):.5,v=p.rows>1?i/(p.rows-1):.5;const jit=()=>Math.max(.05,1+rf(-p.jitter,p.jitter));
        const mix=[[c00,(1-u)*(1-v)*jit()],[c10,u*(1-v)*jit()],[c01,(1-u)*v*jit()],[c11,u*v*jit()]].map(([a,w])=>[a,n2(w)]);
        out.push(cell(p.cell,x,y,w,h,{mix,k:n2(p.sweep*(.5-v)*1.2+rf(-p.jitter,p.jitter)*.12)}))});
      return out}},
  checker:{name:'Checkerboard',group:'Grids & checkerboards',
    icon:'<rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="9" y="9" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><rect x="15" y="15" width="6" height="6"/><rect x="9" y="3" width="6" height="6" opacity=".3"/><rect x="3" y="9" width="6" height="6" opacity=".3"/><rect x="15" y="9" width="6" height="6" opacity=".3"/><rect x="9" y="15" width="6" height="6" opacity=".3"/>',
    params:[
      {k:'rows',label:'Rows',min:2,max:16,step:1,def:5,rmin:3,rmax:10},
      {k:'cols',label:'Columns',min:2,max:16,step:1,def:5,rmin:3,rmax:10},
      {k:'gap',label:'Gap',min:0,max:40,step:1,def:0,r:()=>pick([0,0,4,10])},
      {k:'cell',label:'Cell shape',type:'select',options:CELL_OPTS,def:'square',r:()=>pick(['square','square','rounded','circle','diamond'])},
      {k:'mode',label:'Pattern',type:'select',options:[['scatter','Scatter, no neighbors match'],['alternate','Alternate two colors'],['diagonal','Diagonal bands'],['rows','Stepped rows']],def:'scatter'},
      {k:'colors',label:'Colors used',min:2,max:8,step:1,def:4,rmin:2,rmax:6},
      {k:'tone',label:'Tone variation',min:0,max:1,step:.05,def:.15,rmax:.5},
    ],
    build(p){const out=[];const set=distinct(Math.min(p.colors,Math.max(2,P())));const grid=[];
      gridCells(p.rows,p.cols,p.gap,(i,j,x,y,w,h)=>{let idx;
        switch(p.mode){
          case'alternate':idx=set[(i+j)%2];if(set.length>2&&rnd()<.15)idx=set[2+ri(0,set.length-3)];break;
          case'diagonal':idx=set[(i+j)%set.length];break;
          case'rows':idx=set[(i+Math.floor(j/2))%set.length];break;
          default:{const avoid=new Set([grid[i]?.[j-1],grid[i-1]?.[j]]);const o=set.filter(s=>!avoid.has(s));idx=pick(o.length?o:set)}}
        (grid[i]||(grid[i]=[]))[j]=idx;
        out.push(cell(p.cell,x,y,w,h,F(idx,rf(-p.tone,p.tone)*.45)))});
      return out}},
  bands:{name:'Band studies',group:'Grids & checkerboards',
    icon:'<rect x="3" y="4" width="18" height="4"/><rect x="3" y="10" width="18" height="4" opacity=".55"/><rect x="8" y="10" width="1.6" height="4"/><rect x="14" y="10" width="1.6" height="4"/><rect x="3" y="16" width="6" height="4" opacity=".35"/><rect x="9" y="16" width="6" height="4" opacity=".6"/><rect x="15" y="16" width="6" height="4" opacity=".9"/>',
    params:[
      {k:'bands',label:'Bands',min:1,max:10,step:1,def:4,rmin:2,rmax:6},
      {k:'columns',label:'Columns',min:1,max:3,step:1,def:1,r:()=>pick([1,1,2])},
      {k:'steps',label:'Steps per band',min:2,max:12,step:1,def:5,rmin:3,rmax:8},
      {k:'gap',label:'Band gap',min:0,max:80,step:1,def:28,rmin:8,rmax:50},
      {k:'cellgap',label:'Step gap',min:0,max:16,step:1,def:0,r:()=>pick([0,0,0,2,6])},
      {k:'inserts',label:'Insert width',min:.02,max:1,step:.01,def:.12,rmin:.04,rmax:.4},
    ],
    build(p){const out=[];const a=area();const cols=p.columns;const colW=(a.w-p.gap*(cols-1))/cols;const bh=(a.h-p.gap*(p.bands-1))/p.bands;
      for(let c=0;c<cols;c++)for(let b=0;b<p.bands;b++){
        const x0=a.x+c*(colW+p.gap),y0=a.y+b*(bh+p.gap);const[ca,cb]=distinct(2);const kind=pick(['steps','steps','inserts','tones']);const n=p.steps;
        if(kind==='inserts'){out.push(base('rect',x0+colW/2,y0+bh/2,colW,bh,F(ca),{radius:0}));const w=Math.max(3,p.inserts*colW/n);
          for(let j=1;j<n;j++)out.push(base('rect',x0+j*colW/n,y0+bh/2,w,bh,F(cb),{radius:0}))}
        else{const cw=(colW-p.cellgap*(n-1))/n;const pad=p.cellgap===0?.75:0;
          for(let j=0;j<n;j++){const t=n>1?j/(n-1):0;const f=kind==='tones'?F(ca,(t-.5)*1.1):F2(ca,cb,t);
            out.push(base('rect',x0+j*(cw+p.cellgap)+cw/2,y0+bh/2,cw+pad,bh,f,{radius:0}))}}}
      return out}},
  wheel:{name:'Color wheel',group:'Rings & wheels',
    icon:'<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M12 12V3A9 9 0 0 1 19.8 7.5Z"/><path d="M12 12 19.8 16.5A9 9 0 0 1 12 21Z" opacity=".55"/><path d="M12 12 4.2 16.5A9 9 0 0 1 4.2 7.5Z" opacity=".3"/><circle cx="12" cy="12" r="3" fill="#fff"/>',
    params:[
      {k:'segments',label:'Segments',min:3,max:36,step:1,def:12,r:()=>pick([6,8,12,12,12,18,24])},
      {k:'tiers',label:'Rings',min:1,max:8,step:1,def:3,rmin:1,rmax:6},
      {k:'hole',label:'Center hole',min:0,max:.8,step:.01,def:.2,r:()=>pick([0,0,rf(.1,.5)])},
      {k:'gap',label:'Segment gap (°)',min:0,max:10,step:.5,def:1,r:()=>pick([0,0,1,2,4])},
      {k:'ringgap',label:'Ring gap',min:0,max:30,step:1,def:4,r:()=>pick([0,0,3,8])},
      {k:'center',label:'Tone',type:'select',options:[['light','Lighter toward center'],['dark','Darker toward center'],['flat','Flat']],def:'light'},
      {k:'range',label:'Tone range',min:0,max:1,step:.05,def:.6,rmin:.3,rmax:.85},
      {k:'hues',label:'Hue steps',type:'select',options:[['blend','Blend between colors'],['cycle','Repeat palette']],def:'blend'},
      {k:'twist',label:'Twist per ring (°)',min:0,max:45,step:1,def:0,r:()=>pick([0,0,0,ri(5,30)])},
    ],
    build(p){const out=[];const a=area();const R=Math.min(a.w,a.h)/2;const Sg=p.segments,T=p.tiers,Pn=P();
      for(let t=0;t<T;t++){
        let ro=R*(p.hole+(1-p.hole)*(T-t)/T)-(t>0?p.ringgap/2:0);
        let rin=R*(p.hole+(1-p.hole)*(T-t-1)/T)+((t<T-1||p.hole>0)?p.ringgap/2:0);
        if(t===T-1&&p.hole===0)rin=0;rin=Math.max(0,rin);if(ro<=rin+1)continue;
        const tt=T>1?t/(T-1):0;const k=p.center==='light'?p.range*tt:p.center==='dark'?-p.range*tt:0;
        const sw=360/Sg;
        for(let s=0;s<Sg;s++){let f;
          if(p.hues==='blend'){const pos=s/Sg*Pn;const i=Math.floor(pos),fr=pos-i;f={mix:[[i%Pn,n2(1-fr)],[(i+1)%Pn,n2(fr)]],k:n2(k)}}else f=F(s%Pn,k);
          out.push(base('wedge',a.cx,a.cy,ro*2,ro*2,f,{inner:n2(rin/ro),start:n2(s*sw+t*p.twist+p.gap/2),sweep:n2(Math.max(.5,sw-p.gap))}))}}
      return out}},
  rings:{name:'Concentric rings',group:'Rings & wheels',
    icon:'<circle cx="12" cy="12" r="9" opacity=".3"/><circle cx="12" cy="12" r="6.3" opacity=".55"/><circle cx="12" cy="12" r="3.6" opacity=".85"/>',
    params:[
      {k:'count',label:'Rings',min:2,max:30,step:1,def:8,rmin:3,rmax:16},
      {k:'arrangement',label:'Arrangement',type:'select',options:[['single','One target'],['pair','Pair'],['grid2','Grid of 4'],['grid3','Grid of 9']],def:'single',r:()=>pick(['single','single','pair','grid2','grid3'])},
      {k:'drift',label:'Drift',min:0,max:1,step:.05,def:0,r:()=>pick([0,0,rf(.2,.9)])},
      {k:'colors',label:'Colors',type:'select',options:[['gradient','Gradient between two'],['cycle','Cycle palette'],['alternate','Alternate two']],def:'gradient'},
      {k:'sweep',label:'Lighten inward',min:-1,max:1,step:.05,def:.3,rmin:-.4,rmax:.7},
    ],
    build(p){const out=[];const a=area();let centers=[];
      if(p.arrangement==='single')centers=[[a.cx,a.cy,Math.min(a.w,a.h)/2]];
      else if(p.arrangement==='pair'){const hz=a.w>=a.h;const r=(hz?Math.min(a.w/4,a.h/2):Math.min(a.h/4,a.w/2))*.94;
        centers=hz?[[a.cx-a.w/4,a.cy,r],[a.cx+a.w/4,a.cy,r]]:[[a.cx,a.cy-a.h/4,r],[a.cx,a.cy+a.h/4,r]]}
      else{const g=p.arrangement==='grid2'?2:3;const cw=a.w/g,ch=a.h/g,r=Math.min(cw,ch)/2*.9;
        for(let i=0;i<g;i++)for(let j=0;j<g;j++)centers.push([a.x+cw*(j+.5),a.y+ch*(i+.5),r])}
      const ang=rf(0,Math.PI*2);
      centers.forEach(([cx,cy,R])=>{const[ca,cb]=distinct(2);const set=distinct(Math.min(P(),5));const N=p.count;
        for(let i=0;i<N;i++){const r=R*(1-i/N);const t=N>1?i/(N-1):0;const d=p.drift*(R-r)*.9;
          let f;if(p.colors==='gradient')f=F2(ca,cb,t,p.sweep*t*.8);else if(p.colors==='alternate')f=F(i%2?cb:ca,p.sweep*t*.8);else f=F(set[i%set.length],p.sweep*t*.6);
          out.push(base('ellipse',cx+Math.cos(ang)*d,cy+Math.sin(ang)*d,r*2,r*2,f))}});
      return out}},
  sphere:{name:'Color sphere',group:'Rings & wheels',
    icon:'<circle cx="12" cy="12" r="9" opacity=".35"/><ellipse cx="12" cy="9.5" rx="6.5" ry="5" opacity=".5"/><ellipse cx="12" cy="7.5" rx="3.4" ry="2.6"/>',
    params:[
      {k:'segments',label:'Segments',min:6,max:24,step:1,def:12,r:()=>pick([8,10,12,12,16])},
      {k:'tiers',label:'Latitudes',min:2,max:8,step:1,def:4,rmin:3,rmax:6},
      {k:'views',label:'Views',type:'select',options:[['both','White and black pole'],['white','White pole'],['black','Black pole']],def:'both'},
      {k:'strength',label:'Pole strength',min:.3,max:1,step:.05,def:.85,rmin:.6,rmax:.95},
      {k:'tilt',label:'Tilt',min:0,max:1,step:.05,def:.45,rmin:0,rmax:.8},
      {k:'spin',label:'Spin (°)',min:0,max:360,step:1,def:0},
    ],
    build(p){const out=[];const a=area();const views=p.views==='both'?[1,-1]:p.views==='white'?[1]:[-1];const nv=views.length;
      const gapX=nv>1?a.w*.06:0;const R=Math.min((a.w-gapX*(nv-1))/nv/2,a.h/2);const total=2*R*nv+gapX*(nv-1);
      const Sg=p.segments,T=p.tiers,Pn=P();const squash=1-p.tilt*.35;
      views.forEach((sign,vi)=>{const cx=a.cx-total/2+R+vi*(2*R+gapX),cy=a.cy;
        const b=j=>R*Math.sin(Math.PI/2*j/(T+1));
        const ctr=r=>[cx,cy-(R-r)*p.tilt*.6];
        for(let t=T;t>=1;t--){const r=b(t+1);const[x,y]=ctr(r);const k=sign*p.strength*(1-t/T)*.9;const sw=360/Sg;
          for(let s=0;s<Sg;s++){const pos=s/Sg*Pn;const i=Math.floor(pos),fr=pos-i;
            out.push(base('wedge',x,y,r*2,r*2*squash,{mix:[[i%Pn,n2(1-fr)],[(i+1)%Pn,n2(fr)]],k:n2(k)},{inner:0,start:n2(s*sw+p.spin),sweep:n2(sw)}))}}
        const rc=b(1);const[x,y]=ctr(rc);
        out.push(base('ellipse',x,y,rc*2,rc*2*squash,{mix:[[0,1],[Math.floor(Pn/2),1]],k:n2(sign*.94)}))});
      return out}},
};
function defaults(g){const o={};for(const d of GENS[g].params)o[d.k]=d.def;return o}
function randomParams(g){const o={};for(const d of GENS[g].params){
  if(d.r){o[d.k]=d.r();if(typeof o[d.k]==='number')o[d.k]=+(Math.round(o[d.k]/d.step)*d.step).toFixed(4);continue}
  if(d.type==='select'){o[d.k]=pick(d.options)[0];continue}
  const lo=d.rmin??d.min,hi=d.rmax??d.max;o[d.k]=+(Math.round((lo+rnd()*(hi-lo))/d.step)*d.step).toFixed(4)}return o}
for(const g in GENS)S.params[g]=defaults(g);

/* ---------------- history ---------------- */
const hist={stack:[],i:-1};
const KEEP=['aspect','W','H','margin','bg','palette','paletteName','gen','params','seed','blend','opacity','outline','outlineColor','shapes'];
function snap(){const o={};for(const k of KEEP)o[k]=S[k];return JSON.stringify(o)}
function commit(){const s=snap();if(hist.stack[hist.i]===s)return;hist.stack=hist.stack.slice(0,hist.i+1);hist.stack.push(s);if(hist.stack.length>120)hist.stack.shift();hist.i=hist.stack.length-1;updUndo()}
function restore(str){Object.assign(S,JSON.parse(str));S.sel=new Set([...S.sel].filter(id=>S.shapes.some(s=>s.id===id)));updatePalLab();renderAll()}
function undo(){if(hist.i>0){hist.i--;restore(hist.stack[hist.i]);updUndo()}}
function redo(){if(hist.i<hist.stack.length-1){hist.i++;restore(hist.stack[hist.i]);updUndo()}}
function updUndo(){$('#undo').disabled=hist.i<=0;$('#redo').disabled=hist.i>=hist.stack.length-1}

/* ---------------- build + render ---------------- */
const svg=$('#svg'),art=$('#art'),overlay=$('#overlay');
function rebuild(){rnd=mulberry32(S.seed);S.shapes=GENS[S.gen].build(S.params[S.gen]);rnd=Math.random;S.sel.clear();render();renderShapePanel();renderLayers()}
function render(){svg.setAttribute('viewBox',`0 0 ${S.W} ${S.H}`);
  art.innerHTML=`<rect data-bg="1" x="0" y="0" width="${S.W}" height="${S.H}" fill="${S.bg}"/>`+S.shapes.map(s=>shapeEl(s)).join('');drawOverlay()}
function updateEl(s){const el=art.querySelector(`[data-id="${s.id}"]`);if(!el)return;el.setAttribute('d',shapePath(s));el.setAttribute('transform',tf(s))}
function sizeSvg(){const wrap=$('#canvasWrap');const r=wrap.getBoundingClientRect();const pad=Math.min(36,r.width*.05);const sc=Math.min((r.width-pad*2)/S.W,(r.height-pad*2)/S.H);
  svg.style.width=Math.max(60,S.W*sc)+'px';svg.style.height=Math.max(60,S.H*sc)+'px';drawOverlay()}
new ResizeObserver(sizeSvg).observe($('#canvasWrap'));
const selected=()=>S.shapes.filter(s=>S.sel.has(s.id));
let drag=null;
function drawOverlay(){
  const pw=svg.getBoundingClientRect().width||1;const k=S.W/pw;let h='';
  const sel=selected();
  for(const s of sel){const c=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([sx,sy])=>rotPt(s,sx*s.w/2,sy*s.h/2));
    h+=`<polygon points="${c.map(p=>p.map(n2).join(',')).join(' ')}" fill="none" stroke="#2340d0" stroke-width="1.5" vector-effect="non-scaling-stroke" pointer-events="none"/>`}
  if(sel.length===1&&!(drag&&drag.mode==='move')){const s=sel[0];const hs=10*k;
    const top=rotPt(s,0,-s.h/2),rp=rotPt(s,0,-s.h/2-26*k);
    h+=`<line x1="${n2(top[0])}" y1="${n2(top[1])}" x2="${n2(rp[0])}" y2="${n2(rp[1])}" stroke="#2340d0" stroke-width="1.5" vector-effect="non-scaling-stroke" pointer-events="none"/>`;
    h+=`<circle data-handle="rot" cx="${n2(rp[0])}" cy="${n2(rp[1])}" r="${n2(hs*.6)}" fill="#fff" stroke="#2340d0" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`;
    [[-1,-1],[1,-1],[1,1],[-1,1]].forEach(([sx,sy],i)=>{const[x,y]=rotPt(s,sx*s.w/2,sy*s.h/2);
      h+=`<rect data-handle="c${i}" x="${n2(x-hs/2)}" y="${n2(y-hs/2)}" width="${n2(hs)}" height="${n2(hs)}" fill="#fff" stroke="#2340d0" stroke-width="1.5" vector-effect="non-scaling-stroke" transform="rotate(${n2(s.rot||0)} ${n2(x)} ${n2(y)})"/>`})}
  if(drag&&drag.mode==='draw'){const r=drawRect(drag);
    h+=`<rect x="${n2(r.x-r.w/2)}" y="${n2(r.y-r.h/2)}" width="${n2(r.w)}" height="${n2(r.h)}" fill="rgba(35,64,208,.08)" stroke="#2340d0" stroke-width="1.5" stroke-dasharray="5 4" vector-effect="non-scaling-stroke" pointer-events="none"/>`}
  overlay.innerHTML=h}

/* ---------------- tools / interaction ---------------- */
const TOOLS=[
  {id:'select',label:'Select and move (V)',icon:'<path d="M5 3l12 7-5.2 1.3L9.5 17z" fill="currentColor"/>'},
  {sep:1},
  {id:'square',label:'Square (R)',make:{type:'rect',radius:0},icon:'<rect x="4" y="4" width="12" height="12" fill="currentColor"/>'},
  {id:'circle',label:'Circle (O)',make:{type:'ellipse'},icon:'<circle cx="10" cy="10" r="6.5" fill="currentColor"/>'},
  {id:'triangle',label:'Triangle (T)',make:{type:'polygon',sides:3},icon:'<path d="M10 3.5 17 16H3z" fill="currentColor"/>'},
  {id:'diamond',label:'Diamond',make:{type:'polygon',sides:4},icon:'<path d="M10 2.5 16.5 10 10 17.5 3.5 10z" fill="currentColor"/>'},
  {id:'hexagon',label:'Hexagon',make:{type:'polygon',sides:6},icon:'<path d="M10 3l6 3.5v7L10 17l-6-3.5v-7z" fill="currentColor"/>'},
  {id:'pill',label:'Pill',make:{type:'rect',radius:.5},icon:'<rect x="6" y="2.5" width="8" height="15" rx="4" fill="currentColor"/>'},
  {id:'ring',label:'Ring',make:{type:'ring',inner:.6},icon:'<path fill="currentColor" fill-rule="evenodd" d="M10 3.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zm0 3a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z"/>'},
  {id:'half',label:'Half circle',make:{type:'wedge',inner:0,start:270,sweep:180},icon:'<path d="M3.5 13a6.5 6.5 0 0 1 13 0z" fill="currentColor"/>'},
  {id:'wedge',label:'Quarter wedge',make:{type:'wedge',inner:0,start:0,sweep:90},icon:'<path d="M5 15V4a11 11 0 0 1 11 11z" fill="currentColor"/>'},
  {id:'arc',label:'Arch',make:{type:'wedge',inner:.55,start:270,sweep:180},icon:'<path d="M3 14a7 7 0 0 1 14 0h-3.5a3.5 3.5 0 0 0-7 0z" fill="currentColor"/>'},
];
function renderTools(){$('#tools').innerHTML='<div class="bar">'+TOOLS.map(t=>t.sep?'<span class="sep"></span>':`<button class="tool" data-tool="${t.id}" aria-pressed="${S.tool===t.id}" title="${t.label}" aria-label="${t.label}"><svg viewBox="0 0 20 20">${t.icon}</svg></button>`).join('')+'</div>';
  svg.classList.toggle('drawing',S.tool!=='select')}
function setTool(id){S.tool=id;renderTools()}
$('#tools').addEventListener('click',e=>{const b=e.target.closest('[data-tool]');if(b)setTool(b.dataset.tool)});

function toSvg(e){const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const m=svg.getScreenCTM();return m?pt.matrixTransform(m.inverse()):{x:0,y:0}}
function drawRect(d){let w=Math.abs(d.cur.x-d.start.x),h=Math.abs(d.cur.y-d.start.y);if(d.shift){w=h=Math.max(w,h)}
  const sx=Math.sign(d.cur.x-d.start.x)||1,sy=Math.sign(d.cur.y-d.start.y)||1;return{x:d.start.x+sx*w/2,y:d.start.y+sy*h/2,w,h}}
let colorCursor=0;
svg.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;const p=toSvg(e);
  if(S.tool!=='select'){drag={mode:'draw',start:p,cur:p,shift:e.shiftKey};svg.setPointerCapture(e.pointerId);drawOverlay();return}
  const h=e.target.closest('[data-handle]');
  if(h){const s=selected()[0];if(!s)return;const hd=h.dataset.handle;
    if(hd==='rot')drag={mode:'rot',s,orig:{...s}};
    else{const i=+hd.slice(1);const[sx,sy]=[[-1,-1],[1,-1],[1,1],[-1,1]][i];const opp=rotPt(s,-sx*s.w/2,-sy*s.h/2);drag={mode:'resize',s,sx,sy,opp,ratio:s.w/s.h}}
    svg.setPointerCapture(e.pointerId);return}
  const sh=e.target.closest('[data-id]');
  if(sh){const id=sh.dataset.id;
    if(e.shiftKey){if(S.sel.has(id)){S.sel.delete(id);refreshSel();return}S.sel.add(id)}
    else if(!S.sel.has(id))S.sel=new Set([id]);
    drag={mode:'move',start:p,items:selected().map(s=>({s,x:s.x,y:s.y})),moved:false};
    svg.setPointerCapture(e.pointerId);refreshSel();return}
  if(S.sel.size){S.sel.clear();refreshSel()}
});
svg.addEventListener('pointermove',e=>{if(!drag)return;const p=toSvg(e);
  if(drag.mode==='draw'){drag.cur=p;drag.shift=e.shiftKey;drawOverlay();return}
  if(drag.mode==='move'){const dx=p.x-drag.start.x,dy=p.y-drag.start.y;if(!drag.moved&&Math.hypot(dx,dy)<1)return;drag.moved=true;
    for(const it of drag.items){it.s.x=n2(it.x+dx);it.s.y=n2(it.y+dy);updateEl(it.s)}drawOverlay();return}
  if(drag.mode==='rot'){const s=drag.s;let a=Math.atan2(p.y-s.y,p.x-s.x)*180/Math.PI+90;if(e.shiftKey)a=Math.round(a/15)*15;s.rot=n2(((a%360)+360)%360);drag.moved=true;updateEl(s);drawOverlay();return}
  if(drag.mode==='resize'){const s=drag.s;const a=-(s.rot||0)*Math.PI/180;const dx=p.x-drag.opp[0],dy=p.y-drag.opp[1];
    const lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);
    let w=Math.max(4,lx*drag.sx),h=Math.max(4,ly*drag.sy);if(e.shiftKey){const m=Math.max(w/drag.ratio,h);h=m;w=m*drag.ratio}
    s.w=n2(w);s.h=n2(h);const c=[drag.opp[0],drag.opp[1]];const r=(s.rot||0)*Math.PI/180;const ox=drag.sx*w/2,oy=drag.sy*h/2;
    s.x=n2(c[0]+ox*Math.cos(r)-oy*Math.sin(r));s.y=n2(c[1]+ox*Math.sin(r)+oy*Math.cos(r));drag.moved=true;updateEl(s);drawOverlay()}
});
function endDrag(){if(!drag)return;const d=drag;drag=null;
  if(d.mode==='draw'){let r=drawRect(d);if(r.w<6&&r.h<6)r={x:d.start.x,y:d.start.y,w:220,h:220};
    const t=TOOLS.find(t=>t.id===S.tool);const s=base(t.make.type,r.x,r.y,Math.max(8,r.w),Math.max(8,r.h),F(colorCursor++%P()),Object.assign({},t.make,{opacity:1,blend:'normal',sw:0}));
    delete s.make;S.shapes.push(s);S.sel=new Set([s.id]);setTool('select');render();commit();refreshSel();return}
  if(d.moved){commit();renderShapePanel()}drawOverlay()}
svg.addEventListener('pointerup',endDrag);svg.addEventListener('pointercancel',endDrag);
function refreshSel(){drawOverlay();renderShapePanel();renderLayers()}

/* ---------------- shape ops ---------------- */
function delSel(){if(!S.sel.size)return;S.shapes=S.shapes.filter(s=>!S.sel.has(s.id));S.sel.clear();render();commit();refreshSel()}
function dupSel(){const sel=selected();if(!sel.length)return;const c=sel.map(s=>Object.assign(JSON.parse(JSON.stringify(s)),{id:uid(),x:s.x+24,y:s.y+24}));S.shapes.push(...c);S.sel=new Set(c.map(s=>s.id));render();commit();refreshSel()}
function moveZ(dir){if(!S.sel.size)return;const a=S.shapes;const isS=s=>S.sel.has(s.id);
  if(dir==='front')S.shapes=[...a.filter(s=>!isS(s)),...a.filter(isS)];
  else if(dir==='back')S.shapes=[...a.filter(isS),...a.filter(s=>!isS(s))];
  else if(dir==='up'){for(let i=a.length-2;i>=0;i--)if(isS(a[i])&&!isS(a[i+1]))[a[i],a[i+1]]=[a[i+1],a[i]]}
  else{for(let i=1;i<a.length;i++)if(isS(a[i])&&!isS(a[i-1]))[a[i],a[i-1]]=[a[i-1],a[i]]}
  render();commit();refreshSel()}
function nudge(dx,dy){const sel=selected();if(!sel.length)return;for(const s of sel){s.x=n2(s.x+dx);s.y=n2(s.y+dy);updateEl(s)}drawOverlay();clearTimeout(nudge.t);nudge.t=setTimeout(()=>{commit();renderShapePanel()},350)}

document.addEventListener('keydown',e=>{
  const tag=(e.target.tagName||'').toLowerCase();if(['input','select','textarea'].includes(tag))return;
  const mod=e.metaKey||e.ctrlKey;const k=e.key;
  if(mod&&k.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo();return}
  if(mod&&k.toLowerCase()==='y'){e.preventDefault();redo();return}
  if(mod&&k.toLowerCase()==='d'){e.preventDefault();dupSel();return}
  if(mod&&k.toLowerCase()==='a'){e.preventDefault();S.sel=new Set(S.shapes.map(s=>s.id));refreshSel();return}
  if(mod)return;
  if(k==='Backspace'||k==='Delete'){e.preventDefault();delSel();return}
  if(k==='Escape'){S.sel.clear();setTool('select');refreshSel();return}
  if(k==='['){moveZ(e.shiftKey?'back':'down');return}
  if(k===']'){moveZ(e.shiftKey?'front':'up');return}
  const st=e.shiftKey?10:1;
  if(k==='ArrowLeft'){e.preventDefault();nudge(-st,0);return}
  if(k==='ArrowRight'){e.preventDefault();nudge(st,0);return}
  if(k==='ArrowUp'){e.preventDefault();nudge(0,-st);return}
  if(k==='ArrowDown'){e.preventDefault();nudge(0,st);return}
  const map={v:'select',r:'square',o:'circle',t:'triangle'};
  if(map[k.toLowerCase()]){setTool(map[k.toLowerCase()]);return}
  if(k.toLowerCase()==='g'){generate();return}
});

/* ---------------- panels: composition ---------------- */
function fmt(v,d){if(typeof v!=='number')return v;return d.step<1?(+v).toFixed(d.step<.1?2:2).replace(/\.?0+$/,'')||'0':String(v)}
function ctrl(d,v,pre){const id=pre+d.k;
  if(d.type==='select')return`<div class="field"><label for="${id}">${d.label}</label><select id="${id}" data-k="${d.k}">${d.options.map(([val,l])=>`<option value="${val}"${val===v?' selected':''}>${l}</option>`).join('')}</select></div>`;
  return`<div class="field"><label for="${id}">${d.label}<output id="${id}-o">${fmt(v,d)}</output></label><input type="range" id="${id}" data-k="${d.k}" min="${d.min}" max="${d.max}" step="${d.step}" value="${v}"></div>`}
function renderGenGrid(){let h='',grp='';
  for(const[k,g]of Object.entries(GENS)){if(g.group!==grp){grp=g.group;h+=`<div class="grp">${grp}</div>`}
    h+=`<button class="gen-btn" data-gen="${k}" aria-pressed="${S.gen===k}"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${g.icon}</svg>${g.name}</button>`}
  $('#genGrid').innerHTML=h}
function renderGenParams(){const g=GENS[S.gen],p=S.params[S.gen];$('#genParams').innerHTML=g.params.map(d=>ctrl(d,p[d.k],'gp-')).join('')}
$('#genGrid').addEventListener('click',e=>{const b=e.target.closest('[data-gen]');if(!b||b.dataset.gen===S.gen)return;S.gen=b.dataset.gen;renderGenGrid();renderGenParams();rebuild();commit()});
$('#genParams').addEventListener('input',e=>{const el=e.target;const k=el.dataset.k;if(!k)return;const d=GENS[S.gen].params.find(x=>x.k===k);
  S.params[S.gen][k]=d.type==='select'?el.value:+el.value;const o=$('#'+el.id+'-o');if(o)o.textContent=fmt(+el.value,d);rebuild()});
$('#genParams').addEventListener('change',commit);

const BLENDS=['normal','multiply','screen','overlay','darken','lighten','color-burn','color-dodge','hard-light','soft-light','difference','exclusion','hue','color','luminosity'];
const blendOpts=v=>BLENDS.map(b=>`<option value="${b}"${b===v?' selected':''}>${b[0].toUpperCase()+b.slice(1).replace('-',' ')}</option>`).join('');
function renderGlobals(){$('#aspect').value=S.aspect;$('#margin').value=S.margin;$('#marginOut').textContent=S.margin;
  $('#gBlend').innerHTML=blendOpts(S.blend);$('#gOpacity').value=S.opacity;$('#gOpacityOut').textContent=Math.round(S.opacity*100)+'%';
  $('#gOutline').value=S.outline;$('#gOutlineOut').textContent=S.outline;$('#gOutlineColor').value=S.outlineColor;$('#gOutlineHex').textContent=S.outlineColor}
$('#aspect').addEventListener('change',e=>{setAspect(e.target.value);sizeSvg();rebuild();commit()});
$('#margin').addEventListener('input',e=>{S.margin=+e.target.value;$('#marginOut').textContent=S.margin;rebuild()});
$('#margin').addEventListener('change',commit);
function applyAll(key,val){for(const s of S.shapes)s[key]=val;render()}
$('#gBlend').addEventListener('change',e=>{S.blend=e.target.value;applyAll('blend',S.blend);commit();renderShapePanel()});
$('#gOpacity').addEventListener('input',e=>{S.opacity=+e.target.value;$('#gOpacityOut').textContent=Math.round(S.opacity*100)+'%';applyAll('opacity',S.opacity)});
$('#gOpacity').addEventListener('change',()=>{commit();renderShapePanel()});
$('#gOutline').addEventListener('input',e=>{S.outline=+e.target.value;$('#gOutlineOut').textContent=S.outline;applyAll('sw',S.outline)});
$('#gOutline').addEventListener('change',()=>{commit();renderShapePanel()});
$('#gOutlineColor').addEventListener('input',e=>{S.outlineColor=e.target.value;$('#gOutlineHex').textContent=S.outlineColor;applyAll('sc',S.outlineColor)});
$('#gOutlineColor').addEventListener('change',()=>{commit();renderShapePanel()});

/* ---------------- panels: palette ---------------- */
function renderPalette(){
  $('#presets').innerHTML=PRESETS.map((p,i)=>`<button class="preset" data-preset="${i}" aria-pressed="${S.paletteName===p.name}"><span class="strip">${p.c.map(c=>`<i style="background:${c}"></i>`).join('')}</span>${p.name}</button>`).join('');
  $('#swatches').innerHTML=S.palette.map((c,i)=>`<label class="sw" style="--c:${c}" title="Color ${i+1}: ${c}"><input type="color" value="${c}" data-sw="${i}" aria-label="Edit color ${i+1}">${S.palette.length>1?`<button class="x" data-rm="${i}" aria-label="Remove color ${i+1}">×</button>`:''}</label>`).join('')+(S.palette.length<12?`<button class="sw-add" id="swAdd" title="Add a color" aria-label="Add a color">+</button>`:'');
  $('#palName').textContent=S.paletteName;$('#bg').value=S.bg;$('#bgHex').textContent=S.bg}
function setPalette(pal,bg,name){S.palette=pal.slice();if(bg)S.bg=bg;S.paletteName=name;updatePalLab();renderPalette();render();renderShapePanel();renderLayers()}
$('#presets').addEventListener('click',e=>{const b=e.target.closest('[data-preset]');if(!b)return;const p=PRESETS[+b.dataset.preset];setPalette(p.c,p.bg,p.name);commit()});
$('#swatches').addEventListener('input',e=>{const i=e.target.dataset.sw;if(i==null)return;S.palette[+i]=e.target.value;e.target.parentElement.style.setProperty('--c',e.target.value);updatePalLab();render()});
$('#swatches').addEventListener('change',e=>{if(e.target.dataset.sw==null)return;S.paletteName='Custom';renderPalette();renderShapePanel();renderLayers();commit()});
$('#swatches').addEventListener('click',e=>{
  const rm=e.target.closest('[data-rm]');if(rm){e.preventDefault();S.palette.splice(+rm.dataset.rm,1);S.paletteName='Custom';updatePalLab();renderPalette();render();renderShapePanel();renderLayers();commit();return}
  if(e.target.closest('#swAdd')){rnd=Math.random;const l=palLab[ri(0,palLab.length-1)];const H=Math.atan2(l[2],l[1])*180/Math.PI+rf(60,180);S.palette.push(oklch(rf(.5,.85),rf(.1,.18),H));S.paletteName='Custom';updatePalLab();renderPalette();render();commit()}});
$('#harmony').innerHTML=Object.entries(HARMONIES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
$('#randPal').addEventListener('click',()=>{rnd=Math.random;const r=harmonyPalette($('#harmony').value);setPalette(r.palette,r.bg,r.name);commit()});
$('#bg').addEventListener('input',e=>{S.bg=e.target.value;$('#bgHex').textContent=S.bg;render()});
$('#bg').addEventListener('change',commit);
$('#bgMatch').addEventListener('click',()=>{S.bg=matchBg();renderPalette();render();commit()});

/* ---------------- panels: shape ---------------- */
function typeName(s){if(s.type==='polygon')return({3:'Triangle',4:'Diamond',6:'Hexagon'})[s.sides]||`${s.sides}-sided polygon`;
  if(s.type==='rect')return s.radius>=.5?'Pill':s.radius>0?'Rounded rectangle':'Rectangle';
  if(s.type==='wedge')return s.inner>0?'Arc segment':s.sweep===180?'Half circle':'Wedge';
  return{ellipse:'Ellipse',ring:'Ring'}[s.type]||s.type}
const fillInfo=f=>{if(f.hex)return{kind:'hex'};if(f.mix.length===1)return{kind:'one',a:f.mix[0][0]};
  if(f.mix.length===2){const t=f.mix[0][1]+f.mix[1][1]||1;return{kind:'two',a:f.mix[0][0],b:f.mix[1][0],amt:f.mix[1][1]/t}}return{kind:'many'}};
const wrapIdx=i=>((i%P())+P())%P();
function numField(id,label,v,step=1){return`<div class="field"><label for="${id}">${label}</label><input type="number" id="${id}" value="${n2(v)}" step="${step}"></div>`}
function rangeField(id,label,v,min,max,step,show){return`<div class="field"><label for="${id}">${label}<output id="${id}-o">${show(v)}</output></label><input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${v}"></div>`}
const pct=v=>Math.round(v*100)+'%';
function renderShapePanel(){
  const el=$('#shapePanel');const sel=selected();
  if(!sel.length){el.innerHTML=`<p class="empty">Click a shape on the canvas to edit it, or pick a shape tool above the canvas and drag to draw one.</p>`;return}
  const s=sel[sel.length-1],multi=sel.length>1,fi=fillInfo(s.fill);
  const prim=fi.kind==='one'||fi.kind==='two'?wrapIdx(fi.a):-1,sec=fi.kind==='two'?wrapIdx(fi.b):-1;
  const sw=(role,cur)=>S.palette.map((c,i)=>`<button data-${role}="${i}" style="--c:${c}" aria-pressed="${cur===i}" aria-label="Palette color ${i+1}" title="${c}"></button>`).join('');
  let h=`<div class="shape-head"><span class="shape-name">${multi?sel.length+' shapes':typeName(s)}</span></div>
  <div class="actions">
    <button class="btn" data-act="front" title="Bring to front (⇧])">To front</button>
    <button class="btn" data-act="up" title="Bring forward (])">Forward</button>
    <button class="btn" data-act="down" title="Send backward ([)">Back</button>
    <button class="btn" data-act="back" title="Send to back (⇧[)">To back</button>
    <button class="btn" data-act="dup" title="Duplicate (⌘D)">Duplicate</button>
    <button class="btn" data-act="del" title="Delete (⌫)">Delete</button>
  </div>
  <div class="field"><span class="lbl">Color${fi.kind==='many'?'<output>blended from several</output>':fi.kind==='hex'?'<output>custom</output>':''}</span><div class="pick">${sw('prim',prim)}</div></div>
  <div class="field"><span class="lbl">Mix with</span><div class="pick"><button class="none" data-mixb="none" aria-pressed="${sec<0}">None</button>${sw('mixb',sec)}</div></div>
  ${fi.kind==='two'?rangeField('f-amt','Mix amount',n2(fi.amt),0,1,.01,pct):''}
  ${rangeField('f-tone','Tone (dark to light)',s.fill.k||0,-1,1,.01,v=>(v>0?'+':'')+Math.round(v*100))}
  <div class="field"><span class="lbl">Custom color</span><label class="colorbox"><input type="color" id="f-hex" value="${fillColor({...s.fill,k:0})}"><span>${fi.kind==='hex'?s.fill.hex:'Pick any color'}</span></label></div>
  <div class="grid2">
    ${rangeField('f-op','Opacity',s.opacity??1,0,1,.01,pct)}
    <div class="field"><label for="f-blend">Blend</label><select id="f-blend">${blendOpts(s.blend||'normal')}</select></div>
    ${rangeField('f-sw','Outline',s.sw||0,0,12,.25,v=>v)}
    <div class="field"><span class="lbl">Outline color</span><label class="colorbox"><input type="color" id="f-sc" value="${s.sc||'#000000'}"><span>${s.sc||'#000000'}</span></label></div>
  </div>`;
  if(!multi){
    h+=`<h3>Position and size</h3><div class="grid2">${numField('g-x','X',s.x)}${numField('g-y','Y',s.y)}${numField('g-w','Width',s.w)}${numField('g-h','Height',s.h)}${numField('g-rot','Rotation °',s.rot||0)}</div><div style="height:10px"></div>`;
    if(s.type==='rect')h+=rangeField('t-radius','Corner radius',s.radius||0,0,.5,.01,pct);
    if(s.type==='polygon')h+=rangeField('t-sides','Sides',s.sides,3,12,1,v=>v);
    if(s.type==='ring')h+=rangeField('t-inner','Inner size',s.inner,.05,.95,.01,pct);
    if(s.type==='wedge')h+=rangeField('t-start','Start angle',s.start||0,0,360,1,v=>v+'°')+rangeField('t-sweep','Sweep',s.sweep,1,360,1,v=>v+'°')+rangeField('t-inner','Inner size',s.inner||0,0,.95,.01,pct);
  }
  el.innerHTML=h}
function eachSel(fn){for(const s of selected())fn(s);render();renderLayers()}
const sp=$('#shapePanel');
sp.addEventListener('click',e=>{
  const act=e.target.closest('[data-act]');if(act){const a=act.dataset.act;if(a==='dup')dupSel();else if(a==='del')delSel();else moveZ(a);return}
  const pb=e.target.closest('[data-prim]');
  if(pb){const i=+pb.dataset.prim;eachSel(s=>{const fi=fillInfo(s.fill),k=s.fill.k||0;s.fill=fi.kind==='two'?{mix:[[i,n2(1-fi.amt)],[fi.b,n2(fi.amt)]],k}:{mix:[[i,1]],k}});commit();renderShapePanel();return}
  const mb=e.target.closest('[data-mixb]');
  if(mb){const v=mb.dataset.mixb;eachSel(s=>{const fi=fillInfo(s.fill),k=s.fill.k||0;const a=fi.kind==='one'||fi.kind==='two'?fi.a:0;
      if(v==='none')s.fill={mix:[[a,1]],k};else{const amt=fi.kind==='two'?fi.amt:.5;s.fill={mix:[[a,n2(1-amt)],[+v,n2(amt)]],k}}});commit();renderShapePanel()}
});
sp.addEventListener('input',e=>{const id=e.target.id,v=e.target.value,num=+v;const o=$('#'+id+'-o');
  const set=(fn,show)=>{eachSel(fn);if(o&&show)o.textContent=show};
  switch(id){
    case'f-amt':set(s=>{const fi=fillInfo(s.fill);if(fi.kind==='two')s.fill.mix=[[fi.a,n2(1-num)],[fi.b,n2(num)]]},pct(num));break;
    case'f-tone':set(s=>{s.fill.k=num},(num>0?'+':'')+Math.round(num*100));break;
    case'f-hex':set(s=>{s.fill={hex:v,k:s.fill.k||0}});break;
    case'f-op':set(s=>{s.opacity=num},pct(num));break;
    case'f-blend':set(s=>{s.blend=v});break;
    case'f-sw':set(s=>{s.sw=num},String(num));break;
    case'f-sc':set(s=>{s.sc=v});break;
    default:{const s=selected()[0];if(!s||v===''||isNaN(num))return;
      const map={'g-x':'x','g-y':'y','g-w':'w','g-h':'h','g-rot':'rot','t-radius':'radius','t-sides':'sides','t-inner':'inner','t-start':'start','t-sweep':'sweep'};
      const key=map[id];if(!key)return;s[key]=(key==='w'||key==='h')?Math.max(1,num):num;updateEl(s);drawOverlay();
      if(o)o.textContent=key==='sides'?num:(key==='start'||key==='sweep')?num+'°':pct(num)}}
});
sp.addEventListener('change',e=>{commit();if(['f-hex','f-blend','t-sides','t-radius','t-sweep','t-inner'].includes(e.target.id))renderShapePanel()});

/* ---------------- layers ---------------- */
function renderLayers(){const sel=S.sel;$('#layerCount').textContent=S.shapes.length+' shapes';
  const items=[];for(let i=S.shapes.length-1;i>=0;i--){const s=S.shapes[i];
    items.push(`<li role="option" data-lid="${s.id}" aria-selected="${sel.has(s.id)}"><span class="chip" style="--c:${fillColor(s.fill)}"></span>${typeName(s)}<span class="meta">${s.blend&&s.blend!=='normal'?s.blend+' · ':''}${S.shapes.length-i}</span></li>`)}
  $('#layers').innerHTML=items.join('')}
$('#layers').addEventListener('click',e=>{const li=e.target.closest('[data-lid]');if(!li)return;const id=li.dataset.lid;
  if(e.shiftKey||e.metaKey||e.ctrlKey){S.sel.has(id)?S.sel.delete(id):S.sel.add(id)}else S.sel=new Set([id]);refreshSel()});

/* ---------------- generate ---------------- */
function generate(){
  S.seed=newSeed();rnd=mulberry32(S.seed^0x5bd1e995);
  if($('#shGen').checked)S.gen=pick(Object.keys(GENS));
  if($('#shParams').checked){S.params[S.gen]=randomParams(S.gen);S.outline=rnd()<.25?1.25:0}
  if($('#shPal').checked){if(rnd()<.35){const p=pick(PRESETS);S.palette=p.c.slice();S.bg=p.bg;S.paletteName=p.name}else{const r=harmonyPalette('any');S.palette=r.palette;S.bg=r.bg;S.paletteName=r.name}updatePalLab()}
  rnd=Math.random;
  $('#seed').value=S.seed;renderGenGrid();renderGenParams();renderPalette();rebuild();commit()}
$('#generate').addEventListener('click',generate);
$('#seed').addEventListener('change',e=>{const v=Math.abs(Math.floor(+e.target.value||0));S.seed=v;e.target.value=v;rebuild();commit()});
$('#undo').addEventListener('click',undo);$('#redo').addEventListener('click',redo);

/* ---------------- export ---------------- */
let dlPromise=null;
try{if(typeof claude!=='undefined'&&claude&&typeof claude.use==='function')dlPromise=claude.use('downloads')}catch(_){}
function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),2600)}
async function saveFile(filename,data){
  // Inside a claude.ai artifact, files go through the downloads capability.
  let d=null;try{d=dlPromise?await dlPromise:null}catch(_){d=null}
  if(d){
    try{await d.save({filename,data});toast('Saved '+filename)}
    catch(err){const c=err&&err.code;toast(c==='declined'?'Download canceled':c==='rate_limited'?'A save prompt is already open. Try again in a moment.':"Couldn't save the file"+(err&&err.message?': '+err.message:''))}
    return}
  // Standalone (self-hosted): a normal browser download.
  const type=filename.endsWith('.svg')?'image/svg+xml':'image/png';
  const blob=data instanceof Blob?data:new Blob([data],{type});
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  a.href=url;a.download=filename;a.rel='noopener';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),4000);toast('Saved '+filename)}
function svgString(){return`<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${S.W}" height="${S.H}" viewBox="0 0 ${S.W} ${S.H}"><g style="isolation:isolate"><rect width="${S.W}" height="${S.H}" fill="${S.bg}"/>${S.shapes.map(s=>shapeEl(s,false)).join('')}</g></svg>`}
function renderCanvas(sc){const c=document.createElement('canvas');c.width=Math.round(S.W*sc);c.height=Math.round(S.H*sc);const x=c.getContext('2d');x.scale(sc,sc);x.fillStyle=S.bg;x.fillRect(0,0,S.W,S.H);
  for(const s of S.shapes){x.save();x.translate(s.x,s.y);x.rotate((s.rot||0)*Math.PI/180);x.globalAlpha=s.opacity??1;x.globalCompositeOperation=s.blend&&s.blend!=='normal'?s.blend:'source-over';
    const p=new Path2D(shapePath(s));x.fillStyle=fillColor(s.fill);x.fill(p,'evenodd');if(s.sw>0){x.lineWidth=s.sw;x.strokeStyle=s.sc||'#000';x.lineJoin='round';x.stroke(p)}x.restore()}return c}
$('#dlPng').addEventListener('click',async()=>{const c=renderCanvas(+$('#scale').value);const blob=await new Promise(r=>c.toBlob(r,'image/png'));if(blob)saveFile(`color-form-${S.seed}.png`,blob)});
$('#dlSvg').addEventListener('click',()=>saveFile(`color-form-${S.seed}.svg`,svgString()));

/* ---------------- boot ---------------- */
function renderAll(){renderTools();renderGenGrid();renderGenParams();renderGlobals();renderPalette();$('#seed').value=S.seed;sizeSvg();render();renderShapePanel();renderLayers();updUndo()}
setAspect(S.aspect);updatePalLab();
rnd=mulberry32(S.seed);S.shapes=GENS[S.gen].build(S.params[S.gen]);rnd=Math.random;
renderAll();commit();
