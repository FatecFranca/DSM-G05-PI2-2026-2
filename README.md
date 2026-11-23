# SonoraWare

O SonoraWare é um projeto acadêmico que conecta artistas, bandas e estabelecimentos do setor musical. A aplicação oferece cadastro e login para os três tipos de conta, além de consulta e gerenciamento de perfis de artistas e bandas.

| Pasta | Conteúdo |
| --- | --- |
| [backend/](backend/README.md) | API REST em Node.js e Express, autenticação JWT e persistência em MySQL |
| [frontend/](frontend/README.md) | Interface em HTML, CSS e JavaScript com um servidor Node.js para arquivos estáticos e acesso à API |

## Como executar

1. Tenha Node.js 22 ou superior, npm e um servidor MySQL em execução.
2. Importe o banco, configure o segredo JWT e inicie a API conforme o [guia do backend](backend/README.md).
3. Em um segundo terminal, inicie a interface conforme o [guia do frontend](frontend/README.md).
4. Abra [http://localhost:5500](http://localhost:5500) e cadastre uma conta para testar o login.

Na configuração padrão, o navegador usa a porta `5500`. O servidor do frontend encaminha as requisições com prefixo `/api/` para a API na porta `3000`.
