const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { criarApp } = require('./app');
test('fluxo integrado, prioridade, concorrência, retry e persistência', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nassau-test-'));
  const arquivo = path.join(dir, 'senhas.json');
  const server = criarApp(arquivo).listen(0);
  await new Promise(r => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const call = async (rota, method = 'GET', body) => {
    const res = await fetch(base + rota, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: res.status, data: await res.json() };
  };
  try {
    assert.deepEqual((await call('/senhas')).data, []);
    assert.equal((await call('/login','POST',{email:'x',senha:'x'})).status,401);
    for (const tipo of ['SG', 'SE', 'SP', 'SP']) assert.equal((await call('/senhas','POST',{tipo})).status,201);
    const [a,b] = await Promise.all(['Guichê 01','Guichê 02'].map(guiche => call('/atendimento/proxima','POST',{guiche})));
    assert.notEqual(a.data.id,b.data.id);
    assert.deepEqual([a.data.tipo,b.data.tipo],['SP','SE']);
    assert.equal((await call('/atendimento/proxima','POST',{guiche:'Guichê 01'})).data.id,a.data.id);
    const rota = '/senhas/' + a.data.id;
    const change = (acao, guiche = 'Guichê 01') => call(rota,'PATCH',{acao,guiche});
    assert.equal((await change('finalizar')).status,409);
    assert.equal((await change('iniciar','Guichê 02')).status,409);
    assert.equal((await change('ausente')).status,409);
    assert.equal((await change('repetir')).data.tentativasChamada,2);
    assert.equal((await change('repetir')).data.tentativasChamada,2);
    assert.equal((await change('ausente')).data.estado,'NAO_COMPARECEU');
    const proxima = (await call('/atendimento/proxima','POST',{guiche:'Guichê 01'})).data;
    assert.equal(proxima.tipo,'SP');
    const transition = acao => call('/senhas/'+proxima.id,'PATCH',{acao,guiche:'Guichê 01'});
    assert.equal((await transition('iniciar')).data.estado,'EM_ATENDIMENTO');
    assert.equal((await transition('finalizar')).data.estado,'ATENDIDA');
    assert.equal((await transition('finalizar')).data.estado,'ATENDIDA');
    assert.equal((await transition('repetir')).status,409);
    const restante = (await call('/atendimento/proxima','POST',{guiche:'Guichê 03'})).data;
    assert.equal(restante.tipo,'SG');
    assert.equal((await call('/atendimento/proxima','POST',{guiche:'Guichê 04'})).status,409);
    assert.equal(JSON.parse(fs.readFileSync(arquivo)).length,4);
    const outro = criarApp(arquivo).listen(0);
    await new Promise(r => outro.once('listening',r));
    try { const lista = await (await fetch(`http://127.0.0.1:${outro.address().port}/api/senhas`)).json(); assert.equal(lista.find(s => s.id === proxima.id).estado,'ATENDIDA'); }
    finally { await new Promise(r => outro.close(r)); }
  } finally { await new Promise(r => server.close(r)); fs.rmSync(dir,{recursive:true,force:true}); }
});
