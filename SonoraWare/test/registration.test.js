import test from 'node:test';
import assert from 'node:assert/strict';
import { registerUser } from '../src/models/UserRegistration.js';
import { verifyPassword } from '../src/models/password.js';

function database(failRelationship = false) {
    const calls = [];
    const connection = {
        async beginTransaction() { calls.push('begin'); },
        async execute(sql, values) {
            calls.push({ sql, values });
            if (failRelationship && sql.includes('artista_instrumento')) {
                throw Object.assign(new Error('Foreign key failure'), { code: 'ER_NO_REFERENCED_ROW_2' });
            }
            return [{ insertId: 42 }];
        },
        async commit() { calls.push('commit'); },
        async rollback() { calls.push('rollback'); },
        release() { calls.push('release'); },
    };
    return { calls, async getConnection() { calls.push('acquire'); return connection; } };
}

test('artist registration hashes the password, deduplicates IDs, and commits', async () => {
    const pool = database();
    const result = await registerUser(pool, 'Artista', {
        nome: 'Ana', email: 'ana@example.com', senha: 'secret', instrumentos: [1, 1, 2],
    });
    assert.deepEqual(result, { id_usuario: 42, tipo_usuario: 'Artista' });
    assert.equal(await verifyPassword('secret', pool.calls[2].values[2]), true);
    assert.equal(await verifyPassword('wrong', pool.calls[2].values[2]), false);
    assert.deepEqual(pool.calls[3].values, [42, 1, 42, 2]);
    assert.deepEqual(pool.calls.slice(-2), ['commit', 'release']);
});

test('relationship failure rolls back the account and releases its connection', async () => {
    const pool = database(true);
    await assert.rejects(registerUser(pool, 'Artista', {
        nome: 'Ana', email: 'ana@example.com', senha: 'secret', instrumentos: [999],
    }), { code: 'ER_NO_REFERENCED_ROW_2' });
    assert.deepEqual(pool.calls.slice(-2), ['rollback', 'release']);
    assert.ok(!pool.calls.includes('commit'));
});

test('invalid input fails before obtaining a connection', async () => {
    for (const [type, body] of [
        ['invalid', {}], ['Artista', {}],
        ['Artista', { nome: 'Ana', email: 'a@b.com', senha: 'secret', instrumentos: ['1'] }],
    ]) {
        const pool = database();
        await assert.rejects(registerUser(pool, type, body), { status: 400 });
        assert.deepEqual(pool.calls, []);
    }
});

test('venue registration inserts every selected relationship', async () => {
    const pool = database();
    await registerUser(pool, 'Estabelecimento', {
        nome_user: 'Ana', email_login: 'a@b.com', senha: 'secret',
        nome_estabelecimento: 'Venue', tipo_estabelecimento: 'Bar', estado: 'SP', cidade: 'São Paulo',
        estruturas: [1], acessibilidades: [2], tipos_evento: [3],
    });
    const inserts = pool.calls.filter(call => typeof call === 'object');
    assert.equal(inserts.length, 4);
    assert.match(inserts[1].sql, /Estabelecimento_Estrutura/);
    assert.match(inserts[2].sql, /Estabelecimento_Acessibilidade/);
    assert.match(inserts[3].sql, /Estabelecimento_Tipo_Evento/);
});

test('band registration inserts musical styles and preserves database defaults', async () => {
    const pool = database();
    await registerUser(pool, 'Banda', {
        nome_user: 'Ana', email_login: 'band@example.com', senha: 'secret', nome: 'Band',
        cep: '01000-000', cidade: 'São Paulo', estado: 'SP', numero_artistas: 2,
        ano_formacao: 2020, nome_contato: 'Ana', funcao: 'Vocalista',
        telefone_contato: '11999999999', email_contato: 'band@example.com',
        disponibilidade: 'Todo o Brasil', estilos_musicais: [1, 3],
    });
    assert.ok(!pool.calls[2].sql.includes('possui_instrumentos'));
    assert.match(pool.calls[3].sql, /Banda_Estilo_Musical/);
    assert.deepEqual(pool.calls[3].values, [42, 1, 42, 3]);
});
