# SonoraWare V2

The front end connects to the routes in SonoraWare without modifying the back end.

## Run locally

1. Prepare MySQL using SonoraWare/src/database/init.sql. The current backend connection expects localhost, user root, password root and database SonoraWare. Check that configuration for your environment.
2. In SonoraWare, run npm install, configure JWT_SECRET in .env (see .env.example), then run npm start.
3. In the sonoraware-v2 root, run npm start and open http://localhost:5500. No additional frontend dependencies are needed.

The frontend server forwards /api/* to http://localhost:3000. Set API_URL to use a different API address, or FRONTEND_PORT to change the frontend port. Use this server instead of Live Server so API requests reach the backend.

## Connected features

- Artist, band and venue registration, email login and logout.
- Artist and band listings on the home page after login.
- Profile details, editing and deletion of your own artist/band account through Meu perfil.

Photos use public image URLs because the API has no upload endpoint. Instrument, genre and venue option IDs match the supplied SQL lookup data. Keep those lookup records when preparing the database. Fields without API equivalents were removed.

Events, opportunities, requests and applications remain demonstrations because the provided backend has no routes for them. Venue editing/deletion and password recovery are also unavailable in the API.

Create an account using the registration form to log in; the SQL contains example password hashes rather than documented demo credentials.
