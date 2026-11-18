import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import mysql from 'mysql2/promise';
import configuredPool from '../src/database/connect.js';
import Account from '../src/models/Account.js';
import { verifyPassword } from '../src/models/password.js';
import { Session } from '../src/models/Session.js';
import { randomUUID } from 'node:crypto';

// Explicit opt-in: creates and removes only a uniquely named, disposable test DB.
test('MySQL init schema and CRUD enforce relationships', {
    skip: process.env.RUN_MYSQL_TESTS !== '1',
}, async () => {
    const database = `sonoraware_test_${process.pid}_${Date.now()}`;
    assert.match(database, /^sonoraware_test_\d+_\d+$/);
    const { host, user, password, port } = configuredPool.pool.config.connectionConfig;
    const admin = await mysql.createConnection({ host, user, password, port, multipleStatements: true });
    let pool;
    let created = false;
    try {
        await admin.query(`CREATE DATABASE ${database}`);
        created = true;
        const init = await readFile(new URL('../src/database/init.sql', import.meta.url), 'utf8');
        await admin.query(init.replaceAll('sonoraware', database));
        await admin.query("INSERT INTO Artista (nome, email, senha) VALUES ('Existing artist', 'old@example.com', 'test-fixture')");
        await admin.query("INSERT INTO Instrumento (nome) VALUES ('Guitar')");
        await admin.query('INSERT INTO artista_instrumento (id_artista, id_instrumento) VALUES (1, 1)');

        pool = mysql.createPool({ host, user, password, port, database });
        const artists = new Account(pool, 'Artista');
        const bands = new Account(pool, 'Banda');
        assert.deepEqual((await artists.find(1)).instrumentos, [1]);
        assert.equal((await artists.find(1)).email, 'old@example.com');
        const [login] = await pool.query('SELECT tipo_usuario FROM View_Login WHERE id_usuario = 1');
        assert.equal(login[0].tipo_usuario, 'Artista');
        await pool.query(`INSERT INTO Estabelecimento
            (nome_user, email_login, senha, nome_estabelecimento, tipo_estabelecimento, estado, cidade)
            VALUES ('Venue', 'venue@example.com', 'legacy', 'Venue', 'Bar', 'SP', 'São Paulo')`);
        await pool.query(`INSERT INTO Solicitacao (data, horario, id_estabelecimento, id_artista)
            VALUES ('2026-11-09', '20:00:00', 1, 1)`);
        await assert.rejects(artists.delete(1), { code: 'ER_ROW_IS_REFERENCED_2' });

        const createdArtist = await artists.create({ nome: 'Ana', email: 'ana@example.com', senha: 'secret', instrumentos: [1] });
        const id = createdArtist.id_usuario;
        const sessions = new Session(pool);
        const claims = { jti: randomUUID(), sub: String(id), tipo_usuario: 'Artista', exp: Math.floor(Date.now() / 1000) + 3600 };
        await sessions.create(claims);
        assert.equal(await sessions.isActive(claims), true);
        assert.equal(await new Session(pool).isActive(claims), true);
        assert.equal(await sessions.isActive({ ...claims, tipo_usuario: 'Banda' }), false);
        await sessions.remove(claims.jti);
        assert.equal(await sessions.isActive(claims), false);
        await sessions.create(claims);
        assert.ok(!(await artists.find(id)).senha);
        await artists.update(id, { nome: 'Updated', instrumentos: [], senha: 'new-secret' });
        assert.equal((await artists.find(id)).nome, 'Updated');
        assert.deepEqual((await artists.find(id)).instrumentos, []);
        const [[stored]] = await pool.query('SELECT senha FROM Artista WHERE id_artista = ?', [id]);
        assert.equal(await verifyPassword('new-secret', stored.senha), true);
        await assert.rejects(artists.update(id, { nome: 'Must roll back', instrumentos: [999999] }), { code: 'ER_NO_REFERENCED_ROW_2' });
        assert.equal((await artists.find(id)).nome, 'Updated');
        await assert.rejects(artists.create({ nome: 'Duplicate', email: 'ana@example.com', senha: 'secret' }), { code: 'ER_DUP_ENTRY' });
        await assert.rejects(artists.update(999999, { nome: 'Missing' }), { status: 404 });

        const band = await bands.create({
            nome_user: 'Ana', email_login: 'band@example.com', senha: 'secret', nome: 'Band',
            cep: '01000-000', cidade: 'São Paulo', estado: 'SP', numero_artistas: 2,
            ano_formacao: 2020, nome_contato: 'Ana', funcao: 'Vocalista',
            telefone_contato: '11999999999', email_contato: 'band@example.com',
            disponibilidade: 'Todo o Brasil', estilos_musicais: [1, 3],
        });
        const bandId = band.id_usuario;
        await bands.update(bandId, { nome: 'New band', estilos_musicais: [2] });
        assert.deepEqual((await bands.find(bandId)).estilos_musicais, [2]);
        assert.equal((await bands.find(bandId)).numero_artistas, 2);
        await pool.query('INSERT INTO artista_banda (id_artista, id_banda) VALUES (?, ?)', [id, bandId]);
        await bands.delete(bandId);
        const [[membership]] = await pool.query('SELECT COUNT(*) AS total FROM artista_banda WHERE id_artista = ?', [id]);
        assert.equal(membership.total, 0);
        await artists.delete(id);
        assert.equal(await sessions.isActive(claims), false);
        await assert.rejects(artists.find(id), { status: 404 });
        assert.equal((await artists.list()).length, 1);
        assert.equal((await bands.list()).length, 0);

        const [schemaNames] = await pool.query(
            `SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ?
             UNION ALL SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = ?
             UNION ALL SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = ?`,
            [database, database, database],
        );
        assert.ok(schemaNames.some(({ name }) => name === 'id_artista'));
        assert.ok(schemaNames.some(({ name }) => name === 'numero_artistas'));
    } finally {
        if (pool) await pool.end();
        if (created) await admin.query(`DROP DATABASE ${database}`);
        await admin.end();
    }
});
