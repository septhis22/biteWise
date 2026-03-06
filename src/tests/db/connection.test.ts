import pool from "../../config/config.ts";

const main = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Database connection ok");
  } catch (error) {
    console.error("Database connection failed", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
};

await main();
