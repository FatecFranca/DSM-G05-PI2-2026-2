import connect from './database/connect.js';
import app from './app.js';
import { getJwtSecret } from './auth/tokens.js';

async function main() {
    getJwtSecret();
    const [rows] = await connect.execute(
        "SELECT 'Connected to MySQL database SonoraWare.' AS Mensagem"
    );

    console.log(rows[0]?.Mensagem);
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`API is running on port ${port}.`));
}

main().catch(async (error) => {
    console.error(error);
    await connect.end();
    process.exitCode = 1;
});
