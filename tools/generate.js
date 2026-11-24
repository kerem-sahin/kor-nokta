// Kör Nokta vaka üreticisi
// Kurallar:
//  1) Polis etrafındaki 8 kareyi görür. Kurban orada olamaz, oradaki şüpheliler masumdur.
//  2) Gören tanık (ok): katili gördü. Katil okun gösterdiği çizgi üzerindeki şüphelilerden biridir.
//     Duyan tanık (sayı): çığlığı duydu. Kurban bu tanığa tam o kadar kare uzaktadır (çapraz adım da 1).
//  3) Katil kurbanın hemen yanındadır. Kurbanın yanında polisin görmediği başka şüpheli yoktur.
// Çözüm = (kurban karesi, katil). Tek çözüm olmalı ve iki ipucu türü birleştirilmeden bulunamamalı.
// Kullanım: node tools/generate.js  ->  cases2.js dosyasını yazar
const fs = require('fs');
const path = require('path');

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const cheb=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]));
const dirOf=(w,v)=>{const dr=v[0]-w[0],dc=v[1]-w[1];if(!dr&&!dc)return null;if(dr&&dc&&Math.abs(dr)!==Math.abs(dc))return null;return[Math.sign(dr),Math.sign(dc)]};
const key=(p,N)=>p[0]*N+p[1];
const same=(a,b)=>a[0]===b[0]&&a[1]===b[1];

function lit(b,p){return b.police.some(q=>cheb(p,q)<=1)}
function onRay(w,p){const d=dirOf(w.p,p);return !!d&&d[0]===w.d[0]&&d[1]===w.d[1]}
// strict=false: "kurbanın yanında başka karanlık şüpheli yok" kısmını yok say (ne kadar gerekli, ölçmek için)
function solutions(b,wits,strict=true){
  const occ=new Set([...b.police,...b.sus,...b.wit.map(w=>w.p)].map(p=>key(p,b.N)));
  const dark=b.sus.map((s,i)=>i).filter(i=>!lit(b,b.sus[i]));
  const out=[];
  for(let r=0;r<b.N;r++)for(let c=0;c<b.N;c++){
    const v=[r,c];
    if(occ.has(key(v,b.N))||lit(b,v))continue;
    if(!wits.every(w=>w.t!=='sayi'||cheb(w.p,v)===w.n))continue;
    const nb=dark.filter(i=>cheb(b.sus[i],v)===1);
    if(strict&&nb.length!==1)continue;
    for(const k of nb){
      if(wits.every(w=>w.t!=='ok'||onRay(w,b.sus[k])))out.push({v,k});
    }
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
  const c0=solutions(b,[]);
  if(c0.length<spec.candMin)return null;
  const sol=c0[Math.floor(rng()*c0.length)];
  const v=sol.v,k=sus[sol.k];
  const occ=new Set([...police,...sus,v].map(p=>key(p,N)));
  const free=cells.filter(p=>!occ.has(key(p,N)));
  const wit=[];
  for(let i=0;i<W.length;i++){
    const t=W[i],last=i===W.length-1;
    let opts=free.filter(p=>!wit.some(w=>same(w.p,p)));
    if(t==='ok')opts=opts.filter(p=>dirOf(p,k)&&cheb(p,k)>=2);
    else opts=opts.filter(p=>{const d=cheb(p,v);return d>=2&&d<=spec.maxNum});
    for(let x=opts.length-1;x>0;x--){const j=Math.floor(rng()*(x+1));[opts[x],opts[j]]=[opts[j],opts[x]]}
    let chosen=null;
    for(const p of opts){
      const w=t==='ok'?{t,p,d:dirOf(p,k)}:{t,p,n:cheb(p,v)};
      if(t==='ok'){
        // ok en az iki karanlık şüpheliyi göstersin: katili tek başına söylemesin
        const onR=sus.filter(s=>!lit(b,s)&&onRay(w,s)).length;
        if(onR<(spec.raySus||2))continue;
      }
      b.wit=wit.concat([w]);
      const n=solutions(b,b.wit).length;
      if(last?n===1:n>1){chosen=w;break}
    }
    if(!chosen)return null;
    wit.push(chosen);
  }
  b.wit=wit;
  if(solutions(b,wit).length!==1)return null;
  // ölçüler
  const m={};
  m.needed=wit.filter(w=>solutions(b,wit.filter(x=>x!==w)).length!==1).length;
  m.noNum=solutions(b,wit.filter(w=>w.t!=='sayi')).length;   // sadece oklarla kaç çözüm
  m.noOk=solutions(b,wit.filter(w=>w.t!=='ok')).length;      // sadece sayılarla kaç çözüm
  m.loose=solutions(b,wit,false).length;                     // "başka karanlık şüpheli yok" olmadan
  if(m.needed<(spec.needMin||W.length))return null;
  if(W.includes('sayi')&&W.includes('ok')&&(m.noNum<2||m.noOk<2))return null;
  if(spec.loose&&m.loose<2)return null;
  return{N,police,sus,wit,victim:v,killer:sol.k,cand0:c0.length,m};
}

const SPECS=[
  {title:'çığlık',     N:6,P:2,S:4,W:['ok','sayi'],        darkMin:3,darkMax:3,candMin:6,maxNum:3},
  {title:'ara sokak',  N:6,P:2,S:5,W:['sayi','ok'],        darkMin:3,darkMax:4,candMin:7,maxNum:3},
  {title:'kalabalık',  N:7,P:2,S:6,W:['ok','sayi'],        darkMin:4,darkMax:5,candMin:9,maxNum:3,loose:true},
  {title:'iki göz',    N:7,P:3,S:6,W:['ok','ok','sayi'],   darkMin:4,darkMax:5,candMin:9,maxNum:3,needMin:2},
  {title:'çarşı',      N:8,P:3,S:8,W:['sayi','ok','sayi'], darkMin:5,darkMax:6,candMin:12,maxNum:4,loose:true,needMin:3},
  {title:'son sefer',  N:8,P:3,S:9,W:['ok','sayi','sayi'], darkMin:6,darkMax:7,candMin:14,maxNum:4,loose:true,needMin:3},
];

if(require.main===module){
  const seed=+(process.argv[2]||20261125);
  const rng=mulberry32(seed);
  const cases=SPECS.map((spec,i)=>{
    let best=null;
    // birkaç aday üret, en "birleştirme isteyen" olanı seç
    for(let t=0,found=0;t<400000&&found<40;t++){
      const c=tryCase(rng,spec);
      if(!c)continue;found++;
      const score=Math.min(c.m.noNum,c.m.noOk)*2+c.m.loose+c.cand0*0.1;
      if(!best||score>best.score)best={...c,score};
    }
    if(!best)throw new Error('üretilemedi: '+spec.title);
    delete best.score;
    return{no:i+1,title:spec.title,...best};
  });
  const out='// Otomatik üretildi: node tools/generate.js\nwindow.KN_CASES = '+JSON.stringify(cases.map(({m,...c})=>c))+';\n';
  fs.writeFileSync(path.join(__dirname,'..','cases.js'),out);
  cases.forEach(c=>console.log(`#${c.no} ${c.title}: ${c.N}x${c.N} şüpheli=${c.sus.length} aday(tanıksız)=${c.cand0} tanık=${c.wit.map(w=>w.t==='ok'?'ok':'sayı '+w.n).join('+')} | sadece ok→${c.m.noNum} sadece sayı→${c.m.noOk} gevşek→${c.m.loose} gerekli=${c.m.needed}`));
}
module.exports={solutions,lit,cheb,dirOf,onRay};
