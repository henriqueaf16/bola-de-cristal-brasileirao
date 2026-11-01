const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(process.env.ENGINE_SOURCE || path.join(root, 'index.html'), 'utf8');
const script = html.match(/\(function \(root\) \{[\s\S]+?\}\)\(this\);/)[0];
const ctx = { module: { exports: {} } };
vm.runInNewContext(script.replace('var api = {', 'var api = { _rankTable:rankTable, _sampleCell:sampleCell, _sampleAt:sampleAt,'), ctx);
const E = ctx.module.exports;
const DATA = JSON.parse(html.match(/^const DATA=(.+);\r?$/m)[1]);
const zeros = () => Array(20).fill(0);
const base = () => ({pts:zeros(), wins:zeros(), gd:zeros(), gf:zeros()});
function fresh(lh, la) {
  const theta = Array(42).fill(0);
  theta[0] = Math.log(la); theta[1] = Math.log(lh / la);
  return {theta, L:Array(42*42).fill(0), rho:0};
}
const sum = x => Array.from(x).reduce((a,b)=>a+b,0);

test('todos os scripts inline são JavaScript válido', () => {
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (/src=|application\/ld\+json/.test(match[1])) continue;
    new vm.Script(match[2]);
  }
});

test('classificação respeita vitórias antes do saldo, mesmo com placares extremos', () => {
  const b = base(); b.pts[0]=b.pts[1]=50; b.wins[0]=10; b.wins[1]=9;
  b.gd[0]=-570; b.gd[1]=570; b.gf[0]=20; b.gf[1]=570;
  const order=zeros(), key=zeros(); E._rankTable(b.pts,b.wins,b.gd,b.gf,order,key);
  assert.equal(order[0],0);
  const r = E.simulate(b,[],{n:1});
  assert.equal(r.m.tit.prob[0],1);
});

test('empates completos dividem corretamente as posições e as vagas', () => {
  const r=E.simulate(base(),[],{n:1});
  for (const [zone,count] of [['tit',1],['lib',5],['libd',4],['sula',6],['z4',4]]) {
    assert.ok(Math.abs(sum(r.m[zone].prob)-count)<1e-12);
    assert.ok(Math.abs(r.m[zone].prob[0]-count/20)<1e-12);
  }
  for(let t=0;t<20;t++) assert.ok(Math.abs(sum(r.pos.slice(t*20,t*20+20))-1)<1e-12);
});

test('inversão da CDF não sorteia células de massa zero nem na fronteira', () => {
  const cdf = Array(121).fill(1); cdf[0]=0; cdf[1]=0.5;
  assert.equal(E._sampleCell(cdf,0),1);
  assert.equal(E._sampleCell(cdf,0.5),2);
  assert.equal(E._sampleAt(cdf,0,0),1);
});

test('sorteio fresh coincide com a Poisson truncada da grade, sem concentrar a cauda em dez', () => {
  const grid=E.matchGrid(8,0.01,0), n=35000;
  const r=E.simulate(base(),[{h:0,a:1,grid}],{n,seed:132,fresh:fresh(8,0.01)});
  let expected=0;
  for(let x=0;x<=10;x++) for(let y=0;y<=10;y++) expected+=(x-y)*grid.P[x*11+y];
  assert.ok(Math.abs(r.gdMean[0]-expected)<0.06, 'saldo médio '+r.gdMean[0]+' versus '+expected);
});

test('fallback de resultado raro usa a força do campeonato, não a grade média', () => {
  const grid=E.matchGrid(0.02,8,0), wrong=E.matchGrid(8,0.02,0);
  let prob=0, expected=0;
  for(let x=0;x<=10;x++) for(let y=0;y<x;y++){prob+=grid.P[x*11+y];expected+=(x-y)*grid.P[x*11+y];}
  expected/=prob;
  const r=E.simulate(base(),[{h:0,a:1,fix:1,grid:wrong}],{n:2500,seed:88,fresh:fresh(0.02,8)});
  assert.ok(Math.abs(r.gdMean[0]-expected)<0.08);
  assert.equal(r.ptsMean[0],3);
});

test('fallback do modo de universos também preserva a distribuição condicional do universo', () => {
  const grid=E.matchGrid(0.02,8,0), wrong=E.matchGrid(8,0.02,0);
  const r=E.simulate(base(),[{h:0,a:1,fix:1,grid:wrong}],{n:2500,seed:88,uni:{K:1,G:1,cdfU:grid.cdf}});
  assert.ok(r.gdMean[0]<1.15);
  assert.equal(r.ptsMean[0],3);
});

test('placar exato afeta pontos, vitórias, saldo e gols uma única vez', () => {
  const r=E.simulate(base(),[{h:0,a:1,gh:15,ga:0,fix:1}],{n:20});
  assert.equal(r.ptsMean[0],3); assert.equal(r.ptsMean[1],0);
  assert.equal(r.gdMean[0],15); assert.equal(r.gdMean[1],-15);
  assert.equal(r.m.tit.prob[0],1);
});

test('base real tem 380 confrontos únicos e tabela reconstruída coerente', () => {
  assert.equal(DATA.played.length+DATA.open.length,380);
  const pairs=new Set(DATA.played.map(g=>g[2]+'-'+g[3]));
  DATA.open.forEach(g=>{ assert.ok(!pairs.has(g.h+'-'+g.a)); pairs.add(g.h+'-'+g.a); });
  assert.equal(pairs.size,380);
  assert.equal(DATA.played.filter(g=>g[2]===15||g[3]===15).length,33);
});

test('gols esperados exibidos integram os mesmos parâmetros sorteados das probabilidades', () => {
  const games=DATA.played.map(g=>({h:g[2],a:g[3],gh:g[4],ga:g[5]}));
  const ratings=E.fitRatings(games,{sigma:0.2});
  const universe=E.buildUniverses(ratings,[[0,1]],1,777), point=E.expectedGoals(ratings,0,1);
  const rng=E.mulberry32(777), z=Array(42).fill(0), theta=Array(42).fill(0), L=E.freshPack(ratings).L;
  for(let i=0;i<42;i++){let u=0;while(u===0)u=rng();z[i]=Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*rng());}
  for(let i=0;i<42;i++){theta[i]=ratings.theta[i];for(let j=0;j<=i;j++)theta[i]+=L[i*42+j]*z[j];}
  const lh=Math.exp(theta[0]+theta[1]+theta[2]-theta[23]);
  const la=Math.exp(theta[0]+theta[3]-theta[22]);
  assert.ok(Math.abs(universe.grids[0].lh-lh)<1e-10);
  assert.ok(Math.abs(universe.grids[0].la-la)<1e-10);
  assert.ok(Math.abs(lh-point[0])>1e-4);
});

test('modelo na base real conserva vagas, posições e reprodutibilidade incremental', () => {
  const games=DATA.played.map(g=>({h:g[2],a:g[3],gh:g[4],ga:g[5],day:Date.UTC(2026,+g[1].slice(0,2)-1,+g[1].slice(2))/864e5}));
  const prior=E.seasonPrior(DATA.prev,DATA.teams.map(t=>t.n),DATA.cfg.k,DATA.releg);
  const ratings=E.fitRatings(games,{...prior,sigma:DATA.cfg.sigma,xi:DATA.cfg.xi,dc:DATA.cfg.dc});
  const b=base();
  games.forEach(g=>{b.gf[g.h]+=g.gh;b.gf[g.a]+=g.ga;b.gd[g.h]+=g.gh-g.ga;b.gd[g.a]+=g.ga-g.gh;
    if(g.gh>g.ga){b.pts[g.h]+=3;b.wins[g.h]++;}else if(g.gh<g.ga){b.pts[g.a]+=3;b.wins[g.a]++;}else{b.pts[g.h]++;b.pts[g.a]++;}});
  const open=DATA.open.map(g=>({...g,grid:E.pointGrids(ratings,[[g.h,g.a]])[0]}));
  const opts={n:3000,seed:20261101,fresh:E.freshPack(ratings)};
  const one=E.simulate(b,open,opts), incremental=E.createSim(b,open,opts);
  incremental.run(1000); incremental.run(2000); const two=incremental.result();
  assert.deepEqual(Array.from(one.pos),Array.from(two.pos));
  for(const [zone,count] of [['tit',1],['lib',5],['libd',4],['sula',6],['z4',4]]) assert.ok(Math.abs(sum(one.m[zone].prob)-count)<1e-10);
  for(let t=0;t<20;t++) assert.ok(Math.abs(sum(one.pos.slice(t*20,t*20+20))-1)<1e-10);
});
