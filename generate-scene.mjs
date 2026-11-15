// Compact port of Shan Shui Inf's generator (Mount.mountain, texture, stroke, blob, trees, flatMount, water) emitting a small SVG.
import fs from 'fs'
let S=Number(process.argv[3]||11)
const rand=()=>{S|=0;S=S+0x6D2B79F5|0;let t=Math.imul(S^S>>>15,1|S);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}
const mapval=(v,a,b,c,d)=>c+(d-c)*((v-a)/(b-a))
const normRand=(m,M)=>mapval(rand(),0,1,m,M)
const choice=a=>a[Math.floor(a.length*rand())]
function wtrand(fn){for(;;){const x=rand(),y=rand();if(y<fn(x))return x}}
const randG=()=>wtrand(x=>Math.pow(Math.E,-24*Math.pow(x-.5,2)))*2-1
// Perlin (from the original)
const Noise=new function(){const YW=4,ZW=8,SZ=4095;let oct=4,fall=.5;const sc=i=>.5*(1-Math.cos(i*Math.PI));let perlin=Array.from({length:SZ+1},()=>rand())
 this.noise=(x,y=0,z=0)=>{x=Math.abs(x);y=Math.abs(y);z=Math.abs(z);let xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi,r=0,a=.5
  for(let o=0;o<oct;o++){let of=xi+(yi<<YW)+(zi<<ZW);const rx=sc(xf),ry=sc(yf);let n1=perlin[of&SZ];n1+=rx*(perlin[(of+1)&SZ]-n1);let n2=perlin[(of+(1<<YW))&SZ];n2+=rx*(perlin[(of+(1<<YW)+1)&SZ]-n2);n1+=ry*(n2-n1);of+=1<<ZW;n2=perlin[of&SZ];n2+=rx*(perlin[(of+1)&SZ]-n2);let n3=perlin[(of+(1<<YW))&SZ];n3+=rx*(perlin[(of+(1<<YW)+1)&SZ]-n3);n2+=ry*(n3-n2);n1+=sc(zf)*(n2-n1);r+=n1*a;a*=fall;xi<<=1;xf*=2;yi<<=1;yf*=2;zi<<=1;zf*=2;if(xf>=1){xi++;xf--}if(yf>=1){yi++;yf--}if(zf>=1){zi++;zf--}}
  return r}}()
const loopNoise=l=>{const dif=l[l.length-1]-l[0];let lo=100,hi=-100;for(let i=0;i<l.length;i++){l[i]+=dif*(l.length-1-i)/(l.length-1);lo=Math.min(lo,l[i]);hi=Math.max(hi,l[i])}for(let i=0;i<l.length;i++)l[i]=mapval(l[i],lo,hi,0,1)}
const I=n=>Math.round(n)
const pts=(p,step=1)=>{const a=[];for(let i=0;i<p.length;i+=step)a.push(p[i]);if((p.length-1)%step)a.push(p[p.length-1]);let px=I(a[0][0]),py=I(a[0][1]),d='M'+px+' '+py+(a.length>1?'l':'');for(let i=1;i<a.length;i++){const x=I(a[i][0]),y=I(a[i][1]);d+=(i>1?' ':'')+(x-px)+' '+(y-py);px=x;py=y}return d}
const mk=()=>({l2:'',fill:'',pf:'',dk:'',ln:'',edge:'',tex:['','',''],leaf:['','',''],trunk:'',ground:'',branch:''})
let B=mk()
// ---- brush stroke (original stroke()) -> filled polygon
function strokePoly(pl,{wid=2,noi=.5,fun=x=>Math.sin(x*Math.PI)}={}){
  if(pl.length<3)return ''
  const v0=[],v1=[],n0=rand()*10
  for(let i=1;i<pl.length-1;i++){let w=wid*fun(i/pl.length);w=w*(1-noi)+w*noi*Noise.noise(i*.5,n0)
    const a1=Math.atan2(pl[i][1]-pl[i-1][1],pl[i][0]-pl[i-1][0]),a2=Math.atan2(pl[i][1]-pl[i+1][1],pl[i][0]-pl[i+1][0]);let a=(a1+a2)/2;if(a<a2)a+=Math.PI
    v0.push([pl[i][0]+w*Math.cos(a),pl[i][1]+w*Math.sin(a)]);v1.push([pl[i][0]-w*Math.cos(a),pl[i][1]-w*Math.sin(a)])}
  const all=[pl[0]].concat(v0,[pl[pl.length-1]],v1.reverse(),[pl[0]])
  return pts(all,3)+'Z'
}
// ---- blob (original blob()) -> loop
function blobPts(x,y,{len=20,wid=5,ang=0,noi=.5,fun}={}){
  fun=fun||(p=>p<=1?Math.pow(Math.sin(p*Math.PI),.5):-Math.pow(Math.sin((p+1)*Math.PI),.5))
  const reso=20,la=[]
  for(let i=0;i<=reso;i++){const p=i/reso*2,xo=len/2-Math.abs(p-1)*len,yo=fun(p)*wid/2;la.push([Math.hypot(xo,yo),Math.atan2(yo,xo)])}
  const ns=[],n0=rand()*10;for(let i=0;i<=reso;i++)ns.push(Noise.noise(i*.05,n0));loopNoise(ns)
  return la.map((q,i)=>{const s=ns[i]*noi+(1-noi);return[x+Math.cos(q[1]+ang)*q[0]*s,y+Math.sin(q[1]+ang)*q[0]*s]})
}
const leafLvl=a=>a<.36?0:a<.5?1:2
function blob(x,y,o,a=.4){B.leaf[leafLvl(a)]+=pts(blobPts(x,y,o),4)+'Z'}
// ---- trees
function tree01(x,y,{hei=50,wid=3,a=.3}={}){
  const reso=10,ns=[];for(let i=0;i<reso;i++)ns.push([Noise.noise(i*.5),Noise.noise(i*.5,.5)])
  const l1=[],l2=[]
  for(let i=0;i<reso;i++){const nx=x,ny=y-i*hei/reso
    if(i>=reso/4)for(let j=0;j<(reso-i)/5;j++)blob(nx+(rand()-.5)*wid*1.2*(reso-i),ny+(rand()-.5)*wid,{len:rand()*20*(reso-i)*.2+10,wid:rand()*6+3,ang:(rand()-.5)*Math.PI/6},a+rand()*.2)
    l1.push([nx+(ns[i][0]-.5)*wid-wid/2,ny]);l2.push([nx+(ns[i][1]-.5)*wid+wid/2,ny])}
  B.trunk+=pts(l1,3)+pts(l2,3)
}
function tree02(x,y,{hei=16,wid=8,clu=5,a=.5}={}){
  for(let i=0;i<clu;i++)blob(x+randG()*clu*4,y+randG()*clu*4,{ang:Math.PI/2,fun:p=>p<=1?Math.pow(Math.sin(p*Math.PI)*p,.5):-Math.pow(Math.sin((p-2)*Math.PI*(p-2)),.5),wid:rand()*wid*.75+wid*.5,len:rand()*hei*.75+hei*.5},a)
}
function tree03(x,y,{hei=50,wid=5,ben=()=>0,a=.3}={}){
  const reso=10,ns=[];for(let i=0;i<reso;i++)ns.push([Noise.noise(i*.5),Noise.noise(i*.5,.5)])
  const l1=[],l2=[]
  for(let i=0;i<reso;i++){const nx=x+ben(i/reso)*100,ny=y-i*hei/reso
    if(i>=reso/5)for(let j=0;j<(reso-i)*1;j++){const sh=p=>Math.log(50*p+1)/3.95;const ox=rand()*wid*2*sh((reso-i)/reso);blob(nx+ox*choice([-1,1]),ny+(rand()-.5)*wid*2,{len:ox*2,wid:rand()*6+3,ang:(rand()-.5)*Math.PI/6},a+rand()*.2)}
    l1.push([nx+((ns[i][0]-.5)*wid-wid/2)*(reso-i)/reso,ny]);l2.push([nx+((ns[i][1]-.5)*wid+wid/2)*(reso-i)/reso,ny])}
  B.fill+=pts(l1.concat(l2.reverse()),1)+'Z'
}
function tree08(x,y,{hei=80,wid=1}={}){
  const ang=normRand(-1,1)*Math.PI*.2
  let tl=[];for(let i=0;i<=10;i++)tl.push([x+Math.sin(ang)*hei*i/10*.3+(Noise.noise(i*.3)-.5)*6,y-hei*i/10])
  B.trunk+=pts(tl,2)
  function frac(xo,yo,dep,{a=-Math.PI/2,len=15,ben=0}={}){
    const e=[xo+Math.cos(a)*len,yo+Math.sin(a)*len];B.branch+=`M${I(xo)} ${I(yo)}L${I(e[0])} ${I(e[1])}`
    if(dep!=0){const nb=ben+choice([-1,1])*Math.PI*.001*dep*dep
      if(rand()<.5){frac(e[0],e[1],dep-1,{a:a+ben+Math.PI*choice([normRand(-1,.5),normRand(.5,1)])*.2,len:len*normRand(.8,.9),ben:nb});frac(e[0],e[1],dep-1,{a:a+ben+Math.PI*choice([normRand(-1,-.5),normRand(.5,1)])*.2,len:len*normRand(.8,.9),ben:nb})}
      else frac(e[0],e[1],dep-1,{a:a+ben,len:len*normRand(.8,.9),ben:nb})}}
  for(let i=0;i<tl.length;i++){if(rand()<.25)frac(tl[i][0],tl[i][1],Math.floor(3*rand()),{a:-Math.PI/2-ang*rand()});else if(i==5)frac(tl[i][0],tl[i][1],3,{a:-Math.PI/2+ang})}
}
// ---- rock
function rock(xo,yo,seed,{hei=80,wid=100,tex=14}={}){
  const reso=[10,50],pl=[]
  for(let i=0;i<reso[0];i++){pl.push([]);const ns=[];for(let j=0;j<reso[1];j++)ns.push(Noise.noise(i,j*.2,seed));loopNoise(ns)
    for(let j=0;j<reso[1];j++){const a=j/reso[1]*Math.PI*2-Math.PI/2;let l=wid*hei/Math.sqrt(Math.pow(hei*Math.cos(a),2)+Math.pow(wid*Math.sin(a),2));l*=.7+.3*ns[j];const p=1-i/reso[0];let nx=Math.cos(a)*l*p,ny=-Math.sin(a)*l*p;if(Math.PI<a||a<0)ny*=.2;ny+=hei*(i/reso[0])*.2;pl[pl.length-1].push([nx,ny])}}
  const off=p=>p.map(q=>[q[0]+xo,q[1]+yo])
  B.fill+=pts(off(pl[0]),2)+'Z';B.edge+=strokePoly(off(pl[0].slice(0,Math.floor(pl[0].length*.55))),{wid:2.2,noi:1})
  B.tex[0]+=texture(pl,{xo,yo,tex,len:.2,dis:()=>rand()>.5?.15+.15*rand():.85-.15*rand()})
}
// ---- texture (original texture())
function texture(pl,{xo=0,yo=0,tex=200,len=.2,dis=()=>rand()>.5?rand()/3:2/3+rand()/3,levels}={}){
  const reso=[pl.length,pl[0].length];let out=''
  for(let i=0;i<tex;i++){const mid=(dis()*reso[1])|0,hl=Math.floor(rand()*reso[1]*len);let st=Math.min(Math.max(mid-hl,0),reso[1]),en=Math.min(Math.max(mid+hl,0),reso[1])
    const layer=i/tex*(reso[0]-1),p=layer-Math.floor(layer),s=[]
    for(let j=st;j<en;j++){const x=pl[Math.floor(layer)][j][0]*p+pl[Math.ceil(layer)][j][0]*(1-p),y=pl[Math.floor(layer)][j][1]*p+pl[Math.ceil(layer)][j][1]*(1-p);const nz=30/(layer+1);s.push([x+nz*(Noise.noise(x,j*.5)-.5)+xo,y+nz*(Noise.noise(y,j*.5)-.5)+yo])}
    if(s.length>2){const lv=levels?levels:Math.floor(rand()*3);if(levels!==undefined)out+=pts(s,3);else B.tex[lv]+=pts(s,3)}}
  return out
}
// ---- foot (rolling base)
// ======== ported from Shan Shui Inf: Arch, Man, boat, big twisting trees ========
const div=(pl,reso)=>{const tl=(pl.length-1)*reso,r=[];for(let i=0;i<tl;i++){const a=pl[Math.floor(i/reso)],b=pl[Math.ceil(i/reso)],p=(i%reso)/reso;r.push([a[0]*(1-p)+b[0]*p,a[1]*(1-p)+b[1]*p])}r.push(pl[pl.length-1]);return r}
const T=(p,xo,yo)=>p.map(q=>[q[0]+xo,q[1]+yo])
const pfill=(p,xo,yo)=>{B.pf+=pts(T(p,xo,yo),1)+'Z'}
const bl=(pl,xo,yo,w=1,seg=3)=>{const q=T(pl,xo,yo).map(v=>[v[0]+(rand()-.5)*.8,v[1]+(rand()-.5)*.8]);B.l2+=pts(q,1)}
const flip=(pl,ax=0)=>{for(const q of pl)q[0]=ax-(q[0]-ax);return pl}
function box(xo,yo,{hei=20,wid=120,rot=.7,per=4,tra=true,bot=true,wei=1,dec=()=>[]}={}){
  const mid=-wid*.5+wid*rot,bmid=-wid*.5+wid*(1-rot),pl=[]
  pl.push([[-wid*.5,-hei],[-wid*.5,0]],[[wid*.5,-hei],[wid*.5,0]])
  if(bot)pl.push([[-wid*.5,0],[mid,per]],[[wid*.5,0],[mid,per]])
  pl.push([[mid,-hei],[mid,per]])
  if(tra){if(bot)pl.push([[-wid*.5,0],[bmid,-per]],[[wid*.5,0],[bmid,-per]]);pl.push([[bmid,-hei],[bmid,-per]])}
  const surf=(rot<.5)*2-1
  pl.push(...dec({pul:[surf*wid*.5,-hei],pur:[mid,-hei+per],pdl:[surf*wid*.5,0],pdr:[mid,per]}))
  if(!tra)pfill([[-wid*.5,-hei],[wid*.5,-hei],[wid*.5,0],[mid,per],[-wid*.5,0]],xo,yo)
  for(const l of pl)bl(l,xo,yo,wei,2)
}
function deco(style,{pul,pur,pdl,pdr,hsp=[1,3],vsp=[1,2]}){
  const pl=[],dl=div([pul,pdl],vsp[1]),dr=div([pur,pdr],vsp[1]),du=div([pul,pur],hsp[1]),dd=div([pdl,pdr],hsp[1])
  if(style==1){const mlu=du[hsp[0]],mru=du[du.length-1-hsp[0]],mld=dd[hsp[0]],mrd=dd[du.length-1-hsp[0]]
    for(let i=vsp[0];i<dl.length-vsp[0];i+=vsp[0]){pl.push([div([mlu,mld],vsp[1])[i],dl[i]],[div([mru,mrd],vsp[1])[i],dr[i]])}pl.push([mlu,mld],[mru,mrd])}
  else if(style==2){for(let i=hsp[0];i<du.length-hsp[0];i+=hsp[0])pl.push([du[i],dd[i]])}
  else{const mlu=du[hsp[0]],mru=du[du.length-1-hsp[0]],mld=dd[hsp[0]],mrd=dd[du.length-1-hsp[0]]
    for(let i=vsp[0];i<dl.length-vsp[0];i+=vsp[0]){pl.push([div([mlu,mld],vsp[1])[i],div([mru,mrd],vsp[1])[i]],[div([mlu,mru],vsp[1])[i],div([mld,mrd],vsp[1])[i]])}pl.push([mlu,mld],[mru,mrd])}
  return pl.filter(l=>l[0]&&l[1])
}
function roof(xo,yo,{hei=20,wid=120,rot=.7,per=4,cor=5,wei=1}={}){
  const opf=pl=>rot<.5?flip(pl):pl,rrot=rot<.5?1-rot:rot,mid=-wid*.5+wid*rrot,quat=(mid+wid*.5)*.5-mid,pl=[]
  pl.push(opf([[-wid*.5+quat,-hei-per/2],[-wid*.5+quat*.5,-hei/2-per/4],[-wid*.5-cor,0]]))
  pl.push(opf([[mid+quat,-hei],[(mid+quat+wid*.5)/2,-hei/2],[wid*.5+cor,0]]))
  pl.push(opf([[mid+quat,-hei],[mid+quat/2,-hei/2+per/2],[mid+cor,per]]))
  pl.push(opf([[-wid*.5-cor,0],[mid+cor,per]]),opf([[wid*.5+cor,0],[mid+cor,per]]),opf([[-wid*.5+quat,-hei-per/2],[mid+quat,-hei]]))
  pfill(opf([[-wid*.5,0],[-wid*.5+quat,-hei-per/2],[mid+quat,-hei],[wid*.5,0],[mid,per]]),xo,yo)
  for(const l of pl)bl(l,xo,yo,wei,2)
}
function pagroof(xo,yo,{hei=20,wid=120,per=4,cor=10,sid=4,wei=1}={}){
  const pl=[],po=[[0,-hei]]
  for(let i=0;i<sid;i++){const fx=wid*(i/(sid-1)-.5),fy=per*(1-Math.abs(i/(sid-1)-.5)*2),fxx=(wid+cor)*(i/(sid-1)-.5)
    if(i>0)pl.push([pl[pl.length-1][2],[fxx,fy]]);pl.push([[0,-hei],[fx*.5,(-hei+fy)*.5],[fxx,fy]]);po.push([fxx,fy])}
  pfill(po,xo,yo);for(const l of pl)bl(l,xo,yo,wei,2)
}
function railing(xo,yo,{hei=10,wid=180,per=8,seg=4}={}){
  const mid=-wid*.5+wid*.7;let ln=[]
  ln.push([[-wid*.5,0],[mid,per],[wid*.5,0]],[[-wid*.5,-hei],[mid,-hei+per],[wid*.5,-hei]])
  for(let i=1;i<seg;i++){const x=-wid*.5+(mid+wid*.5)*i/seg;ln.push([[x,per*i/seg],[x,-hei+per*i/seg]])}
  for(const l of ln)bl(l,xo,yo,.6,2)
}
function arch02(xo,yo,{hei=10,wid=50,rot=.3,per=5,sto=3,sty=1}={}){
  let hoff=0
  for(let i=0;i<sto;i++){
    box(xo,yo-hoff,{tra:false,hei,wid:wid*Math.pow(.85,i),rot,wei:.7,per,dec:a=>deco(sty,Object.assign({},a,{hsp:[[],[1,5],[1,5],[1,4]][sty],vsp:[[],[1,2],[1,2],[1,3]][sty]}))})
    roof(xo,yo-hoff-hei,{hei,wid:wid*Math.pow(.9,i),rot,wei:.7,per});hoff+=hei*1.5}
}
function arch03(xo,yo,{hei=10,wid=50,rot=.7,per=5,sto=7}={}){
  let hoff=0
  for(let i=0;i<sto;i++){
    box(xo,yo-hoff,{tra:false,hei,wid:wid*Math.pow(.85,i),rot,wei:.7,per:per/2,dec:a=>deco(1,Object.assign({},a,{hsp:[1,4],vsp:[1,2]}))})
    pagroof(xo,yo-hoff-hei,{hei:hei*1.5,wid:wid*Math.pow(.9,i),per,wei:.7});hoff+=hei*1.5}
}
function arch04(xo,yo,{hei=15,wid=30,rot=.7,per=5,sto=2}={}){
  let hoff=0
  for(let i=0;i<sto;i++){box(xo,yo-hoff,{tra:true,hei,wid:wid*Math.pow(.85,i),rot,wei:.7,per:per/2});pagroof(xo,yo-hoff-hei,{hei,wid:wid*Math.pow(.9,i),per,wei:.7});hoff+=hei*1.2}
}
function hut(xo,yo,{hei=40,wid=180,tex=70}={}){
  const reso=[10,10],pl=[]
  for(let i=0;i<reso[0];i++){pl.push([]);const hr=hei+hei*.2*rand();for(let j=0;j<reso[1];j++)pl[i].push([wid*(i/(reso[0]-1)-.5)*Math.pow(j/(reso[1]-1),.7),hr*(j/(reso[1]-1))])}
  pfill(pl[0].slice(0,-1).concat(pl[pl.length-1].slice(0,-1).reverse()),xo,yo)
  B.dk+=strokePoly(T(pl[0],xo,yo),{wid:.9,noi:.5,fun:()=>1})+strokePoly(T(pl[pl.length-1],xo,yo),{wid:.9,noi:.5,fun:()=>1})
  B.tex[1]+=texture(pl,{xo,yo,tex,len:.25,dis:()=>wtrand(a=>a*a),levels:0})
}
function arch01(xo,yo,{hei=70,wid=180,per=5}={}){
  const p=.4+rand()*.2,h0=hei*p,h1=hei*(1-p)
  hut(xo,yo-hei,{hei:h0,wid});box(xo,yo,{hei:h1,wid:wid*2/3,per,bot:false,wei:.9})
  const m=choice([0,1,1,2])
  if(m==1)man(xo+normRand(-wid/3,wid/3),yo,{fli:choice([true,false]),sca:.42})
  else if(m==2){man(xo+normRand(-wid/4,-wid/5),yo,{fli:false,sca:.42});man(xo+normRand(wid/5,wid/4),yo,{fli:true,sca:.42})}
  railing(xo,yo,{wid,per:per*2})
}
// ---- Man
function bezmh(P,w=1){
  if(P.length==2)P=[P[0],[(P[0][0]+P[1][0])/2,(P[0][1]+P[1][1])/2],P[1]]
  const mp=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],pl=[]
  for(let j=0;j<P.length-2;j++){const p0=j==0?P[j]:mp(P[j],P[j+1]),p1=P[j+1],p2=j==P.length-3?P[j+2]:mp(P[j+1],P[j+2]),n=6
    for(let i=0;i<n+(j==P.length-3?1:0);i++){const t=i/n,u=Math.pow(1-t,2)+2*t*(1-t)*w+t*t
      pl.push([(Math.pow(1-t,2)*p0[0]+2*t*(1-t)*p1[0]*w+t*t*p2[0])/u,(Math.pow(1-t,2)*p0[1]+2*t*(1-t)*p1[1]*w+t*t*p2[1])/u])}}
  return pl
}
function expand(pl,wf){
  const v0=[],v1=[]
  for(let i=1;i<pl.length-1;i++){const w=wf(i/pl.length),a1=Math.atan2(pl[i][1]-pl[i-1][1],pl[i][0]-pl[i-1][0]),a2=Math.atan2(pl[i][1]-pl[i+1][1],pl[i][0]-pl[i+1][0]);let a=(a1+a2)/2;if(a<a2)a+=Math.PI
    v0.push([pl[i][0]+w*Math.cos(a),pl[i][1]+w*Math.sin(a)]);v1.push([pl[i][0]-w*Math.cos(a),pl[i][1]-w*Math.sin(a)])}
  const l=pl.length-1,a0=Math.atan2(pl[1][1]-pl[0][1],pl[1][0]-pl[0][0])-Math.PI/2,a1=Math.atan2(pl[l][1]-pl[l-1][1],pl[l][0]-pl[l-1][0])-Math.PI/2,w0=wf(0),w1=wf(1)
  v0.unshift([pl[0][0]+w0*Math.cos(a0),pl[0][1]+w0*Math.sin(a0)]);v1.unshift([pl[0][0]-w0*Math.cos(a0),pl[0][1]-w0*Math.sin(a0)])
  v0.push([pl[l][0]+w1*Math.cos(a1),pl[l][1]+w1*Math.sin(a1)]);v1.push([pl[l][0]-w1*Math.cos(a1),pl[l][1]-w1*Math.sin(a1)])
  return [v0,v1]
}
const tranpoly=(p0,p1,pl)=>{const ang=Math.atan2(p1[1]-p0[1],p1[0]-p0[0])-Math.PI/2,scl=Math.hypot(p1[0]-p0[0],p1[1]-p0[1]);return pl.map(v=>[-v[0],v[1]]).map(v=>{const d=Math.hypot(v[0],v[1]),a=Math.atan2(v[1],v[0]);return[p0[0]+d*scl*Math.cos(ang+a),p0[1]+d*scl*Math.sin(ang+a)]})}
const flipper=pl=>pl.map(v=>[-v[0],v[1]])
function hat01(p0,p1,fli){const f=fli?flipper:x=>x,seed=rand()
  B.dk+=pts(tranpoly(p0,p1,f([[-.3,.5],[.3,.8],[.2,1],[0,1.1],[-.3,1.15],[-.55,1],[-.65,.5]])),1)+'Z'
  const q=[];for(let i=0;i<10;i++)q.push([-.3-Noise.noise(i*.2,seed)*i*.1,.5-i*.3]);B.ln+=pts(tranpoly(p0,p1,f(q)),3)}
function hat02(p0,p1,fli){const f=fli?flipper:x=>x
  B.dk+=pts(tranpoly(p0,p1,f([[-.3,.5],[-1.1,.5],[-1.2,.6],[-1.1,.7],[-.3,.8],[.3,.8],[1,.7],[1.3,.6],[1.2,.5],[.3,.5]])),1)+'Z'}
function stick01(p0,p1,fli){const f=fli?flipper:x=>x,seed=rand(),q=[];for(let i=0;i<12;i++)q.push([-Noise.noise(i*.1,seed)*.1*Math.sin(i/12*Math.PI)*5,i*.3]);B.ln+=pts(tranpoly(p0,p1,f(q)),3)}
function man(xo,yo,{sca=.5,hat=hat01,ite=()=>{},fli=true,len=[0,30,20,30,30,30,30,30,30]}={}){
  const ang=[0,-Math.PI/2,0,Math.PI/4*rand(),Math.PI*3/4*rand(),Math.PI*3/4,-Math.PI/4,-Math.PI*3/4-Math.PI/4*rand(),-Math.PI/4]
  len=len.map(v=>v*sca);const par=[null,0,1,0,3,1,5,1,7]
  const chain=i=>{const c=[];for(let k=i;k!==null;k=par[k])c.unshift(k);return c}
  const grot=i=>chain(i).reduce((s,k)=>s+ang[k],0)
  const gpos=i=>{let p=[0,0];for(const k of chain(i)){const a=grot(k);p[0]+=len[k]*Math.cos(a);p[1]+=len[k]*Math.sin(a)}return p}
  const P=ang.map((_,i)=>gpos(i));yo-=P[4][1]
  const g=v=>[(fli?-1:1)*v[0]+xo,v[1]+yo]
  const fs=x=>sca*8*(Math.sin(.5*x*Math.PI)*Math.pow(Math.sin(x*Math.PI),.1)+(1-x)*.4),fb=x=>sca*11*(Math.sin(.5*x*Math.PI)*Math.pow(Math.sin(x*Math.PI),.1)+(1-x)*.5),fh=x=>sca*7*Math.pow(.25-Math.pow(x-.5,2),.3)
  const cloth=(pl,fn)=>{const [a,b]=expand(bezmh(pl,2),fn);B.pf+=pts(a.concat(b.reverse()).map(g),1)+'Z';B.ln+=pts(a.map(g),2)+pts(b.map(g),2)}
  ite(g(P[8]),g(P[6]),fli)
  cloth([P[1],P[7],P[8]],fs);cloth([P[1],P[0],P[3],P[4]],fb);cloth([P[1],P[5],P[6]],fs);cloth([P[1],P[2]],fh)
  const [h1,h2]=expand(bezmh([P[1],P[2]],2),fh);h1.splice(0,Math.floor(h1.length*.1));h2.splice(0,Math.floor(h2.length*.95))
  B.dk+=pts(h1.concat(h2.reverse()).map(g),1)+'Z'
  hat(g(P[1]),g(P[2]),fli)
}
function boat01(xo,yo,{len=120,sca=1,fli=false}={}){
  const dir=fli?-1:1
  man(xo+20*sca*dir,yo,{ite:stick01,hat:hat02,sca:.5*sca,fli:!fli,len:[0,30,20,30,10,30,30,30,30]})
  const a=[],b=[];for(let i=0;i<len*sca;i+=6*sca){a.push([i*dir,Math.pow(Math.sin(i/len),.5)*7*sca]);b.push([i*dir,Math.pow(Math.sin(i/len),.5)*10*sca])}
  const pl=a.concat(b.reverse());pfill(pl,xo,yo);B.ln+=pts(T(pl,xo,yo),1)
}
// ---- big twisting trees (tree04 family)
function branch({hei=300,wid=6,ang=0,det=10,ben=Math.PI*.2}={}){
  let nx=0,ny=0,a0=0;const tl=[[0,0]],g=3
  for(let i=0;i<g;i++){a0+=(ben/2+rand()*ben/2)*choice([-1,1]);nx+=Math.cos(a0)*hei/g;ny-=Math.sin(a0)*hei/g;tl.push([nx,ny])}
  const ta=Math.atan2(tl[tl.length-1][1],tl[tl.length-1][0])
  for(const q of tl){const a=Math.atan2(q[1],q[0]),d=Math.hypot(q[0],q[1]);q[0]=d*Math.cos(a-ta+ang);q[1]=d*Math.sin(a-ta+ang)}
  const t1=[],t2=[],span=det,n=(tl.length-1)*span;let lx=0,ly=0
  for(let i=0;i<n;i++){const lp=tl[Math.floor(i/span)],np=tl[Math.ceil(i/span)],p=(i%span)/span,x=lp[0]*(1-p)+np[0]*p,y=lp[1]*(1-p)+np[1]*p,an=Math.atan2(y-ly,x-lx),wo=(Noise.noise(i*.3)-.5)*wid*hei/80;let b=0;if(p==0)b=rand()*wid
    const nw=wid*((n-i)/n*.5+.5);t1.push([x+Math.cos(an+Math.PI/2)*(nw+wo+b),y+Math.sin(an+Math.PI/2)*(nw+wo+b)]);t2.push([x+Math.cos(an-Math.PI/2)*(nw-wo+b),y+Math.sin(an-Math.PI/2)*(nw-wo+b)]);lx=x;ly=y}
  return [t1,t2]
}
function twig(tx,ty,dep,{dir=1,sca=1,wid=1,ang=0,lea=[true,12]}={}){
  const tw=[],tl=10,hs=rand()*.5+.5,tf=i=>-1/Math.pow(i/tl+1,5)+1,a0=rand()*Math.PI/6*dir+ang
  for(let i=0;i<tl;i++){const mx=dir*tf(i)*50*sca*hs,my=-i*5*sca,a=Math.atan2(my,mx),d=Math.hypot(mx,my),nx=Math.cos(a+a0)*d,ny=Math.sin(a+a0)*d;tw.push([nx+tx,ny+ty])
    if((i==((tl/3)|0)||i==(((tl*2)/3)|0))&&dep>0)twig(nx+tx,ny+ty,dep-1,{ang,sca:sca*.8,wid,dir:dir*choice([-1,1]),lea})
    if(i==tl-1&&lea[0])for(let j=0;j<3;j++){const dj=(j-1)*6;blob(nx+tx+Math.cos(ang)*dj*wid,ny+ty+(Math.sin(ang)*dj-lea[1]/(dep+1))*wid,{wid:(6+3*rand())*wid,len:(15+12*rand())*wid,ang:ang/2+Math.PI/2+Math.PI*.2*(rand()-.5),fun:p=>p<=1?Math.pow(Math.sin(p*Math.PI)*p,.5):-Math.pow(Math.sin((p-2)*Math.PI*(p-2)),.5)},.4+dep*.12)}}
  B.ln+=pts(tw,3)
}
function barkify(x,y,trl){
  for(let i=2;i<trl[0].length-1;i++)if(rand()<.2){const p=rand(),nx=trl[0][i][0]*(1-p)+trl[1][i][0]*p,ny=trl[0][i][1]*(1-p)+trl[1][i][1]*p;B.tex[0]+=`M${I(nx+x)} ${I(ny+y)}l${I(rand()*6-3)} ${I(6+rand()*8)}`}
  const tf=trl[0].concat(trl[1].slice().reverse()),rg=[[]]
  for(const q of tf){if(rand()<.5)rg.push([]);else rg[rg.length-1].push(q)}
  for(let i=0;i<rg.length;i++){if(rg[i].length<3)continue;rg[i]=div(rg[i],3);for(let j=0;j<rg[i].length;j++){rg[i][j][0]+=(Noise.noise(i,j*.1,1)-.5)*(15+5*randG());rg[i][j][1]+=(Noise.noise(i,j*.1,2)-.5)*(15+5*randG())}
    B.ln+=pts(rg[i].map(v=>[v[0]+x,v[1]+y]),4)}
}
function tree04(x,y,{hei=300,wid=6}={}){
  let trl=branch({hei,wid,ang:-Math.PI/2});barkify(x,y,trl);trl=trl[0].concat(trl[1].reverse())
  let tm=[]
  for(let i=0;i<trl.length;i++){
    if((i>=trl.length*.3&&i<=trl.length*.7&&rand()<.1)||i==trl.length/2-1){
      const ba=Math.PI*.2-Math.PI*1.4*(i>trl.length/2),br=branch({hei:hei*(rand()+1)*.3,wid:wid*.5,ang:ba});br[0].splice(0,1);br[1].splice(0,1)
      const fo=v=>[v[0]+trl[i][0],v[1]+trl[i][1]];barkify(x,y,[br[0].map(fo),br[1].map(fo)])
      for(let j=0;j<br[0].length;j++)if(rand()<.2||j==br[0].length-1)twig(br[0][j][0]+trl[i][0]+x,br[0][j][1]+trl[i][1]+y,1,{wid:hei/300,ang:ba>-Math.PI/2?ba:ba+Math.PI,sca:.5*hei/300,dir:ba>-Math.PI/2?1:-1})
      tm=tm.concat(br[0].concat(br[1].reverse()).map(fo))
    }else tm.push(trl[i])
  }
  pfill(tm,x,y);tm.splice(0,1);tm.splice(tm.length-1,1)
  B.dk+=strokePoly(T(tm,x,y),{wid:1.2,noi:.9,fun:()=>1})
}

// ---- mountain
const Mount={}
Mount.mountain=function(xo,yo,seed,{hei=100+rand()*400,wid=400+rand()*200,tex=140,thin=.5,veg=true,pagoda=false,houses=0}={}){
  B=mk()
  const h=hei*1.7,w=wid,reso=[10,50],pl=[];let hoff=0
  for(let j=0;j<reso[0];j++){hoff+=rand()*yo/100;pl.push([]);for(let i=0;i<reso[1];i++){const x=(i/reso[1]-.5)*Math.PI;let y=Math.cos(x)*Noise.noise(x+10,j*.15,seed);const p=1-j/reso[0];pl[j].push([x/Math.PI*w*p,-y*h*p+hoff])}}
  const veglist=(rule,fn)=>{for(let i=0;i<pl.length;i++)for(let j=0;j<pl[i].length;j++)if(rule(i,j)&&rand()<thin)fn(pl[i][j][0],pl[i][j][1])}
  veglist((i,j)=>{const ns=Noise.noise(j*.1,seed);return i==0&&ns*ns*ns<.1&&Math.abs(pl[i][j][1])/h>.2},(x,y)=>tree02(x+xo,y+yo-5,{clu:2,a:.4}))
  const off=p=>p.map(q=>[q[0]+xo,q[1]+yo])
  B.fill+=pts(off(pl[0].concat([[0,reso[0]*4]])),1)+'Z'
  B.edge+=strokePoly(off(pl[0].filter(q=>q[1]<-4)),{wid:3,noi:1})
  texture(pl,{xo,yo,tex})
  veglist((i,j)=>{const ns=Noise.noise(i*.1,j*.1,seed+2);return ns*ns*ns<.1&&Math.abs(pl[i][j][1])/h>.5},(x,y)=>tree02(x+xo,y+yo,{a:.45}))
  if(veg){
   veglist((i,j)=>{const ns=Noise.noise(i*.2,j*.05,seed);return j%2&&ns*ns*ns*ns<.012&&Math.abs(pl[i][j][1])/h<.3},(x,y)=>{let ht=(h+y)/h*70;ht=ht*.3+rand()*ht*.7;tree01(x+xo,y+yo,{hei:ht,wid:rand()*3+1})})
   veglist((i,j)=>{const ns=Noise.noise(i*.2,j*.05,seed);return(j==0||j==pl[i].length-1)&&ns*ns*ns*ns<.012},(x,y)=>{let ht=(h+y)/h*120;ht=ht*.5+rand()*ht*.5;const bc=rand()*.1;tree03(x+xo,y+yo,{hei:ht,ben:p=>p*bc})})
  }
  if(pagoda)arch03(pl[1][25][0]+xo,pl[1][25][1]+yo+4,{sto:5,wid:30+rand()*12})
  for(let k=0;k<houses;k++){const j=choice([2,47]),i=choice([2,3,4,5]);const q=pl[i][j];choice([0,1,2])==0?arch04(q[0]+xo,q[1]+yo,{sto:choice([1,2])}):arch02(q[0]+xo,q[1]+yo,{wid:normRand(36,56),sto:choice([1,2,2,3]),rot:rand(),sty:choice([1,2,3])})}
  for(let i=0;i<pl.length;i++)for(const j of [0,pl[i].length-1])if(i%2==0&&rand()<.12)rock(pl[i][j][0]+xo,pl[i][j][1]+yo,seed,{wid:20+rand()*20,hei:15+rand()*15,tex:10})
  return flush()
}
function flush(){
  const T=[.18,.3,.45],L=[.3,.45,.6]
  let s=`<path d="${B.fill+B.pf}" fill="var(--paper)"/>`
  s+=`<path d="${B.edge}" fill="var(--ink)" opacity=".5"/>`
  B.tex.forEach((d,i)=>{if(d)s+=`<path d="${d}" fill="none" stroke="var(--ink)" stroke-width="1" stroke-linecap="round" opacity="${T[i]}"/>`})
  if(B.l2)s+=`<path d="${B.l2}" fill="none" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>`
  if(B.ln)s+=`<path d="${B.ln}" fill="none" stroke="var(--ink)" stroke-width=".9" opacity=".55"/>`
  if(B.dk)s+=`<path d="${B.dk}" fill="var(--ink)" opacity=".6"/>`
  if(B.trunk)s+=`<path d="${B.trunk}" fill="none" stroke="var(--ink)" stroke-width="1.2" opacity=".5"/>`
  if(B.branch)s+=`<path d="${B.branch}" fill="none" stroke="var(--ink)" stroke-width=".8" opacity=".6"/>`
  B.leaf.forEach((d,i)=>{if(d)s+=`<path d="${d}" fill="var(--ink)" opacity="${L[i]}"/>`})
  return s
}
// ---- flat foreground mound with trees/rocks (simplified flatMount)
function flatMount(xo,yo,seed,{wid=700,hei=90,arch=0}={}){
  B=mk()
  const pl=[];let hoff=0
  for(let j=0;j<5;j++){hoff+=rand()*yo/100;pl.push([]);for(let i=0;i<50;i++){const x=(i/50-.5)*Math.PI;let y=(Math.cos(x*2)+1)*Noise.noise(x+10,j*.1,seed);const p=1-j/5*.6;pl[j].push([x/Math.PI*wid*p,Math.max(-y*hei*p,-hei*.55)+hoff])}}
  const off=p=>p.map(q=>[q[0]+xo,q[1]+yo])
  B.fill+=pts(off(pl[0].concat([[0,20]])),1)+'Z';B.edge+=strokePoly(off(pl[0].filter(q=>q[1]<-4)),{wid:3,noi:1})
  texture(pl,{xo,yo,tex:60,len:.2,dis:()=>rand()>.5?.1+.4*rand():.9-.4*rand()})
  const xmin=-wid*.35,xmax=wid*.35,gy=-hei*.5
  for(let j=0;j<3;j++)rock(xo+normRand(xmin,xmax),yo+gy+normRand(-4,10),seed*7+j,{wid:12+rand()*18,hei:10+rand()*14,tex:10})
  tree04(xo+xmin*.3,yo+gy+16,{hei:210+rand()*40,wid:5});tree04(xo+xmax*.5,yo+gy+18,{hei:150+rand()*40,wid:4})
  for(let k=0;k<2;k++)tree08(xo+normRand(xmin,xmax),yo+gy+normRand(0,14),{hei:50+rand()*35})
  if(arch)arch01(xo+arch,yo+gy+14,{wid:150,hei:70})
  for(let i=0;i<14;i++)tree02(xo+normRand(xmin,xmax),yo+normRand(gy-6,gy+6),{a:.5})
  return flush()
}
function water(xo,yo,{hei=2,len=800,clu=8}={}){
  let d='';let yk=0
  for(let i=0;i<clu;i++){const xk=(rand()-.5)*len/8;yk+=rand()*6;const lk=len/4+rand()*len/4;const pl=[];for(let j=-lk;j<lk;j+=8)pl.push([j+xk+xo,Math.sin(j*.2)*hei*Noise.noise(j*.1)-20+yk+yo]);d+=pts(pl,2)}
  return `<path d="${d}" fill="none" stroke="var(--ink)" stroke-width=".9" opacity=".35"/>`
}
// ---- compose
let out=''
out+=`<defs><linearGradient id="wg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--ink);stop-opacity:.17"/><stop offset="1" style="stop-color:var(--ink);stop-opacity:0"/></linearGradient><linearGradient id="lk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--paper);stop-opacity:0"/><stop offset=".2" style="stop-color:var(--paper);stop-opacity:1"/></linearGradient><radialGradient id="ms"><stop offset="0" style="stop-color:var(--paper);stop-opacity:1"/><stop offset="1" style="stop-color:var(--paper);stop-opacity:0"/></radialGradient></defs>`
// distant mountains (distMount): layered wash silhouettes
for(const [yo,hh,sd,op] of [[360,150,3,1],[420,120,8,.75]]){const p=[];for(let x=0;x<=1600;x+=10)p.push([x,yo-hh*Noise.noise(x*.005,sd)*Math.pow(Math.sin(Math.PI*x/1600),.5)]);out+=`<path d="${pts(p,1)}L1600 ${yo+260}L0 ${yo+260}Z" fill="url(#wg)" opacity="${op}"/>`}
const cfg=[
 [330,500,1.3,600,300,85,.32,true,1],[1190,480,4.7,620,330,85,.32,false,2],
 [-10,660,7.1,540,320,85,.28,false,1],[1610,670,9.9,580,340,85,.28,true,1],[790,640,12.2,440,130,50,.3,false,1],
 [330,780,15.3,480,120,40,.2,false,0],[1240,790,18.8,520,120,40,.2,false,1]]
cfg.sort((a,b)=>a[1]-b[1])
let k=0
for(const [x,y,sd,w,h,tx,th,pg,hs] of cfg){out+=Mount.mountain(x,y,sd,{wid:w,hei:h,tex:tx,thin:th,pagoda:pg,houses:hs});if(k==1)out+=`<rect x="0" y="${y-20}" width="1600" height="500" fill="url(#lk)" opacity=".6"/>`;k++}
out+=`<g class="m1"><ellipse cx="520" cy="560" rx="380" ry="20" fill="url(#ms)" opacity=".8"/><ellipse cx="1180" cy="600" rx="320" ry="18" fill="url(#ms)" opacity=".7"/></g>`
out+=water(800,720,{len:900,clu:9})
B=mk();boat01(700,745,{sca:1.15,len:110,fli:false});out+=`<g class="b">${flush()}</g>`;B=mk();boat01(1010,690,{sca:.8,len:100,fli:true});out+=`<g class="b">${flush()}</g>`
out+=flatMount(240,865,5.5,{wid:600,hei:100,arch:90})+flatMount(1360,870,9.1,{wid:600,hei:100})
out+=`<circle cx="1160" cy="170" r="46" fill="var(--sun)" opacity=".5"/>`
{let b='';for(let i=0;i<6;i++){const x=normRand(640,980),y=normRand(120,260);b+=`M${I(x)} ${I(y)}q5 -5 10 0q5 -5 10 0`}out+=`<path class="bd" d="${b}" fill="none" stroke="var(--ink)" stroke-width="1.2" opacity=".6"/>`}
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice"><style>
:root{--ink:#3b4238;--paper:#ece5cd;--sun:#c0463c;--a:.92}
@media (prefers-color-scheme: dark){:root{--ink:#b7c4a8;--paper:#272e33;--sun:#e67e80;--a:.72}}
.m1{animation:d1 70s ease-in-out infinite alternate}.b{animation:bob 6s ease-in-out infinite alternate}.bd{animation:d1 50s linear infinite alternate}
@keyframes d1{to{transform:translateX(-60px)}}@keyframes bob{to{transform:translateY(3px)}}
</style><g style="opacity:var(--a)">${out}</g></svg>`
fs.writeFileSync(process.argv[2],`// Generated by a compact port of Shan Shui Inf's mountain/texture/tree algorithms (seeded).\nexport const SCENE = ${JSON.stringify(svg)}\n`)
console.log(svg.length)
