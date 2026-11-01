const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const DATA=JSON.parse(html.match(/^const DATA=(.+);\r?$/m)[1]);
const helpers=html.slice(html.indexOf("const B64 ="),html.indexOf('function save(){'));
function setup(){
  const ctx=vm.createContext({DATA,OPEN:DATA.open,TEAMS:DATA.teams,URL,URLSearchParams,MAXSC:15,NT:20,
    VAGAS:{d:5,p:1,s:6},VAGAS_DEF:{d:4,p:1,s:6},focus:0,metric:'tit',level:'leve',
    MET:{z4:{},tit:{},lib:{},sula:{}},LEVELS:{leve:100000,media:500000,pesada:1000000},
    location:{hash:''},choice:new Int8Array(DATA.open.length),scH:new Int8Array(DATA.open.length).fill(-1),scA:new Int8Array(DATA.open.length).fill(-1)});
  vm.runInContext(html.match(/^function validVagas\(v\).+$/m)[0]+'\n'+html.match(/^function vagasDefault\(\).+$/m)[0]+'\n'+helpers+'\nthis.api={curCode,scenarioLink,readSharedScenario,useSharedScenario};',ctx);
  return ctx;
}
test('link restaura placares exatos, resultados, vagas, time, objetivo e precisão',()=>{
  const source=setup();source.choice[1]=1;source.scH[1]=2;source.scA[1]=1;source.choice[8]=3;
  const code=source.api.curCode(),link=source.api.scenarioLink(code,'INT','lib','media');
  assert.equal(new URL(link).origin,'https://boladecristal.app.br');
  const receiver=setup();receiver.location.hash=new URL(link).hash;
  const shared=receiver.api.readSharedScenario();assert.equal(receiver.api.useSharedScenario(shared),true);
  assert.equal(receiver.api.curCode(),code);
  assert.equal(receiver.scH[1],2);assert.equal(receiver.scA[1],1);assert.equal(receiver.choice[8],3);
  assert.equal(receiver.VAGAS.d,5);assert.equal(receiver.VAGAS.p,1);assert.equal(receiver.VAGAS.s,6);
  assert.equal(receiver.TEAMS[receiver.focus].c,'INT');assert.equal(receiver.metric,'lib');assert.equal(receiver.level,'media');
});
test('link inválido não altera o cenário anterior',()=>{
  const ctx=setup();ctx.choice[0]=2;ctx.location.hash='#simulador?cenario=INVALIDO&time=INT';
  const shared=ctx.api.readSharedScenario();assert.equal(shared.invalid,true);
  assert.equal(ctx.api.useSharedScenario(shared),false);assert.equal(ctx.choice[0],2);
});
test('valores desconhecidos de objetivo e precisão não acessam propriedades herdadas',()=>{
  const ctx=setup();ctx.location.hash='#simulador?cenario=Z4F-&time=INT&objetivo=constructor&precisao=__proto__';
  const shared=ctx.api.readSharedScenario();assert.equal(shared.metric,'z4');assert.equal(shared.level,'leve');
});
test('teste local conserva o mesmo cenário do link público e não interfere nas abas de documentação',()=>{
  const ctx=setup();const code=ctx.api.curCode();
  const publicLink=ctx.api.scenarioLink(code,'INT','z4','leve');
  const localLink=ctx.api.scenarioLink(code,'INT','z4','leve','http://127.0.0.1:4173');
  assert.equal(new URL(publicLink).hash,new URL(localLink).hash);
  ctx.location.hash='#metodologia';assert.equal(ctx.api.readSharedScenario(),null);
  ctx.location.hash='#simulador?cenario='+'A'.repeat(5000);assert.equal(ctx.api.readSharedScenario().invalid,true);
});
