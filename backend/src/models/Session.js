import connect from '../database/connect.js';

export class Session {
    constructor(pool) {
        this.pool = pool;
    }

    async create(claims) {
        await this.pool.execute('DELETE FROM Sessao WHERE expira_em <= UNIX_TIMESTAMP()');
        await this.pool.execute(
            'INSERT INTO Sessao (id_sessao, id_usuario, tipo_usuario, expira_em) VALUES (?, ?, ?, ?)',
            [claims.jti, Number(claims.sub), claims.tipo_usuario, claims.exp],
        );
    }

    async isActive(claims) {
        // The join also rejects tokens belonging to accounts that have been deleted.
        const [rows] = await this.pool.execute(
            `SELECT s.id_sessao FROM Sessao s
             INNER JOIN View_Login u ON u.id_usuario = s.id_usuario AND u.tipo_usuario = s.tipo_usuario
             WHERE s.id_sessao = ? AND s.id_usuario = ? AND s.tipo_usuario = ?
               AND s.expira_em = ? AND s.expira_em > UNIX_TIMESTAMP()`,
            [claims.jti, Number(claims.sub), claims.tipo_usuario, claims.exp],
        );
        return rows.length > 0;
    }

    async remove(id) {
        await this.pool.execute('DELETE FROM Sessao WHERE id_sessao = ?', [id]);
    }
}

export default new Session(connect);
