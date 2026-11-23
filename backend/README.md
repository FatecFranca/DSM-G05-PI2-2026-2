# Backend do SonoraWare

API REST em Node.js com Express, módulos ES e MySQL. As rotas recebem as requisições, os controladores coordenam as operações e os modelos acessam o banco.

## Banco de dados

Com o MySQL em execução, abra o cliente `mysql -u root -p` e execute o comando abaixo a partir da pasta `backend`:

```sql
SOURCE src/database/init.sql
```

Também é possível abrir e executar o [script SQL](src/database/init.sql) no MySQL Workbench. Faça a importação em uma base local nova. O script cria o esquema e insere dados iniciais, incluindo as opções de instrumentos e estilos musicais usadas pela interface.

A conexão padrão usa host `localhost`, usuário `root`, senha `root` e banco `SonoraWare`. O script cria o banco com o nome `sonoraware`. Se o servidor distinguir maiúsculas de minúsculas em nomes de bancos, ajuste o nome em [connect.js](src/database/connect.js) para `sonoraware`. Ajuste o mesmo arquivo se as credenciais locais forem diferentes.

## Instalação e execução

Na pasta `backend`, execute no PowerShell:

```powershell
npm ci
Copy-Item .env.example .env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Se já tiver um `.env`, use o arquivo existente. Cole o valor gerado em `JWT_SECRET` no `.env`. A API exige um segredo de pelo menos 32 bytes. Mantenha esse valor fora do controle de versão.

```powershell
npm start
```

A API usa `http://localhost:3000` por padrão. Defina `PORT` no `.env` para mudar a porta. Use `npm run dev` para reiniciar o servidor automaticamente ao alterar o código.

## Rotas e formatos

| Operação | Rotas | Documentação |
| --- | --- | --- |
| Cadastro | `POST /signup/artists`, `POST /signup/bands`, `POST /signup/concert-venues` | [Cadastro](docs/registration.md) |
| Sessão | `POST /login`, `POST /logout` | [Autenticação JWT](docs/authentication.md) |
| Artistas e bandas | `POST` e `GET` nas coleções `/artists` e `/bands`. `GET`, `PATCH` e `DELETE` nas rotas por ID | [CRUD](docs/crud.md) |
| Fotos de perfil | Envio do arquivo `foto_perfil` via `multipart/form-data` nas rotas compatíveis | [Fotos de perfil](docs/profile-photos.md) |

Envie `Authorization: Bearer <token>` para listar ou consultar perfis e encerrar a sessão. Alterações e exclusões exigem o token do titular da conta.

## Testes

`npm test` executa a suíte padrão. Para incluir o teste de integração no PowerShell, execute:

```powershell
$env:RUN_MYSQL_TESTS = '1'
npm test
Remove-Item Env:RUN_MYSQL_TESTS
```

O teste de integração usa as credenciais de [connect.js](src/database/connect.js). O usuário MySQL precisa ter permissão para criar e remover o banco temporário do teste.
