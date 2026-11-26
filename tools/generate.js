// Kör Nokta vaka üreticisi (v4: bir gecede birden çok cinayet)
// Kurallar:
//  1) Polis etrafındaki 8 kareyi görür. Kurban orada olamaz, orada duran şüpheli masumdur.
//  2) Her kurbanın yanında polisin görmediği tam bir şüpheli vardır: katili. Her katil tek kişiyi öldürdü.
//  3) Ok tanığı: okun çizgisinde tam bir katil var.
//     Sayı tanığı: en yakın kurban tam o kadar kare uzakta (çapraz adım da 1).
// Kurbanlar boş karelerdedir. Oyuncu bütün kurbanları bulur; katiller kurbanlardan çıkar.
// Her vaka: tek çözüm, tahmin gerektirmez (aşağıdaki insan-benzeri çözücü bitirebilmeli).
// Kullanım: node tools/generate.js [tohum]  ->  cases.js
const fs = require('fs');
const path = require('path');

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const cheb=(a,b)=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]));
const DIRS=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]];
const dirOf=(w,v)=>{const dr=v[0]-w[0],dc=v[1]-w[1];if(!dr&&!dc)return null;if(dr&&dc&&Math.abs(dr)!==Math.abs(dc))return null;return[Math.sign(dr),Math.sign(dc)]};
const onRay=(w,p)=>{const d=dirOf(w.p,p);return !!d&&d[0]===w.d[0]&&d[1]===w.d[1]};
const lit=(b,p)=>b.police.some(q=>cheb(p,q)<=1);

// Tahtanın sabit yapısı: aday kareler ve her adayın tek karanlık komşusu
function model(b){
  const N=b.N,occ=new Set([...b.police,...b.sus,...b.wit.map(w=>w.p)].map(p=>p[0]*N+p[1]));
  const dark=b.sus.map((s,i)=>i).filter(i=>!lit(b,b.sus[i]));
  const cand=[],owner=[];
  for(let r=0;r<N;r++)for(let c=0;c<N;c++){
    const v=[r,c];
    if(occ.has(r*N+c)||lit(b,v))continue;
    const nb=dark.filter(i=>cheb(b.sus[i],v)===1);
    if(nb.length!==1)continue;
    cand.push(v);owner.push(nb[0]);
  }
  return{cand,owner,dark};
}

// Kısıtlar, aday indeksleri üzerinden
function constraints(b,M){
  const C=[];const n=M.cand.length;
  const banned=new Set();
  for(const w of b.wit)if(w.t==='sayi'){
    const ring=[];
    M.cand.forEach((v,i)=>{const d=cheb(v,w.p);if(d<w.n)banned.add(i);else if(d===w.n)ring.push(i)});
    C.push({t:'ring',cells:ring,w});
  }
  const groups=b.sus.map((s,si)=>M.cand.map((v,i)=>i).filter(i=>M.owner[i]===si));
  groups.forEach((g,si)=>{if(g.length>1)C.push({t:'amo',cells:g})});
  for(const w of b.wit)if(w.t==='ok'){
    const gs=b.sus.map((s,si)=>si).filter(si=>onRay(w,b.sus[si])).map(si=>groups[si]);
    C.push({t:'one',groups:gs,w});
  }
  C.push({t:'count',cells:M.cand.map((v,i)=>i),k:b.K});
  return{C,banned,n};
}

// st: 0 bilinmiyor, 1 kurban, -1 boş. Döner: false çelişki, yoksa değişti mi
function propagate(S,st){
  let changed=true,any=false;
  const set=(i,val)=>{if(st[i]===val)return true;if(st[i]!==0)return false;st[i]=val;changed=true;any=true;return true};
  while(changed){
    changed=false;
    for(const c of S.C){
      if(c.t==='ring'){
        if(c.cells.some(i=>st[i]===1))continue;
        const u=c.cells.filter(i=>st[i]===0);
        if(!u.length)return false;
        if(u.length===1&&!set(u[0],1))return false;
      }else if(c.t==='amo'){
        const v=c.cells.filter(i=>st[i]===1);
        if(v.length>1)return false;
        if(v.length===1)for(const i of c.cells)if(i!==v[0]&&!set(i,-1))return false;
      }else if(c.t==='one'){
        const tr=c.groups.filter(g=>g.some(i=>st[i]===1));
        if(tr.length>1)return false;
        if(tr.length===1){for(const g of c.groups)if(g!==tr[0])for(const i of g)if(!set(i,-1))return false;continue}
        const open=c.groups.filter(g=>g.some(i=>st[i]===0));
        if(!open.length)return false;
        if(open.length===1){const u=open[0].filter(i=>st[i]===0);if(u.length===1&&!set(u[0],1))return false}
      }else if(c.t==='count'){
        const v=c.cells.filter(i=>st[i]===1).length,u=c.cells.filter(i=>st[i]===0);
        if(v>c.k||v+u.length<c.k)return false;
        if(v===c.k)for(const i of u)if(!set(i,-1))return false;
        if(v+u.length===c.k)for(const i of u)if(!set(i,1))return false;
      }
    }
  }
  return true;
}

// Çözüm sayısı (en fazla lim)
function countSolutions(S,st,lim=2){
  st=st.slice();
  if(!propagate(S,st))return 0;
  const i=st.indexOf(0);
  if(i<0)return 1;
  let a=0;
  for(const val of [1,-1]){const s2=st.slice();s2[i]=val;a+=countSolutions(S,s2,lim-a);if(a>=lim)break}
  return a;
}

// İnsan-benzeri çözücü: düz çıkarım, takılınca tek adımlık "varsayalım ki" denemesi
function grade(S){
  const st=new Array(S.n).fill(0);for(const i of S.banned)st[i]=-1;
  let rounds=0,trials=0,deepTrials=0;
  if(!propagate(S,st))return null;
  while(st.includes(0)){
    rounds++;
    let progress=false;
    for(let i=0;i<S.n&&!progress;i++){
      if(st[i])continue;
      for(const val of [1,-1]){
        const s2=st.slice();s2[i]=val;
        if(!propagate(S,s2)){st[i]=-val;propagate(S,st);trials++;progress=true;break}
      }
    }
    if(!progress)return null; // tahmin gerektiriyor
  }
  return{rounds,trials};
}

function shuffle(rng,a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

function tryCase(rng,spec){
  const {N,P,S:NS,K}=spec;
  const cells=[];for(let r=0;r<N;r++)for(let c=0;c<N;c++)cells.push([r,c]);
  shuffle(rng,cells);
  const police=cells.slice(0,P),sus=cells.slice(P,P+NS);
  const b={N,K,police,sus,wit:[]};
  // polis birbirini görmesin, ışıklar çok çakışmasın
  if(police.some((p,i)=>police.some((q,j)=>j>i&&cheb(p,q)<=2)))return null;
  let M=model(b);
  // gizli çözüm: K kurban, farklı katiller
  const idx=shuffle(rng,M.cand.map((v,i)=>i));
  const vict=[],used=new Set();
  for(const i of idx){if(vict.length===K)break;if(used.has(M.owner[i]))continue;
    if(spec.spread&&vict.some(j=>cheb(M.cand[j],M.cand[i])<spec.spread))continue;
    vict.push(i);used.add(M.owner[i])}
  if(vict.length<K)return null;
  const V=vict.map(i=>M.cand[i]),killers=vict.map(i=>M.owner[i]);
  // kurbanlar kenara yığılmasın
  const edge=V.filter(v=>v[0]===0||v[1]===0||v[0]===N-1||v[1]===N-1).length;
  if(edge>Math.floor(K/2))return null;
  // tanık eklerken modelin adayları değişir (tanık karesi dolu); kurban kareleri ve komşuluk sabit kalır
  const occ=new Set([...police,...sus,...V].map(p=>p[0]*N+p[1]));
  const free=shuffle(rng,cells.filter(p=>!occ.has(p[0]*N+p[1])&&!V.some(v=>cheb(v,p)===0)));
  const proposals=[];
  for(const p of free){
    const dn=Math.min(...V.map(v=>cheb(v,p)));
    if(dn>=2&&dn<=spec.maxNum)proposals.push({t:'sayi',p,n:dn});
    for(const d of DIRS){
      const w={t:'ok',p,d};
      const onR=sus.map((s,si)=>si).filter(si=>onRay(w,sus[si])&&!lit(b,sus[si]));
      const kOn=onR.filter(si=>killers.includes(si)).length;
      if(kOn===1&&onR.length>=2&&cheb(p,sus[onR[0]])>=1)proposals.push(w);
    }
  }
  shuffle(rng,proposals);
  const wit=[];
  const solCount=ws=>{const bb={...b,wit:ws};const MM=model(bb);
    // tanık kareleri kurban karesine denk gelmemeli (free zaten engelliyor)
    const SS=constraints(bb,MM);const st=new Array(SS.n).fill(0);for(const i of SS.banned)st[i]=-1;
    return countSolutions(SS,st,2)};
  // açgözlü: çözüm sayısını en çok düşüren tanıkları ekle, tek çözüme inene kadar
  let cur=Infinity;
  for(let step=0;step<spec.maxWit;step++){
    let best=null,bestN=Infinity;
    for(const w of proposals.slice(0,60)){
      if(wit.some(x=>cheb(x.p,w.p)===0))continue;
      if(w.t==='ok'&&wit.filter(x=>x.t==='ok').length>=spec.maxOk)continue;
      if(w.t==='sayi'&&wit.filter(x=>x.t==='sayi').length>=spec.maxNumW)continue;
      const n=solCount(wit.concat([w]));
      if(n>=1&&n<bestN){bestN=n;best=w}
    }
    if(!best)return null;
    wit.push(best);cur=bestN;
    shuffle(rng,proposals);
    if(cur===1)break;
  }
  if(cur!==1)return null;
  // gereksiz tanıkları at
  for(let i=wit.length-1;i>=0;i--){const t=wit.slice(0,i).concat(wit.slice(i+1));if(solCount(t)===1)wit.splice(i,1)}
  b.wit=wit;
  const M2=model(b),S2=constraints(b,M2);
  const g=grade(S2);
  if(!g)return null;
  if(!wit.some(w=>w.t==='ok')||!wit.some(w=>w.t==='sayi'))return null;
  const victims=V,killerIdx=killers;
  return{N,K,police,sus,wit,victims,killers:killerIdx,g,cand:M2.cand.length-S2.banned.size};
}

const SPECS=[
  {title:'ilk gece',   N:6,P:2,S:5, K:2,maxNum:3,maxWit:4,maxOk:2,maxNumW:2,spread:2, want:[0,0]},
  {title:'ara sokak',  N:7,P:2,S:7, K:2,maxNum:3,maxWit:5,maxOk:2,maxNumW:3,spread:2, want:[1,1]},
  {title:'kalabalık',  N:7,P:3,S:8, K:3,maxNum:3,maxWit:5,maxOk:3,maxNumW:3,spread:2, want:[1,2]},
  {title:'iki yaka',   N:8,P:3,S:10,K:3,maxNum:4,maxWit:6,maxOk:3,maxNumW:3,spread:2, want:[2,3]},
  {title:'çarşı',      N:8,P:3,S:11,K:4,maxNum:4,maxWit:7,maxOk:3,maxNumW:4,spread:2, want:[3,4]},
  {title:'son sefer',  N:9,P:4,S:13,K:4,maxNum:4,maxWit:7,maxOk:4,maxNumW:4,spread:2, want:[4,9]},
];

if(require.main===module){
  const seed=+(process.argv[2]||20261125);
  const rng=mulberry32(seed);
  const cases=SPECS.map((spec,i)=>{
    let best=null,found=0;
    for(let t=0;t<200000&&found<30;t++){
      const c=tryCase(rng,spec);
      if(!c)continue;
      if(c.g.trials<spec.want[0]||c.g.trials>spec.want[1])continue;
      found++;
      const score=c.g.trials*3+c.g.rounds+c.cand*0.05-c.wit.length*0.5;
      if(!best||score>best.score)best={...c,score};
    }
    if(!best)throw new Error('üretilemedi: '+spec.title);
    delete best.score;
    return{no:i+1,title:spec.title,...best};
  });
  const out='// Otomatik üretildi: node tools/generate.js\nwindow.KN_CASES = '+JSON.stringify(cases.map(({g,cand,...c})=>c))+';\n';
  if(!process.env.DRY)fs.writeFileSync(path.join(__dirname,'..','cases.js'),out);
  cases.forEach(c=>console.log(`#${c.no} ${c.title}: ${c.N}x${c.N} K=${c.K} şüpheli=${c.sus.length} aday=${c.cand} tanık=${c.wit.map(w=>w.t==='ok'?'ok':'sayı'+w.n).join(' ')} | tur=${c.g.rounds} varsayım=${c.g.trials}`));
}
module.exports={model,constraints,propagate,countSolutions,grade,cheb,dirOf,onRay,lit};
