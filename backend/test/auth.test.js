import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import pool from '../src/database/connect.js';
import sessions from '../src/models/Session.js';
import { hashPassword } from '../src/models/password.js';
import { getJwtSecret, issueToken } from '../src/auth/tokens.js';

test('JWT login, route authorization, and logout over HTTP', async t => {
    process.env.JWT_SECRET = randomBytes(48).toString('hex');
    const secret = process.env.JWT_SECRET;
    const passwordHash = await hashPassword('correct-password');
    const active = new Map();
    t.mock.method(pool, 'query', async () => [[{
        id_usuario: 1, email: 'ana@example.com', senha: passwordHash, tipo_usuario: 'Artista',
    }]]);
    t.mock.method(sessions, 'create', async claims => { active.set(claims.jti, claims); });
    t.mock.method(sessions, 'isActive', async claims => active.has(claims.jti));
    t.mock.method(sessions, 'remove', async id => { active.delete(id); });
    t.mock.method(pool, 'execute', async sql => {
        if (sql.startsWith('SELECT id_artista')) return [[{ id_artista: 1, nome: 'Ana' }]];
        throw new Error('Unexpected database access');
    });
    t.mock.method(pool, 'getConnection', async () => ({
        async beginTransaction() {},
        async execute(sql) { return sql.startsWith('SELECT') ? [[{ id_artista: 1 }]] : [{ affectedRows: 1 }]; },
        async commit() {}, async rollback() {}, release() {},
    }));

    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const base = `http://127.0.0.1:${server.address().port}`;
    async function request(method, path, body, token) {
        const headers = {};
        if (token) headers.Authorization = `Bearer ${token}`;
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        return fetch(base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    }
    let token;
    try {
        await t.test('signup stays public, while reads, edits, deletion and logout require a token', async () => {
            for (const path of ['/signup/artists', '/signup/bands', '/signup/concert-venues', '/artists', '/bands']) {
                assert.equal((await request('POST', path, {})).status, 400);
            }
            for (const [method, path] of [
                ['GET', '/artists'], ['GET', '/artists/1'], ['GET', '/bands'], ['GET', '/bands/1'],
                ['PATCH', '/artists/1'], ['DELETE', '/artists/1'],
                ['PATCH', '/bands/1'], ['DELETE', '/bands/1'], ['POST', '/logout'],
            ]) assert.equal((await request(method, path)).status, 401);
        });
        await t.test('invalid credentials do not create a session', async () => {
            assert.equal((await request('POST', '/login', { email: 'ana@example.com', password: 'wrong' })).status, 401);
            assert.equal(active.size, 0);
        });
        await t.test('login issues a one-hour JWT without exposing the password hash', async () => {
            const res = await request('POST', '/login', { email: 'ana@example.com', password: 'correct-password' });
            assert.equal(res.status, 200);
            assert.equal(res.headers.get('cache-control'), 'no-store');
            const body = await res.json();
            token = body.token;
            assert.equal(body.user.senha, undefined);
            const claims = jwt.verify(token, secret, { algorithms: ['HS256'] });
            assert.equal(claims.sub, '1');
            assert.equal(claims.tipo_usuario, 'Artista');
            assert.equal(claims.exp - claims.iat, 3600);
            assert.ok(active.has(claims.jti));
        });
        await t.test('authenticated users can read and update their own account', async () => {
            assert.equal((await request('GET', '/artists', undefined, token)).status, 200);
            const res = await request('PATCH', '/artists/1', { nome: 'Updated' }, token);
            assert.equal(res.status, 200);
            assert.equal((await res.json()).user.id_usuario, 1);
        });
        await t.test('ownership checks reject other IDs and account types, even with matching IDs', async () => {
            for (const method of ['PATCH', 'DELETE']) {
                assert.equal((await request(method, '/artists/2', {}, token)).status, 403);
                assert.equal((await request(method, '/bands/1', {}, token)).status, 403);
            }
        });
        await t.test('expired, tampered, wrong-algorithm and invalid-claim tokens fail verification', async () => {
            const payload = { tipo_usuario: 'Artista' };
            const options = { subject: '1', jwtid: 'test-session', issuer: 'sonoraware', audience: 'sonoraware-api', expiresIn: '1h' };
            const invalid = [
                'not-a-token',
                jwt.sign(payload, randomBytes(48), options),
                jwt.sign(payload, secret, { ...options, expiresIn: -1 }),
                jwt.sign(payload, secret, { ...options, algorithm: 'HS384' }),
                jwt.sign(payload, secret, { ...options, issuer: 'another-app' }),
                jwt.sign(payload, secret, { ...options, audience: 'another-api' }),
                jwt.sign({ tipo_usuario: 'Admin' }, secret, options),
            ];
            for (const invalidToken of invalid) {
                assert.equal((await request('GET', '/artists', undefined, invalidToken)).status, 401);
            }
        });
        await t.test('logout revokes this token, rejects replay, and keeps other sessions active', async () => {
            const secondLogin = await request('POST', '/login', { email: 'ana@example.com', password: 'correct-password' });
            const secondToken = (await secondLogin.json()).token;
            assert.notEqual(token, secondToken);
            assert.equal((await request('POST', '/logout', undefined, token)).status, 200);
            assert.equal((await request('GET', '/artists', undefined, token)).status, 401);
            assert.equal((await request('POST', '/logout', undefined, token)).status, 401);
            assert.equal((await request('GET', '/artists', undefined, secondToken)).status, 200);
        });
        await t.test('a valid signed token without an active session is rejected', async () => {
            const { token: unregistered } = issueToken({ id_usuario: 1, tipo_usuario: 'Artista' });
            assert.equal((await request('GET', '/artists', undefined, unregistered)).status, 401);
        });
        await t.test('missing or short signing secrets are rejected', () => {
            delete process.env.JWT_SECRET;
            assert.throws(getJwtSecret, /JWT_SECRET/);
            process.env.JWT_SECRET = 'short';
            assert.throws(getJwtSecret, /JWT_SECRET/);
            process.env.JWT_SECRET = secret;
        });
    } finally {
        await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
});
