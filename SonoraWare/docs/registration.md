# Registration

The controller methods register accounts (despite their `signIn` names).
Use JSON bodies with the exact column names from `init.sql`; required columns
must be supplied. Optional columns may be omitted.

| Method | URL | Controller method |
| --- | --- | --- |
| POST | /login | UserController.login |
| POST | /logout | UserController.signOut (requires Bearer token) |
| POST | /signup/artists | UserController.signInArtist |
| POST | /signup/bands | UserController.signInBand |
| POST | /signup/concert-venues | UserController.signInConcertVenue |

Use `Content-Type: application/json`. With the default port, the login URL is
`http://localhost:3000/login`. Its request body is:

```json
{ "email": "ana.artist@example.com", "password": "example-password" }
```

Login returns 200 with the user, a JWT `token`, `token_type: "Bearer"`, and
`expires_in: 3600` on a password match. Invalid credentials return 401; missing
email/password returns 400. Send the token in the `Authorization: Bearer <token>`
header on protected requests. See [authentication usage](authentication.md).

- `signInConcertVenue`: Estabelecimento fields, plus optional `estruturas`,
  `acessibilidades`, and `tipos_evento` arrays of existing positive integer IDs.
- `signInBand`: Banda fields and an optional `estilos_musicais` array.
- `signInArtist`: Artista fields and an optional `instrumentos` array.
  These are also arrays of existing IDs, not names or new records.
  Membership in a band is not created automatically.

Numbers and booleans must be JSON numbers and booleans. Unknown fields are ignored.
Repeated relationship IDs are deduplicated. Each account and its relationships
are inserted in one transaction; failure rolls back the whole registration.
Responses: 201 success, 400 invalid input, 409 duplicate email, 500 database failure.

Example venue body:

```json
{
  "nome_user": "Ana",
  "email_login": "ana@example.com",
  "senha": "example-password",
  "nome_estabelecimento": "Bar da Ana",
  "tipo_estabelecimento": "Bar",
  "estado": "SP",
  "cidade": "São Paulo",
  "estruturas": [1, 3],
  "tipos_evento": [5]
}
```

Example individual artist body:

```json
{
  "tipo_usuario": "Artista",
  "nome": "Ana",
  "email": "ana.artist@example.com",
  "senha": "example-password",
  "instrumentos": []
}
```

Passwords are hashed with Node's scrypt before insertion. Login still receives
`email` and `password`, but now verifies hashes and omits `senha` from responses.
Existing plaintext passwords must be reset before those accounts
can log in. Email uniqueness is per account table, as in the existing schema.

Create the development database with `src/database/init.sql`, which contains
the current schema, email uniqueness constraints, and seed catalogs. When the
schema changes, recreate the development database and run that script again;
recreating it removes existing records.

The CRUD routes also expose account creation through `POST /artists` and
`POST /bands`. These create the same account types as the corresponding signup
routes. JSON parsing is configured with `express.json()` in `src/app.js`.
See [CRUD documentation](crud.md) for operations and database setup.

## Optional procedure prompt

A procedure can implement the same transaction, but is not required. JavaScript
transactions keep the rules in the MVC model and avoid separately deploying
procedures. If your course requires procedures, give an AI `init.sql` and:

> Create MySQL stored procedures for registering Estabelecimento, Banda, and
> Artista using the attached schema. Accept account fields and arrays of
> existing relationship IDs. Insert the account and its junction rows atomically,
> using START TRANSACTION, COMMIT, and an EXIT HANDLER that rolls back and
> RESIGNALs on exceptions. Deduplicate IDs, reject invalid IDs, use
> LAST_INSERT_ID(), and return the new account ID and type. Accept an already
> hashed password; never hash or store plaintext in SQL. Do not create catalog
> records or band memberships implicitly. Provide deployment SQL and mysql2
> CALL examples, stating the minimum supported MySQL version.
