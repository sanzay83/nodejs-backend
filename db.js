const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const promisePool = pool.promise();

promisePool
  .query("SELECT 1")
  .then(() => console.log("Database connected!"))
  .catch((err) => console.error("Database connection failed:", err));

module.exports = promisePool;
