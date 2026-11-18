import { hashPassword } from './password.js';
import { MAX_PHOTO_SIZE, photoMimeType } from './profilePhoto.js';

// Column and table names come only from this configuration, never from the request.
export const profiles = {
    Estabelecimento: {
        table: 'Estabelecimento',
        id: 'id_estabelecimento',
        required: ['nome_user', 'email_login', 'senha', 'nome_estabelecimento', 'tipo_estabelecimento', 'estado', 'cidade'],
        optional: ['instagram', 'site', 'foto_perfil', 'sobre', 'cep', 'rua', 'numero', 'bairro', 'complemento', 'nome_contato', 'telefone_contato', 'email_contato', 'funcao', 'capacidade', 'tipo_ambiente'],
        relations: [
            ['estruturas', 'Estabelecimento_Estrutura', 'id_estrutura'],
            ['acessibilidades', 'Estabelecimento_Acessibilidade', 'id_acessibilidade'],
            ['tipos_evento', 'Estabelecimento_Tipo_Evento', 'id_tipo_evento'],
        ],
    },
    Banda: {
        table: 'Banda',
        id: 'id_banda',
        required: ['nome_user', 'email_login', 'senha', 'nome', 'cep', 'cidade', 'estado', 'numero_artistas', 'ano_formacao', 'nome_contato', 'funcao', 'telefone_contato', 'email_contato', 'disponibilidade'],
        optional: ['sobre', 'repertorio', 'possui_instrumentos', 'instagram', 'youtube', 'foto_perfil'],
        relations: [['estilos_musicais', 'Banda_Estilo_Musical', 'id_estilo_musical']],
    },
    Artista: {
        table: 'Artista',
        id: 'id_artista',
        required: ['nome', 'email', 'senha'],
        optional: ['disponibilidade', 'telefone', 'genero', 'id_publico', 'descricao', 'foto_perfil'],
        relations: [['instrumentos', 'artista_instrumento', 'id_instrumento']],
    },
};

export class RegistrationError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

export function validateUser(type, body, partial = false) {
    const profile = Object.hasOwn(profiles, type) ? profiles[type] : null;
    if (!profile) throw new RegistrationError('Invalid tipo_usuario');
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
        throw new RegistrationError('An object containing account fields is required');
    }

    const numeric = ['numero_artistas', 'ano_formacao', 'capacidade'];
    for (const field of partial ? [] : profile.required) {
        if (body[field] === undefined || body[field] === null || body[field] === '') {
            throw new RegistrationError(`Missing required field: ${field}`);
        }
    }
    const columns = [...profile.required, ...profile.optional].filter(field => body[field] !== undefined);
    for (const field of columns) {
        const value = body[field];
        if (value === null && profile.optional.includes(field)) continue;
        if (field === 'foto_perfil') {
            if (!Buffer.isBuffer(value) || !photoMimeType(value)) {
                throw new RegistrationError('foto_perfil must be an uploaded PNG, JPEG, GIF or WebP image');
            }
            if (value.length > MAX_PHOTO_SIZE) throw new RegistrationError('foto_perfil must not exceed 5 MiB', 413);
        } else if (numeric.includes(field)) {
            if (!Number.isSafeInteger(value) || value < (field === 'capacidade' ? 0 : 1)) {
                throw new RegistrationError(`${field} must be a positive integer`);
            }
        } else if (field === 'possui_instrumentos') {
            if (typeof value !== 'boolean') throw new RegistrationError(`${field} must be a boolean`);
        } else if (typeof value !== 'string' || (profile.required.includes(field) && !value.trim())) {
            throw new RegistrationError(`${field} must be a string`);
        }
    }

    const relations = profile.relations.filter(([field]) => !partial || Object.hasOwn(body, field)).map(([field, table, foreignKey]) => {
        if (partial && !Array.isArray(body[field])) {
            throw new RegistrationError(`${field} must be an array of positive integer IDs`);
        }
        const ids = body[field] ?? [];
        if (!Array.isArray(ids) || ids.some(id => !Number.isSafeInteger(id) || id <= 0)) {
            throw new RegistrationError(`${field} must be an array of positive integer IDs`);
        }
        return { table, foreignKey, ids: [...new Set(ids)] };
    });

    if (partial && !columns.length && !relations.length) {
        throw new RegistrationError('Provide at least one editable field');
    }
    return { profile, columns, relations };
}

export async function registerUser(pool, type, body) {
    const { profile, columns, relations } = validateUser(type, body);

    // Each request owns its connection so concurrent transactions cannot overlap.
    const passwordHash = await hashPassword(body.senha);
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [result] = await connection.execute(
            `INSERT INTO ${profile.table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
            columns.map(field => field === 'senha' ? passwordHash : body[field]),
        );
        for (const { table, foreignKey, ids } of relations) {
            if (!ids.length) continue;
            await connection.execute(
                `INSERT INTO ${table} (${profile.id}, ${foreignKey}) VALUES ${ids.map(() => '(?, ?)').join(', ')}`,
                ids.flatMap(id => [result.insertId, id]),
            );
        }
        await connection.commit();
        return { id_usuario: result.insertId, tipo_usuario: type };
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}
