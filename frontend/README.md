# Frontend do SonoraWare

Interface em HTML, CSS e JavaScript. A página inicial fica em `index.html`, as telas em `pages/` e os componentes compartilhados em `components/`. A integração com a API passa por [js/api.js](js/api.js).

## Como executar

1. Inicie a API seguindo o [guia do backend](../backend/README.md).
2. Na pasta `frontend`, execute `npm start`. O servidor usa módulos nativos do Node.js e dispensa a instalação de dependências.
3. Abra [http://localhost:5500](http://localhost:5500).

Use o servidor fornecido pelo projeto para acessar a interface. Ele serve os arquivos estáticos e encaminha requisições de `/api/*` ao backend, removendo o prefixo `/api`.

| Variável de ambiente | Valor padrão | Finalidade |
| --- | --- | --- |
| `FRONTEND_PORT` | `5500` | Porta do servidor da interface |
| `API_URL` | `http://localhost:3000` | Endereço HTTP do backend |

Para usar outras portas, defina as variáveis no terminal antes de executar `npm start`. Exemplo no PowerShell com o backend configurado na porta `3001`:

```powershell
$env:FRONTEND_PORT = '5501'
$env:API_URL = 'http://localhost:3001'
npm start
```

Nesse exemplo, abra [http://localhost:5501](http://localhost:5501).

## Recursos e limitações

- Cadastro de artistas, bandas e estabelecimentos, login por e-mail e encerramento de sessão.
- Listagem e consulta de artistas e bandas após o login. O titular pode editar ou excluir a própria conta em **Meu perfil**.
- Eventos, oportunidades, solicitações e inscrições são telas demonstrativas. A API também ainda carece de rotas de recuperação de senha e de edição ou exclusão de estabelecimentos.
- Para cadastrar um perfil pela interface, deixe a foto em branco. Os formulários ainda usam URLs, enquanto o backend aceita arquivos via `multipart/form-data`. A exibição e a edição de fotos pela interface também dependem da adaptação a esse formato. Consulte a [documentação de fotos de perfil](../backend/docs/profile-photos.md).
