import connect from '../database/connect.js';
import { registerUser, RegistrationError } from '../models/UserRegistration.js';
import { verifyPassword } from '../models/password.js';
import { issueToken } from '../auth/tokens.js';
import sessions from '../models/Session.js';

async function register(req, res, type) {
    try {
        const user = await registerUser(connect, type, req.body);
        return res.status(201).json({ message: 'Registration successful', user });
    } catch (error) {
        if (error instanceof RegistrationError) {
            return res.status(error.status).json({ error: error.message });
        }
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'An account with this email already exists' });
        }
        if (['ER_NO_REFERENCED_ROW_2', 'ER_CHECK_CONSTRAINT_VIOLATED', 'ER_DATA_TOO_LONG', 'ER_TRUNCATED_WRONG_VALUE', 'ER_WARN_DATA_OUT_OF_RANGE'].includes(error.code)) {
            return res.status(400).json({ error: 'Invalid registration data or related IDs' });
        }
        console.error('Registration failed:', error.code ?? error.name);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export default class UserController {
    static async signInConcertVenue(req, res) {
        return register(req, res, 'Estabelecimento');
    }

    static async signInBand(req, res) {
        return register(req, res, 'Banda');
    }
    static async signInArtist(req, res) {
        return register(req, res, 'Artista');
    }

    static async login(req, res) {
        const { email, password } = req.body ?? {};
        if (typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ error: 'email and password are required' });
        }

        try {
            const [rows] = await connect.query(
                'SELECT * FROM View_Login WHERE email = ?',
                [email]
            );

            for (const row of rows) {
                if (await verifyPassword(password, row.senha)) {
                    const { senha, ...user } = row;
                    const { token, claims } = issueToken(user);
                    await sessions.create(claims);
                    res.set('Cache-Control', 'no-store');
                    return res.status(200).json({
                        message: 'Login successful', user, token, token_type: 'Bearer', expires_in: 3600,
                    });
                }
            }
            return res.status(401).json({ error: 'Invalid email or password' });
        } catch {
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async signOut(req, res) {
        try {
            await sessions.remove(req.auth.jti);
            res.set('Cache-Control', 'no-store');
            return res.status(200).json({ message: 'Signed out successfully' });
        } catch {
            return res.status(500).json({ error: 'Unable to sign out' });
        }
    }

}
