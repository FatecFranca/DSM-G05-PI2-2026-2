const formularioIntegrante = document.getElementById("form-cadastro-integrante");
const senha = document.getElementById("senha");
const confirmarSenha = document.getElementById("confirmar-senha");
const telefone = document.getElementById("telefone");
const foto = document.getElementById("foto-perfil");
const statusSenha = document.getElementById("status-senha");
const statusImagem = document.getElementById("status-imagem");
const statusCadastro = document.getElementById("status-cadastro");

function validarSenhas() {
    const divergentes = confirmarSenha.value !== "" && senha.value !== confirmarSenha.value;
    const mensagem = divergentes ? "As senhas não coincidem." : "";
    confirmarSenha.setCustomValidity(mensagem);
    statusSenha.textContent = mensagem;
    statusSenha.className = divergentes ? "form-status ativo erro" : "form-status";
}

senha.addEventListener("input", validarSenhas);
confirmarSenha.addEventListener("input", validarSenhas);

telefone.addEventListener("input", () => {
    const numeros = telefone.value.replace(/\D/g, "").slice(0, 11);
    if (numeros.length <= 2) {
        telefone.value = numeros;
    } else if (numeros.length <= 6) {
        telefone.value = `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    } else {
        const corte = numeros.length <= 10 ? 6 : 7;
        telefone.value = `(${numeros.slice(0, 2)}) ${numeros.slice(2, corte)}-${numeros.slice(corte)}`;
    }
});

function validarFoto() { foto.setCustomValidity(""); }

foto.addEventListener("change", validarFoto);

formularioIntegrante.addEventListener("input", () => {
    statusCadastro.textContent = "";
    statusCadastro.className = "form-status cadastro-banda__status";
});

formularioIntegrante.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    validarSenhas();
    validarFoto();
    if (!formularioIntegrante.reportValidity()) return;

    await SonoraRegistration.save(formularioIntegrante, "artists", statusCadastro, formularioIntegrante.querySelector('[type="submit"]'));
});
