import pool from "./config/config.ts";

async function getContacts(email?: string, phoneNumber?: string) {
  const result = await pool.query(
    `
    SELECT * FROM contact
    WHERE email = $1 OR phoneNumber = $2
    `,
    [email, phoneNumber]
  );

  return result.rows;
}