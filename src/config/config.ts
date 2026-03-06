import { env } from "node:process";
import "dotenv/config";
import { Pool } from "pg";

// console.log(process.env.DATABASE_URL);
// import { Pool } from "pg"/;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;