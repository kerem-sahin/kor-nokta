// Kör Nokta vaka üreticisi
// Kurallar:
//  1) Polis etrafındaki 8 kareyi aydınlatır. Kurban aydınlıkta olamaz, aydınlıktaki şüpheliler masumdur.
//  2) Oklu tanık: kurban okun gösterdiği düz çizgi üzerindedir (yatay, dikey ya da çapraz).
//     Sayılı tanık: kurban tanığa tam o kadar kare uzaktadır (çapraz adım da 1 sayılır).
//  3) Kurbanın yanında karanlıkta kalan tek bir şüpheli vardır: katil odur.
// Kullanım: node tools/generate.js  ->  cases.js dosyasını yazar
const fs = require('fs');
const path = require('path');

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const cheb=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]));
const dirOf=(w,v)=>{const dr=v[0]-w[0],dc=v[1]-w[1];if(!dr&&!dc)return null;if(dr&&dc&&Math.abs(dr)!==Math.abs(dc))return null;return[Math.sign(dr),Math.sign(dc)]};
const key=(p,N)=>p[0]*N+p[1];

function lit(b,p){return b.police.some(q=>cheb(p,q)<=1)}
function witnessOK(w,v){
  if(w.t==='ok'){const d=dirOf(w.p,v);return !!d&&d[0]===w.d[0]&&d[1]===w.d[1]}
  return cheb(w.p,v)===w.n;
}
function candidates(b,wits){
  const occ=new Set([...b.police,...b.sus,...b.wit.map(w=>w.p)].map(p=>key(p,b.N)));
  const out=[];
  for(let r=0;r<b.N;r++)for(let c=0;c<b.N;c++){
    const v=[r,c];
    if(occ.has(key(v,b.N))||lit(b,v))continue;
    if(b.sus.filter(s=>!lit(b,s)&&cheb(s,v)===1).length!==1)continue;
    if(!wits.every(w=>witnessOK(w,v)))continue;
    out.push(v);
  }
  return out;
}

function tryCase(rng,spec){
  const {N,P,S,W}=spec;
  const cells=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)cells.push([r,c]);
  for(let i=cells.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[cells[i],cells[j]]=[cells[j],cells[i]]}
  const police=cells.slice(0,P),sus=cells.slice(P,P+S);
  const b={N,police,sus,wit:[]};
  const dark=sus.filter(s=>!lit(b,s)).length;
  if(dark<spec.darkMin||dark>spec.darkMax)return null;
  const c0=candidates(b,[]);
  if(c0.length<spec.candMin)return null;
  const v=c0[Math.floor(rng()*c0.length)];
  const occ=new Set([...police,...sus,v].map(p=>key(p,N)));
  const free=cells.filter(p=>!occ.has(key(p,N)));
  const wit=[];
  // tanıkları sırayla seç: son tanığa kadar hiçbiri vakayı tek başına bitirmesin
  for(let i=0;i<W.length;i++){
    const t=W[i],last=i===W.length-1;
    let opts=free.filter(p=>!wit.some(w=>w.p[0]===p[0]&&w.p[1]===p[1]));
    if(t==='ok')opts=opts.filter(p=>dirOf(p,v)&&cheb(p,v)>=2);
    else opts=opts.filter(p=>{const d=cheb(p,v);return d>=1&&d<=spec.maxNum});
    for(let k=opts.length-1;k>0;k--){const j=Math.floor(rng()*(k+1));[opts[k],opts[j]]=[opts[j],opts[k]]}
    let chosen=null;
    for(const p of opts){
      const w=t==='ok'?{t,p,d:dirOf(p,v)}:{t,p,n:cheb(p,v)};
      b.wit=wit.concat([w]);
      const n=candidates(b,b.wit).length;
      if(last?n===1:n>1){chosen=w;break}
    }
    if(!chosen)return null;
    wit.push(chosen);
  }
  b.wit=wit;
  const fin=candidates(b,wit);
  if(fin.length!==1)return null;
  // tanıkların çoğu gerçekten gerekli olsun (3 tanıklı vakalarda biri destek olabilir)
  const needed=wit.filter(w=>candidates(b,wit.filter(x=>x!==w)).length!==1).length;
  if(needed<(spec.needMin||W.length))return null;
  const killer=sus.findIndex(s=>!lit(b,s)&&cheb(s,v)===1);
  return{N,police,sus,wit,victim:v,killer,cand0:c0.length};
}

const SPECS=[
  {title:'ilk gece',   N:5,P:1,S:2,W:['ok'],            darkMin:1,darkMax:1,candMin:3},
  {title:'iki gölge',  N:5,P:1,S:3,W:['ok'],            darkMin:2,darkMax:2,candMin:5},
  {title:'kesişme',    N:6,P:2,S:3,W:['ok','ok'],       darkMin:2,darkMax:2,candMin:6},
  {title:'ara sokak',  N:6,P:2,S:4,W:['ok','ok'],       darkMin:2,darkMax:3,candMin:7},
  {title:'meydan',     N:6,P:2,S:5,W:['ok','ok'],       darkMin:3,darkMax:4,candMin:8},
  {title:'liman',      N:7,P:3,S:5,W:['ok','ok'],  darkMin:3,darkMax:4,candMin:9},
  {title:'sayan tanık',N:6,P:2,S:4,W:['sayi','ok'],     darkMin:2,darkMax:3,candMin:7,maxNum:3},
  {title:'iki tanık',  N:6,P:2,S:4,W:['sayi','sayi'],   darkMin:3,darkMax:4,candMin:7,maxNum:3},
  {title:'çarşı',      N:7,P:3,S:6,W:['ok','sayi'],darkMin:3,darkMax:5,candMin:9,maxNum:3},
  {title:'son sefer',  N:7,P:2,S:6,W:['sayi','sayi','ok'],darkMin:4,darkMax:5,candMin:10,maxNum:3,needMin:2},
];

const rng=mulberry32(20261124);
const cases=SPECS.map((spec,i)=>{
  for(let t=0;t<200000;t++){
    const c=tryCase(rng,spec);
    if(c)return{no:i+1,title:spec.title,...c};
  }
  throw new Error('üretilemedi: '+spec.title);
});

const out='// Otomatik üretildi: node tools/generate.js\nwindow.KN_CASES = '+JSON.stringify(cases)+';\n';
fs.writeFileSync(path.join(__dirname,'..','cases.js'),out);
cases.forEach(c=>console.log(`#${c.no} ${c.title}: ${c.N}x${c.N}, aday(tanıksız)=${c.cand0}, tanık=${c.wit.map(w=>w.t==='ok'?'ok':'sayı '+w.n).join('+')}`));
