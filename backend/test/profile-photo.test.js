import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import express from 'express';
import { accountHandlers } from '../src/controllers/AccountController.js';
import { profilePhoto } from '../src/middleware/profilePhoto.js';
import { MAX_PHOTO_SIZE } from '../src/models/profilePhoto.js';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=', 'base64');

test('multipart uploads reach SQL as bytes and reads return displayable images', async t => {
    const writes = [];
    const pool = {
        async execute(sql) {
            if (sql.includes('artista_instrumento')) return [[]];
            return [[{ id_artista: 1, nome: 'Ana', foto_perfil: png }]];
        },
        async getConnection() {
            return {
                async beginTransaction() {}, async commit() {}, async rollback() {}, release() {},
                async execute(sql, values) {
                    if (sql.startsWith('SELECT')) return [[{ id_artista: 1 }]];
                    writes.push({ sql, values });
                    return [{ insertId: 1 }];
                },
            };
        },
    };
    const app = express();
    app.use(express.json());
    for (const type of ['Artista', 'Banda', 'Estabelecimento']) {
        const handlers = accountHandlers(type, pool);
        app.post(`/${type}`, profilePhoto, handlers.create);
        app.patch(`/${type}/:id`, profilePhoto, handlers.update);
        app.get(`/${type}/:id`, handlers.show);
    }
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}`;
    const common = { nome: 'Ana', senha: 'secret', email: 'ana@example.com' };
    const profiles = {
        Artista: { ...common, instrumentos: '[1,2]' },
        Banda: {
            ...common, nome_user: 'Ana', email_login: 'band@example.com', cep: '01000-000',
            cidade: 'Franca', estado: 'SP', numero_artistas: '2', ano_formacao: '2020',
            nome_contato: 'Ana', funcao: 'Vocalista', telefone_contato: '11999999999',
            email_contato: 'band@example.com', disponibilidade: 'Todo o Brasil',
            possui_instrumentos: 'false', estilos_musicais: '[1]',
        },
        Estabelecimento: {
            nome_user: 'Ana', email_login: 'venue@example.com', senha: 'secret',
            nome_estabelecimento: 'Venue', tipo_estabelecimento: 'Bar', estado: 'SP', cidade: 'Franca',
            capacidade: '100', estruturas: '[1]',
        },
    };
    for (const [type, fields] of Object.entries(profiles)) {
        const form = new FormData();
        for (const [key, value] of Object.entries(fields)) form.set(key, value);
        form.set('foto_perfil', new Blob([png], { type: 'image/png' }), 'photo.png');
        const res = await fetch(`${base}/${type}`, { method: 'POST', body: form });
        assert.equal(res.status, 201, await res.text());
        assert.ok(writes.some(call => call.sql.startsWith(`INSERT INTO ${type} `) && call.values.some(value => Buffer.isBuffer(value) && value.equals(png))));
    }
    for (const type of Object.keys(profiles)) {
        const form = new FormData();
        form.set('foto_perfil', new Blob([png]), 'photo.png');
        assert.equal((await fetch(`${base}/${type}/1`, { method: 'PATCH', body: form })).status, 200);
        assert.ok(writes.some(call => call.sql.startsWith(`UPDATE ${type} `) && call.values[0].equals(png)));
    }
    const read = await fetch(`${base}/Artista/1`);
    assert.equal((await read.json()).foto_perfil, `data:image/png;base64,${png.toString('base64')}`);

    for (const [bytes, field, expected] of [
        [Buffer.from('not an image'), 'foto_perfil', 400],
        [Buffer.alloc(MAX_PHOTO_SIZE + 1), 'foto_perfil', 413],
        [png, 'unexpected_file', 400],
    ]) {
        const before = writes.length;
        const form = new FormData();
        form.set(field, new Blob([bytes], { type: 'image/png' }), 'photo.png');
        assert.equal((await fetch(`${base}/Artista/1`, { method: 'PATCH', body: form })).status, expected);
        assert.equal(writes.length, before);
    }
    const res = await fetch(`${base}/Artista/1`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ foto_perfil: null }),
    });
    assert.equal(res.status, 200);
    assert.deepEqual(writes.at(-1).values, [null, 1]);
    const invalid = await fetch(`${base}/Artista/1`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ foto_perfil: 'https://example.com/photo.png' }),
    });
    assert.equal(invalid.status, 400);
});
