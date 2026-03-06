import "dotenv/config";
import { Pool } from "pg";

const targetDatabase = "biteWise_db";

const buildTargetConnectionString = (connectionString: string) => {
  const url = new URL(connectionString);
  url.pathname = `/${targetDatabase}`;
  return url.toString();
};

const ensureDatabase = async (connectionString: string) => {
  const pool = new Pool({ connectionString });

  try {
    const exists = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDatabase]
    );

    if (exists.rowCount === 0) {
      await pool.query(`CREATE DATABASE "${targetDatabase}"`);
      console.log(`Database created: ${targetDatabase}`);
    } else {
      console.log(`Database already exists: ${targetDatabase}`);
    }
  } finally {
    await pool.end();
  }
};

const ensureContactTable = async (connectionString: string) => {
  const pool = new Pool({ connectionString });

  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact (
        id SERIAL PRIMARY KEY,
        "phoneNumber" TEXT,
        "email" TEXT,
        "linkedId" INTEGER,
        "linkPrecedence" TEXT NOT NULL CHECK ("linkPrecedence" IN ('primary', 'secondary')),
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMPTZ,
        CONSTRAINT contact_linked_id_fk FOREIGN KEY ("linkedId") REFERENCES contact(id) ON DELETE SET NULL
      )
    `);

    console.log("Table ensured: contact");
  } finally {
    await pool.end();
  }
};

const main = async () => {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error("DATABASE_URL is not set");
    process.exitCode = 1;
    return;
  }

  await ensureDatabase(connectionString);

  const targetConnectionString = buildTargetConnectionString(connectionString);
  await ensureContactTable(targetConnectionString);
};

await main();
