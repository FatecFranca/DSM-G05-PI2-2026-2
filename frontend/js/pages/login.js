const senha = document.getElementById("senha");
const botaoMostrarSenha = document.getElementById("mostrar-senha");

botaoMostrarSenha.addEventListener("click", () => {
    if (senha.type === "password") {
        senha.type = "text";
    } else {
        senha.type = "password";
    }
});

const form = document.getElementById('form-login');
const status = document.createElement('p');
status.setAttribute('role', 'status');
form.append(status);
if (new URLSearchParams(location.search).get('cadastro') === 'sucesso') {
    status.textContent = 'Cadastro realizado! Entre com seu e-mail e senha.';
}
form.addEventListener('submit', async event => {
    event.preventDefault();
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    status.textContent = 'Entrando...';
    try {
        await SonoraAPI.login(document.getElementById('usuario-login').value.trim(), senha.value);
        location.href = '/index.html';
    } catch (error) {
        status.textContent = error.message;
    } finally {
        button.disabled = false;
    }
});
