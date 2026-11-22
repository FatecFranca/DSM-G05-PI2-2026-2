(async () => {
    const main = document.querySelector('main');
    main.className = 'perfil-api';
    main.replaceChildren();
    const back = document.createElement('a');
    back.href = '/index.html';
    back.className = 'botao-voltar';
    back.textContent = '← Início';
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    main.append(back, status);
    const current = SonoraAPI.session();
    if (!current) { location.href = '/pages/auth/login.html'; return; }
    const params = new URLSearchParams(location.search);
    const type = params.get('tipo') || (location.pathname.includes('/banda/') ? 'bands' : current.user.tipo_usuario === 'Banda' ? 'bands' : 'artists');
    const id = params.get('id') || (type === (current.user.tipo_usuario === 'Banda' ? 'bands' : 'artists') ? current.user.id_usuario : '');
    if (!['artists', 'bands'].includes(type) || !/^[1-9]\d*$/.test(String(id))) {
        status.textContent = 'Selecione um perfil na página inicial.';
        return;
    }
    const labels = { nome: 'Nome', nome_user: 'Usuário', email: 'E-mail', email_login: 'E-mail de acesso', telefone: 'Telefone', genero: 'Gênero musical', id_publico: 'Usuário público', descricao: 'Descrição', disponibilidade: 'Disponibilidade', foto_perfil: 'URL da foto', cep: 'CEP', cidade: 'Cidade', estado: 'Estado', numero_artistas: 'Número de integrantes', ano_formacao: 'Ano de formação', nome_contato: 'Responsável', funcao: 'Função', telefone_contato: 'Telefone de contato', email_contato: 'E-mail de contato', sobre: 'Sobre', repertorio: 'Repertório', possui_instrumentos: 'Instrumentos próprios', instagram: 'Instagram', youtube: 'YouTube', instrumentos: 'Instrumentos', estilos_musicais: 'Estilos musicais' };
    const choices = { instrumentos: ['Guitarra Elétrica', 'Violão de Aço/Nylon', 'Cavaquinho', 'Teclado / Sintetizador', 'Saxofone Alto'], estilos_musicais: ['Rock', 'Pop', 'MPB', 'Sertanejo', 'Indie', 'Pagode', 'Samba', 'Eletrônica', 'Rap', 'Cover', 'Outro'] };
    const numeric = ['numero_artistas', 'ano_formacao'];
    const required = type === 'bands' ? ['nome_user', 'email_login', 'nome', 'cep', 'cidade', 'estado', 'numero_artistas', 'ano_formacao', 'nome_contato', 'funcao', 'telefone_contato', 'email_contato', 'disponibilidade'] : ['nome', 'email'];
    status.textContent = 'Carregando perfil...';
    try {
        const account = await SonoraAPI.request(`/${type}/${id}`);
        const heading = document.createElement('h1');
        heading.textContent = account.nome;
        main.append(heading);
        if (/^https?:\/\//i.test(account.foto_perfil || '')) {
            const image = document.createElement('img');
            image.src = account.foto_perfil;
            image.alt = account.nome;
            main.append(image);
        }
        const details = document.createElement('dl');
        for (const [field, label] of Object.entries(labels)) {
            if (!(field in account) || field === 'foto_perfil') continue;
            const term = document.createElement('dt');
            term.textContent = label;
            const description = document.createElement('dd');
            const value = account[field];
            description.textContent = choices[field] ? value.map(id => choices[field][id - 1] || `#${id}`).join(', ') || 'Não informado' : field === 'possui_instrumentos' ? value ? 'Sim' : 'Não' : value || 'Não informado';
            details.append(term, description);
        }
        main.append(details);
        status.textContent = '';
        const ownType = current.user.tipo_usuario === 'Banda' ? 'bands' : current.user.tipo_usuario === 'Artista' ? 'artists' : null;
        if (type !== ownType || String(current.user.id_usuario) !== String(id)) return;
        const title = document.createElement('h2');
        title.textContent = 'Editar meu perfil';
        const form = document.createElement('form');
        form.className = 'cadastro-banda__form';
        const intro = document.createElement('p');
        intro.className = 'perfil-api__intro';
        intro.textContent = 'Atualize suas informações e mantenha seu perfil do seu jeito.';
        const containers = {};
        const groups = [
            ['Informações do perfil', ['nome', 'nome_user', 'id_publico', 'genero', 'numero_artistas', 'ano_formacao', 'descricao', 'sobre']],
            ['Localização e contato', ['email', 'email_login', 'telefone', 'cep', 'cidade', 'estado', 'nome_contato', 'funcao', 'telefone_contato', 'email_contato']],
            ['Música e disponibilidade', ['disponibilidade', 'possui_instrumentos', 'instrumentos', 'estilos_musicais', 'repertorio']],
            ['Foto e redes sociais', ['foto_perfil', 'instagram', 'youtube']],
            ['Segurança', ['senha']],
        ];
        for (const [name, fields] of groups) {
            if (!fields.some(field => field === 'senha' || field in account)) continue;
            const section = document.createElement('section');
            section.className = 'form-secao';
            const sectionTitle = document.createElement('h2');
            sectionTitle.textContent = name;
            const grid = document.createElement('div');
            grid.className = 'form-grid';
            section.append(sectionTitle, grid);
            form.append(section);
            fields.forEach(field => { containers[field] = grid; });
        }
        for (const [field, label] of Object.entries(labels)) {
            if (!(field in account)) continue;
            const wrapper = document.createElement('div');
            wrapper.className = 'form-campo';
            if (choices[field] || ['sobre', 'descricao', 'repertorio', 'foto_perfil'].includes(field)) wrapper.classList.add('perfil-api__campo-largo');
            const fieldLabel = document.createElement('label');
            fieldLabel.textContent = label;
            fieldLabel.htmlFor = `perfil-${field}`;
            wrapper.append(fieldLabel);
            let input;
            if (choices[field] || field === 'possui_instrumentos' || (field === 'disponibilidade' && type === 'bands')) {
                input = document.createElement('select');
                const values = choices[field] ? choices[field].map((name, index) => [index + 1, name]) : field === 'possui_instrumentos' ? [[0, 'Não'], [1, 'Sim']] : ['Somente na minha cidade', 'Minha cidade e região', 'Todo o estado', 'Todo o Brasil'].map(name => [name, name]);
                input.multiple = Boolean(choices[field]);
                for (const [value, text] of values) {
                    const option = new Option(text, value);
                    option.selected = input.multiple ? account[field].includes(value) : String(account[field]) === String(value);
                    input.append(option);
                }
            } else {
                input = document.createElement(['sobre', 'descricao', 'repertorio'].includes(field) ? 'textarea' : 'input');
                if (input.tagName === 'INPUT') input.type = numeric.includes(field) ? 'number' : field.includes('email') ? 'email' : ['instagram', 'youtube', 'foto_perfil'].includes(field) ? 'url' : 'text';
                if (numeric.includes(field)) input.min = 1;
                input.value = account[field] ?? '';
            }
            input.name = field;
            input.id = `perfil-${field}`;
            input.required = required.includes(field);
            wrapper.append(input);
            if (input.multiple) {
                const help = document.createElement('small');
                help.className = 'form-ajuda';
                help.id = `ajuda-${field}`;
                help.textContent = 'Use Ctrl ou Command para selecionar mais de uma opção.';
                input.setAttribute('aria-describedby', help.id);
                wrapper.append(help);
            }
            containers[field].append(wrapper);
        }
        const passwordLabel = document.createElement('label');
        passwordLabel.textContent = 'Nova senha';
        passwordLabel.htmlFor = 'perfil-senha';
        const password = document.createElement('input');
        password.type = 'password'; password.name = 'senha'; password.minLength = 8; password.autocomplete = 'new-password';
        password.id = 'perfil-senha';
        password.placeholder = 'Deixe em branco para manter a senha atual';
        const passwordWrapper = document.createElement('div');
        passwordWrapper.className = 'form-campo perfil-api__campo-largo';
        passwordWrapper.append(passwordLabel, password);
        containers.senha.append(passwordWrapper);
        const save = document.createElement('button'); save.textContent = 'Salvar alterações';
        const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Excluir minha conta';
        save.className = 'cadastro-banda__salvar';
        remove.className = 'perfil-api__excluir';
        const actions = document.createElement('div');
        actions.className = 'cadastro-banda__acoes';
        actions.append(remove, save);
        form.append(actions);
        const editor = document.createElement('section');
        editor.className = 'cadastro-banda__card perfil-api__editor';
        editor.append(title, intro, form);
        main.append(editor);
        form.onsubmit = async event => {
            event.preventDefault();
            const data = new FormData(form), body = {};
            for (const [key, value] of data) {
                if (choices[key]) continue;
                if (key === 'senha' && !value) continue;
                body[key] = numeric.includes(key) ? Number(value) : key === 'possui_instrumentos' ? value === '1' : value;
            }
            for (const key of Object.keys(choices)) if (key in account) body[key] = data.getAll(key).map(Number);
            save.disabled = remove.disabled = true;
            try {
                await SonoraAPI.request(`/${type}/${id}`, { method: 'PATCH', body });
                location.reload();
            } catch (error) { status.textContent = error.message; }
            finally { save.disabled = remove.disabled = false; }
        };
        remove.onclick = async () => {
            if (!confirm('Excluir sua conta definitivamente?')) return;
            save.disabled = remove.disabled = true;
            try {
                await SonoraAPI.request(`/${type}/${id}`, { method: 'DELETE' });
                SonoraAPI.clearSession(); location.href = '/index.html';
            } catch (error) { status.textContent = error.message; }
            finally { save.disabled = remove.disabled = false; }
        };
    } catch (error) { status.textContent = error.message; }
})();
