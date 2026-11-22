import jwt from 'jsonwebtoken';
import { verifyToken } from '../auth/tokens.js';
import sessions from '../models/Session.js';

export async function authenticate(req, res, next) {
    const match = /^Bearer (\S+)$/i.exec(req.get('Authorization') ?? '');
    if (!match) return res.status(401).json({ error: 'A Bearer token is required' });

    try {
        const claims = verifyToken(match[1]);
        if (!await sessions.isActive(claims)) {
            return res.status(401).json({ error: 'Session expired or signed out' });
        }
        req.auth = claims;
        return next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        console.error('Authentication failed:', error.code ?? error.name);
        return res.status(500).json({ error: 'Unable to authenticate' });
    }
}

export function ownsAccount(type) {
    return (req, res, next) => {
        if (!/^[1-9]\d*$/.test(req.params.id) || !Number.isSafeInteger(Number(req.params.id))) {
            return res.status(400).json({ error: 'id must be a positive integer' });
        }
        // Account IDs can overlap across tables, so compare both type and ID.
        if (req.auth.tipo_usuario !== type || req.auth.sub !== req.params.id) {
            return res.status(403).json({ error: 'You can only change your own account' });
        }
        return next();
    };
}
