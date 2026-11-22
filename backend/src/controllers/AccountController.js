import connect from '../database/connect.js';
import Account from '../models/Account.js';
import { RegistrationError } from '../models/UserRegistration.js';

function handleError(res, error) {
    if (error instanceof RegistrationError) {
        return res.status(error.status).json({ error: error.message });
    }
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'An account with this email already exists' });
    }
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(409).json({ error: 'This account has related requests and cannot be deleted' });
    }
    if (['ER_NO_REFERENCED_ROW_2', 'ER_CHECK_CONSTRAINT_VIOLATED', 'ER_DATA_TOO_LONG', 'ER_TRUNCATED_WRONG_VALUE', 'ER_WARN_DATA_OUT_OF_RANGE', 'ER_BAD_NULL_ERROR'].includes(error.code)) {
        return res.status(400).json({ error: 'Invalid account data or related IDs' });
    }
    console.error('Account operation failed:', error.code ?? error.name);
    return res.status(500).json({ error: 'Internal server error' });
}

// Closures let Express call static handlers without depending on `this` binding.
export function accountHandlers(type, pool = connect) {
    const model = new Account(pool, type);
    const handle = action => async (req, res) => {
        try {
            return await action(req, res);
        } catch (error) {
            return handleError(res, error);
        }
    };
    return {
        create: handle(async (req, res) => res.status(201).json({
            message: 'Account created', user: await model.create(req.body),
        })),
        list: handle(async (req, res) => res.status(200).json(await model.list())),
        show: handle(async (req, res) => res.status(200).json(await model.find(req.params.id))),
        update: handle(async (req, res) => res.status(200).json({
            message: 'Account updated', user: await model.update(req.params.id, req.body),
        })),
        delete: handle(async (req, res) => {
            await model.delete(req.params.id);
            return res.status(204).end();
        }),
    };
}
