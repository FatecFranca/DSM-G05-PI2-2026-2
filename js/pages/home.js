function normalizarTexto(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}


function iniciarBuscaHome() {

    const campoBusca = document.querySelector(".header__search input");

    if (!campoBusca) {
        return;
    }

    if (campoBusca.dataset.buscaInicializada === "true") {
        return;
    }

    campoBusca.dataset.buscaInicializada = "true";


    const oportunidades = document.querySelectorAll(".oportunidade-home-card");
    const bandas = document.querySelectorAll(".banda-home-card");


    campoBusca.addEventListener("input", () => {

        const termo = normalizarTexto(campoBusca.value);


        oportunidades.forEach(card => {

            const conteudoCard = normalizarTexto(card.textContent);

            if (conteudoCard.includes(termo)) {
                card.removeAttribute("hidden");
            } else {
                card.setAttribute("hidden", "");
            }

        });


        bandas.forEach(card => {

            const conteudoCard = normalizarTexto(card.textContent);

            if (conteudoCard.includes(termo)) {
                card.removeAttribute("hidden");
            } else {
                card.setAttribute("hidden", "");
            }

        });

    });

}


document.addEventListener("headerCarregado", async () => {
    const container = document.querySelector('.bandas-home');
    if (!container) return;
    container.replaceChildren();
    const status = document.createElement('p');
    status.setAttribute('role', 'status');
    container.append(status);
    if (!SonoraAPI.session()) {
        const login = document.createElement('a');
        login.href = '/pages/auth/login.html';
        login.textContent = 'Entre para conhecer bandas e artistas.';
        container.append(login);
        iniciarBuscaHome();
        return;
    }
    status.textContent = 'Carregando bandas e artistas...';
    const results = await Promise.allSettled(['bands', 'artists'].map(type => SonoraAPI.request('/' + type)));
    const errors = [];
    results.forEach((result, index) => {
        if (result.status === 'rejected') { errors.push(result.reason.message); return; }
        const type = index === 0 ? 'bands' : 'artists';
        result.value.forEach(account => {
            const card = document.createElement('article');
            card.className = 'banda-home-card';
            if (/^https?:\/\//i.test(account.foto_perfil || '')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'banda-home-card__imagem';
                const image = document.createElement('img');
                image.src = account.foto_perfil; image.alt = account.nome;
                wrapper.append(image); card.append(wrapper);
            }
            const content = document.createElement('div');
            content.className = 'banda-home-card__conteudo';
            const title = document.createElement('h3'); title.textContent = account.nome;
            const detail = document.createElement('p');
            detail.textContent = type === 'bands' ? account.cidade + ', ' + account.estado : account.genero || 'Artista';
            const link = document.createElement('a');
            link.textContent = 'Ver perfil';
            link.href = '/pages/auth/perfil.html?tipo=' + type + '&id=' + (account.id_banda || account.id_artista);
            content.append(title, detail, link); card.append(content); container.append(card);
        });
    });
    status.textContent = errors.join(' ') || (container.children.length === 1 ? 'Nenhum perfil cadastrado.' : '');
    iniciarBuscaHome();
});

iniciarBuscaHome();