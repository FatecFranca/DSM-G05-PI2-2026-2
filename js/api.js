window.SonoraAPI = (() => {
    function clearSession() {
        localStorage.removeItem('sonoraSession');
        localStorage.removeItem('perfilAtivo');
    }
    function session() {
        try {
            const saved = JSON.parse(localStorage.getItem('sonoraSession'));
            if (saved?.expiresAt > Date.now()) return saved;
        } catch { /* Ignore an invalid saved session. */ }
        clearSession();
        return null;
    }
    async function request(route, { method = 'GET', body, authenticated = true } = {}) {
        const headers = {};
        if (body !== undefined) headers['Content-Type'] = 'application/json';
        if (authenticated && session()) headers.Authorization = `Bearer ${session().token}`;
        let response;
        try {
            response = await fetch(`/api${route}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
        } catch {
            throw new Error('Não foi possível conectar ao servidor. Abra o site em http://localhost:5500.');
        }
        // Only DELETE returns an empty success response in this API.
        // A static server or a failed proxy may return an empty/HTML error page.
        const text = response.status === 204 ? '' : await response.text();
        let data = null;
        if (text.trim()) {
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error(`O servidor retornou uma resposta inválida (HTTP ${response.status}). Inicie o back-end e execute npm start na pasta sonoraware-v2. Abra http://localhost:5500, sem usar o Live Server.`);
            }
        }
        if (!response.ok) {
            if (response.status === 401 && authenticated) {
                clearSession();
                location.href = '/pages/auth/login.html';
            }
            const messages = {
                'Invalid email or password': 'E-mail ou senha incorretos.',
                'An account with this email already exists': 'Já existe uma conta com este e-mail.',
                'Internal server error': 'Erro no servidor. Verifique se o banco de dados está disponível.',
                'This account has related requests and cannot be deleted': 'Esta conta possui solicitações vinculadas e não pode ser excluída.',
            };
            throw new Error(messages[data?.error] || data?.error || `O servidor não retornou os dados da API (HTTP ${response.status}). Inicie o back-end e execute npm start na pasta sonoraware-v2. Abra http://localhost:5500, sem usar o Live Server.`);
        }
        if (response.status !== 204 && data === null) {
            throw new Error('A API retornou uma resposta vazia. Inicie o back-end e execute npm start na pasta sonoraware-v2. Abra http://localhost:5500, sem usar o Live Server.');
        }
        return data;
    }
    async function login(email, password) {
        const data = await request('/login', { method: 'POST', body: { email, password }, authenticated: false });
        localStorage.setItem('sonoraSession', JSON.stringify({ ...data, expiresAt: Date.now() + data.expires_in * 1000 }));
        localStorage.setItem('perfilAtivo', data.user.tipo_usuario === 'Estabelecimento' ? 'estabelecimento' : 'banda');
        return data.user;
    }
    async function logout() {
        await request('/logout', { method: 'POST' });
        clearSession();
        location.href = '/pages/auth/login.html';
    }
    return { request, session, login, logout, clearSession };
})();
