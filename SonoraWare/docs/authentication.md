# JWT authentication

`npm start` and `npm run dev` load `.env` using Node's native environment-file
support. A random JWT_SECRET was generated in your local, ignored `.env` during
setup. For another checkout, copy `.env.example` to `.env` and fill JWT_SECRET
using the generation command in that example. Do not share the secret with the
frontend. Startup rejects missing secrets or values shorter than 32 bytes.

The current schema in `src/database/init.sql` includes the new `Sessao` table.
Recreate your development database with that script before using authentication
if it still has the previous schema. Recreating it removes its existing data;
the implementation has not changed your application database automatically.

## Request flow

1. Register through a public signup route.
2. `POST /login` with JSON `{ "email": "ana@example.com", "password": "your-password" }`.
3. Read `token` from the successful JSON response.
4. Send `Authorization: Bearer <token>` on protected requests.
5. `POST /logout` with the same header, then discard the token in the frontend.

Successful login returns:

```json
{
  "message": "Login successful",
  "user": { "id_usuario": 1, "email": "ana@example.com", "tipo_usuario": "Artista" },
  "token": "<signed JWT>",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

Example authenticated request:

```js
const response = await fetch('http://localhost:3000/artists', {
    headers: { Authorization: `Bearer ${token}` },
});
```

## Which routes require login?

| Routes | Access |
| --- | --- |
| POST /login | Public |
| POST /signup/artists, /signup/bands, /signup/concert-venues | Public |
| POST /artists, /bands | Public account creation |
| GET /artists, /artists/:id, /bands, /bands/:id | Any logged-in account |
| PATCH or DELETE /artists/:id | The matching Artista account |
| PATCH or DELETE /bands/:id | The matching Banda account |
| POST /logout | Any logged-in account; signs out only this token |

## Why middleware and a session table?

`auth/tokens.js` signs one-hour HS256 tokens and verifies signature, expiration,
issuer, audience, and required identity claims. The implementation uses
[`jsonwebtoken` sign and verify options](https://github.com/auth0/node-jsonwebtoken#readme).
The payload includes account type, account ID (`sub`), and a random session ID
(`jti`). Passwords are never included. JWT payloads are readable; their signature
protects them against modification, rather than encrypting them.

`middleware/auth.js` runs before protected controllers. It checks the token and
the active database session, then puts verified claims in `req.auth`.
`ownsAccount` additionally compares the URL ID and account type. Checking only
the numeric ID would be wrong because Artista 1 and Banda 1 are different users.

`models/Session.js` owns the SQL for active sessions. Only the session ID and
account identity/expiry are stored, not the complete JWT. The session lookup
also checks that the account still exists. Expired session rows are cleaned up
on subsequent logins.

A signed JWT cannot be erased from someone else's browser by the backend.
Logout deletes its active session from MySQL, so future requests using that JWT
return 401 immediately. The client must also discard its own token. Other login
sessions stay active, and session invalidation persists across server restarts.

Invalid/missing/expired/signed-out tokens return 401. Attempting to modify
another account returns 403. A session database failure returns 500 and does not
grant access. Once a token expires, log in again; there is no refresh-token flow.
