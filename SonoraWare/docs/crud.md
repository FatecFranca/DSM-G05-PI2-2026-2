# Artist and band CRUD

Start the server with `npm start` or `npm run dev` (default port 3000; override
with `PORT`). JSON bodies are parsed by `src/app.js`.

| Operation | Artists | Bands |
| --- | --- | --- |
| Create | POST /artists | POST /bands |
| List | GET /artists | GET /bands |
| Find by ID | GET /artists/:id | GET /bands/:id |
| Partial update | PATCH /artists/:id | PATCH /bands/:id |
| Delete | DELETE /artists/:id | DELETE /bands/:id |

The controllers expose `create`, `list`, `show`, `update`, and `delete`.
SQL lives in the shared Account model, so both controllers apply the same rules.
Creation reuses the existing registration model. Use schema column names in
request bodies, including `senha` for a password. Passwords are hashed before
storage and omitted from reads. Lists contain account fields; individual reads
also include instrument or musical-style IDs.

Artist creation example:

```json
{ "nome": "Ana", "email": "ana@example.com", "senha": "example-password", "instrumentos": [] }
```

Band creation requires all non-default NOT NULL columns from Banda, including
`numero_artistas` (renamed from the old member-count field). It accepts
`estilos_musicais` as an array of existing IDs.

For updates, provide only the fields to change. Omitted relationships are kept;
`instrumentos: []` or `estilos_musicais: []` clears that selection. A supplied
array replaces the entire selection, and duplicate IDs are deduplicated.
Account changes and relationship replacements share one transaction.
Membership management in `artista_banda` is a separate operation.

Create returns 201, reads and updates return 200, and deletion returns 204 with
no body. Invalid data/IDs return 400, missing records 404, duplicate emails 409,
and unexpected database failures 500. Deleting an artist with Solicitacao
records returns 409 because the schema restricts that deletion. Other junction
records follow the existing cascade rules.

## Database setup

Use `src/database/init.sql` to create the development schema and seed catalogs.
All schema changes go directly in that file during this stage of the project.
The script creates tables; it does not update tables that already exist. To
apply schema changes locally, recreate the development database and run the
script again. Recreating a database removes its existing records.

The login account discriminator is now `Artista`, the primary key is
`id_artista`, and junction tables are `artista_banda` and `artista_instrumento`.

Account creation stays public, including `POST /artists` and `POST /bands`.
All GET, PATCH, and DELETE routes require a valid Bearer token. A logged-in
account can read artists and bands, but can update/delete only its own profile
(matching both ID and account type). Another user's account returns 403; a
missing, expired, invalid, or signed-out token returns 401. See
[authentication usage](authentication.md).

Run `npm test` for the unit tests. To include the MySQL integration test in
PowerShell, run `$env:RUN_MYSQL_TESTS = '1'; npm test`. That test uses the configured
local credentials, creates a uniquely named temporary database, and removes it
afterward. It initializes that database directly from `init.sql` and leaves the
application database unchanged.
