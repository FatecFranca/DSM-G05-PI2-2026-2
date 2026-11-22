import test from 'node:test';
import assert from 'node:assert/strict';
import Account from '../src/models/Account.js';
import { accountHandlers } from '../src/controllers/AccountController.js';

test('reads select public columns and return relationship IDs', async () => {
    const queries = [];
    const model = new Account({ async execute(sql) {
        queries.push(sql);
        return sql.includes('artista_instrumento')
            ? [[{ id_instrumento: 3 }]] : [[{ id_artista: 1, nome: 'Ana' }]];
    } }, 'Artista');
    assert.deepEqual(await model.find('1'), { id_artista: 1, nome: 'Ana', instrumentos: [3] });
    assert.ok(queries.every(sql => !sql.includes('senha')));
});

test('invalid IDs and empty updates never access the database', async () => {
    const model = new Account({ execute() { assert.fail('Unexpected database access'); } }, 'Banda');
    for (const id of ['0', '-1', '1 OR 1=1', '1.5', '9007199254740992']) {
        await assert.rejects(model.find(id), { status: 400 });
        await assert.rejects(model.delete(id), { status: 400 });
    }
    await assert.rejects(model.update('1', {}), { status: 400 });
    await assert.rejects(model.update('1', { numero_artistas: null }), { status: 400 });
    await assert.rejects(model.update('1', { estilos_musicais: null }), { status: 400 });
});

function response() {
    return {
        status(code) { this.code = code; return this; },
        json(body) { this.body = body; return this; },
        end() { this.ended = true; return this; },
    };
}

test('controllers map not-found, duplicates, restrictions and failures to HTTP statuses', async () => {
    for (const [code, expected] of [['ER_DUP_ENTRY', 409], ['ER_ROW_IS_REFERENCED_2', 409], ['ER_NO_REFERENCED_ROW_2', 400]]) {
        const handlers = accountHandlers('Artista', {
            async execute() { throw Object.assign(new Error('Database error'), { code }); },
        });
        const res = response();
        await handlers.delete({ params: { id: '1' } }, res);
        assert.equal(res.code, expected);
    }
    const handlers = accountHandlers('Banda', { async execute() { return [{ affectedRows: 0 }]; } });
    const res = response();
    await handlers.delete({ params: { id: '1' } }, res);
    assert.equal(res.code, 404);
});

test('delete returns 204 with no response body', async () => {
    const handlers = accountHandlers('Banda', { async execute() { return [{ affectedRows: 1 }]; } });
    const res = response();
    await handlers.delete({ params: { id: '1' } }, res);
    assert.equal(res.code, 204);
    assert.equal(res.ended, true);
    assert.equal(res.body, undefined);
});
