fetch("/components/header.html")
    .then(response => {
        if (!response.ok) {
            throw new Error("Não foi possível carregar o header.");
        }

        return response.text();
    })
    .then(data => {

        const headerContainer = document.getElementById("header-container");

        if (!headerContainer) {
            return;
        }

        headerContainer.innerHTML = data;

        definirPerfilAtual();
        configurarMenusPorPerfil();
        configurarDropdownsHeader();
        configurarMenuLogin();

        document.dispatchEvent(new Event("headerCarregado"));

    })
    .catch(error => {
        console.error("Erro ao carregar o header:", error);
    });


function definirPerfilAtual() {
    const current = SonoraAPI.session();
    if (current) localStorage.setItem("perfilAtivo", current.user.tipo_usuario === "Estabelecimento" ? "estabelecimento" : "banda");
}

function configurarMenusPorPerfil() {

    const perfil = localStorage.getItem("perfilAtivo");

    const solicitacoesMenu =
        document.getElementById("solicitacoes-menu");

    const eventosMenu =
        document.getElementById("eventos-menu");


    if (!solicitacoesMenu || !eventosMenu) {
        return;
    }


    if (perfil === "banda") {

        solicitacoesMenu.innerHTML = `
            <a href="/pages/banda/minhas-inscricoes.html">
                Minhas inscrições
            </a>
        `;


        eventosMenu.innerHTML = `
            <a href="/pages/banda/oportunidades.html">
                Oportunidades
            </a>
        `;

        return;

    }


    if (perfil === "estabelecimento") {

        solicitacoesMenu.innerHTML = `
            <a href="/pages/estabelecimento/criar-solicitacao.html">
                Criar solicitação
            </a>

            <a href="/pages/estabelecimento/minhas-solicitacoes.html">
                Minhas solicitações
            </a>

            <a href="/pages/estabelecimento/inscricoes-recebidas.html">
                Inscrições recebidas
            </a>
        `;


        eventosMenu.innerHTML = `
            <a href="/pages/banda/oportunidades.html">
                Oportunidades
            </a>
        `;

        return;

    }


    solicitacoesMenu.innerHTML = `
        <a href="/pages/auth/login.html">
            Entrar para acessar
        </a>
    `;


    eventosMenu.innerHTML = `
        <a href="/pages/banda/oportunidades.html">
            Oportunidades
        </a>
    `;

}


function configurarDropdownsHeader() {

    const solicitacoesButton =
        document.getElementById("solicitacoes-button");

    const solicitacoesMenu =
        document.getElementById("solicitacoes-menu");

    const eventosButton =
        document.getElementById("eventos-button");

    const eventosMenu =
        document.getElementById("eventos-menu");


    function fecharDropdowns() {

        solicitacoesMenu?.classList.remove("ativo");
        eventosMenu?.classList.remove("ativo");

        solicitacoesButton?.setAttribute(
            "aria-expanded",
            "false"
        );

        eventosButton?.setAttribute(
            "aria-expanded",
            "false"
        );

    }


    if (solicitacoesButton && solicitacoesMenu) {

        solicitacoesButton.addEventListener("click", event => {

            event.stopPropagation();

            const aberto =
                solicitacoesMenu.classList.contains("ativo");

            fecharDropdowns();

            if (!aberto) {

                solicitacoesMenu.classList.add("ativo");

                solicitacoesButton.setAttribute(
                    "aria-expanded",
                    "true"
                );

            }

        });

    }


    if (eventosButton && eventosMenu) {

        eventosButton.addEventListener("click", event => {

            event.stopPropagation();

            const aberto =
                eventosMenu.classList.contains("ativo");

            fecharDropdowns();

            if (!aberto) {

                eventosMenu.classList.add("ativo");

                eventosButton.setAttribute(
                    "aria-expanded",
                    "true"
                );

            }

        });

    }


    solicitacoesMenu?.addEventListener("click", event => {
        event.stopPropagation();
    });


    eventosMenu?.addEventListener("click", event => {
        event.stopPropagation();
    });


    document.addEventListener("click", fecharDropdowns);

}


function configurarMenuLogin() {

    const loginButton =
        document.getElementById("login-button");

    const loginMenu =
        document.getElementById("login-menu");


    if (!loginButton || !loginMenu) {
        return;
    }


    const current = SonoraAPI.session();
    if (current) {
        loginMenu.replaceChildren();
        const name = document.createElement("span");
        name.textContent = current.user.email;
        loginMenu.append(name);
        if (current.user.tipo_usuario !== "Estabelecimento") {
            const profile = document.createElement("a");
            profile.href = "/pages/auth/perfil.html";
            profile.textContent = "Meu perfil";
            loginMenu.append(profile);
        }
        const logout = document.createElement("button");
        logout.type = "button";
        logout.textContent = "Sair";
        logout.onclick = async () => {
            logout.disabled = true;
            try { await SonoraAPI.logout(); }
            catch (error) { alert(error.message); logout.disabled = false; }
        };
        loginMenu.append(logout);
    }
    loginButton.addEventListener("click", event => {

        event.stopPropagation();

        loginMenu.classList.toggle("ativo");

    });


    loginMenu.addEventListener("click", event => {
        event.stopPropagation();
    });


    document.addEventListener("click", () => {
        loginMenu.classList.remove("ativo");
    });

}