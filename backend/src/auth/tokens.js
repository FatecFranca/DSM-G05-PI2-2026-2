import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';

export function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret || Buffer.byteLength(secret) < 32) {
        throw new Error('Set JWT_SECRET to a random secret of at least 32 bytes in .env');
    }
    return secret;
}

export function issueToken(user) {
    const token = jwt.sign({ tipo_usuario: user.tipo_usuario }, getJwtSecret(), {
        algorithm: 'HS256',
        subject: String(user.id_usuario),
        jwtid: randomUUID(),
        issuer: 'sonoraware',
        audience: 'sonoraware-api',
        expiresIn: '1h',
    });
    return { token, claims: verifyToken(token) };
}

export function verifyToken(token) {
    const claims = jwt.verify(token, getJwtSecret(), {
        algorithms: ['HS256'], issuer: 'sonoraware', audience: 'sonoraware-api',
    });
    if (!/^[1-9]\d*$/.test(claims.sub) || !Number.isSafeInteger(Number(claims.sub))
        || typeof claims.jti !== 'string' || !claims.jti
        || !Number.isSafeInteger(claims.exp)
        || !['Artista', 'Banda', 'Estabelecimento'].includes(claims.tipo_usuario)) {
        throw new jwt.JsonWebTokenError('Invalid account claims');
    }
    return claims;
}
