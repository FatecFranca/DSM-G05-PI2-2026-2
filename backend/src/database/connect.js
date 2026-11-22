import mysql from "mysql2/promise";

const connect = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'SonoraWare',
  password: 'root',
});

export default connect;
