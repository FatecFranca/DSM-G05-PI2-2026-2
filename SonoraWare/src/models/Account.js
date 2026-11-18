import { profiles, registerUser, validateUser, RegistrationError } from './UserRegistration.js';
import { hashPassword } from './password.js';
import { serializePhoto } from './profilePhoto.js';

function parseId(value) {
    if (!/^[1-9]\d*$/.test(String(value)) || !Number.isSafeInteger(Number(value))) {
        throw new RegistrationError('id must be a positive integer');
    }
    return Number(value);
}

// A shared model keeps artist and band validation and transaction rules consistent.
export default class Account {
    constructor(pool, type) {
        this.pool = pool;
        this.type = type;
        this.profile = profiles[type];
        if (!this.profile) throw new Error('Unknown account type');
    }

    create(body) {
        return registerUser(this.pool, this.type, body);
    }

    get publicColumns() {
        const { id, required, optional } = this.profile;
        return [id, ...required, ...optional].filter(field => field !== 'senha').join(', ');
    }

    async list() {
        const { table, id } = this.profile;
        const [rows] = await this.pool.execute(`SELECT ${this.publicColumns} FROM ${table} ORDER BY ${id}`);
        return rows.map(serializePhoto);
    }

    async find(value) {
        const id = parseId(value);
        const { table, id: key, relations } = this.profile;
        const [rows] = await this.pool.execute(`SELECT ${this.publicColumns} FROM ${table} WHERE ${key} = ?`, [id]);
        if (!rows.length) throw new RegistrationError('Account not found', 404);
        const account = rows[0];
        for (const [field, relationTable, foreignKey] of relations) {
            const [links] = await this.pool.execute(
                `SELECT ${foreignKey} FROM ${relationTable} WHERE ${key} = ? ORDER BY ${foreignKey}`, [id],
            );
            account[field] = links.map(link => link[foreignKey]);
        }
        return serializePhoto(account);
    }

    async update(value, body) {
        const id = parseId(value);
        const { profile, columns, relations } = validateUser(this.type, body, true);
        const values = await Promise.all(columns.map(field => field === 'senha' ? hashPassword(body[field]) : body[field]));
        const connection = await this.pool.getConnection();
        try {
            await connection.beginTransaction();
            // Lock the parent while changing its relationships or checking its existence.
            const [rows] = await connection.execute(
                `SELECT ${profile.id} FROM ${profile.table} WHERE ${profile.id} = ? FOR UPDATE`, [id],
            );
            if (!rows.length) throw new RegistrationError('Account not found', 404);
            if (columns.length) {
                await connection.execute(
                    `UPDATE ${profile.table} SET ${columns.map(field => `${field} = ?`).join(', ')} WHERE ${profile.id} = ?`,
                    [...values, id],
                );
            }
            for (const { table, foreignKey, ids } of relations) {
                await connection.execute(`DELETE FROM ${table} WHERE ${profile.id} = ?`, [id]);
                if (ids.length) {
                    await connection.execute(
                        `INSERT INTO ${table} (${profile.id}, ${foreignKey}) VALUES ${ids.map(() => '(?, ?)').join(', ')}`,
                        ids.flatMap(relatedId => [id, relatedId]),
                    );
                }
            }
            await connection.commit();
            return { id_usuario: id, tipo_usuario: this.type };
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    async delete(value) {
        const id = parseId(value);
        const { table, id: key } = this.profile;
        // Existing foreign keys cascade junction rows and restrict artists with requests.
        const [result] = await this.pool.execute(`DELETE FROM ${table} WHERE ${key} = ?`, [id]);
        if (!result.affectedRows) throw new RegistrationError('Account not found', 404);
    }
}
