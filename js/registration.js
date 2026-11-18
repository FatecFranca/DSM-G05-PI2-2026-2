// IDs correspond to the lookup records in SonoraWare/src/database/init.sql.
window.SonoraRegistration = {
    availability: { cidade: 'Somente na minha cidade', regiao: 'Minha cidade e região', estado: 'Todo o estado', brasil: 'Todo o Brasil' },
    async save(form, type, status, button) {
        const data = new FormData(form);
        const value = name => String(data.get(name) || '').trim();
        const ids = name => data.getAll(name).map(Number);
        const common = { senha: data.get('senha'), foto_perfil: value('foto_perfil') || null };
        let body;
        if (type === 'artists') {
            body = { ...common, nome: value('nome'), email: value('email'), telefone: value('telefone').replace(/\D/g, ''), genero: value('genero'), id_publico: value('id_publico'), descricao: value('descricao'), disponibilidade: this.availability[value('disponibilidade')] || null, instrumentos: ids('instrumentos') };
        } else {
            body = { ...common, nome_user: value('usuario'), email_login: value('email'), cep: value('cep'), cidade: value('cidade'), estado: value('estado'), nome_contato: value('responsavelNome'), funcao: value('responsavelFuncao'), telefone_contato: value('responsavelTelefone').replace(/\D/g, ''), email_contato: value('responsavelEmail'), sobre: value('descricao'), instagram: value('instagram') };
            if (type === 'bands') Object.assign(body, {
                nome: value('nomeBanda'), numero_artistas: Number(value('numeroIntegrantes')), ano_formacao: Number(value('anoFormacao')),
                repertorio: value('repertorio'), possui_instrumentos: value('instrumentosProprios') === 'sim', disponibilidade: this.availability[value('disponibilidade')], youtube: value('youtube'), estilos_musicais: ids('estilos'),
            });
            else Object.assign(body, {
                nome_estabelecimento: value('nomeEstabelecimento'), tipo_estabelecimento: { 'casa-show': 'Casa de Show', bar: 'Bar', restaurante: 'Restaurante', pub: 'Pub', boate: 'Boate', 'espaco-eventos': 'Espaço de Eventos', outro: 'Outro' }[value('tipoEstabelecimento')],
                rua: value('logradouro'), numero: value('numero'), bairro: value('bairro'), complemento: value('complemento'), capacidade: Number(value('capacidade')), tipo_ambiente: { fechado: 'Fechado', aberto: 'Aberto', misto: 'Misto' }[value('tipoAmbiente')], site: value('site'), estruturas: ids('estrutura'), acessibilidades: ids('acessibilidade'), tipos_evento: ids('tiposEvento'),
            });
        }
        const label = button.textContent;
        button.disabled = true;
        button.textContent = 'Criando perfil...';
        try {
            await SonoraAPI.request(`/signup/${type}`, { method: 'POST', body, authenticated: false });
            location.href = '/pages/auth/login.html?cadastro=sucesso';
        } catch (error) {
            status.textContent = error.message;
            status.className = 'form-status ativo erro';
        } finally {
            button.disabled = false;
            button.textContent = label;
        }
    },
};
