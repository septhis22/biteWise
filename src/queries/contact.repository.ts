import pool from "../config/config.ts";
import type { userInputProp } from "../model/userInputProp.ts";

export const getContacts = async (prop: userInputProp) => {
  const email = prop.email || null;
  const phoneNumber = prop.phoneNumber || null;

  // If both are null, return empty — caller should handle this
  if (!email && !phoneNumber) return [];

  const result = await pool.query(
    `
    SELECT
      id,
      email,
      "phoneNumber",
      "linkedId",
      "linkPrecedence",
      "createdAt"
    FROM contact
    WHERE
      ($1::text IS NOT NULL AND email = $1)
      OR ($2::text IS NOT NULL AND "phoneNumber" = $2)
    `,
    [email, phoneNumber]
  );
  return result.rows;
};

export const getContactLinks = async ({ email, phoneNumber }: userInputProp) => {
  const e = email || null;
  const p = phoneNumber || null;

  if (!e && !p) return [];

  const result = await pool.query(
    `
    SELECT
      id,
      "linkedId",
      "linkPrecedence"
    FROM contact
    WHERE
      ($1::text IS NOT NULL AND email = $1)
      OR ($2::text IS NOT NULL AND "phoneNumber" = $2)
    `,
    [e, p]
  );
  return result.rows;
};

export const updateLinkedContacts = async (
  linkedIds: number[],
  primaryId: number
) => {
  const result = await pool.query(
    `
    UPDATE contact
    SET
      "linkedId" = $1,
      "linkPrecedence" = 'secondary',
      "updatedAt" = NOW()
    WHERE id = ANY($2::int[])
    `,
    [primaryId, linkedIds]
  );
  return result.rowCount;
};

export const createContact = async (prop: userInputProp) => {
  const result = await pool.query(
    `
    INSERT INTO contact (email, "phoneNumber", "linkPrecedence", "createdAt", "updatedAt")
    VALUES ($1, $2, 'primary', NOW(), NOW())
    RETURNING id
    `,
    [prop.email || null, prop.phoneNumber || null]
  );
  return result.rows[0]?.id;
};

export const getPrimaryContactDetails = async (id: number) => {
  const result = await pool.query(
    `
    SELECT id, email, "phoneNumber", "createdAt"
    FROM contact
    WHERE id = $1 AND "linkPrecedence" = 'primary'
    `,
    [id]
  );
  return result.rows[0];
};

export const getContactIdsByLinkedId = async (linkedId: number) => {
  const result = await pool.query(
    `
    SELECT id
    FROM contact
    WHERE "linkedId" = $1
    `,
    [linkedId]
  );
  return result.rows;
};

export const updateLinkedStatus = async (linkedIds: number[]) => {
  const result = await pool.query(
    `
    UPDATE contact
    SET
      "linkPrecedence" = 'secondary',
      "updatedAt" = NOW()
    WHERE id = ANY($1::int[])
    `,
    [linkedIds]
  );
  return result.rowCount;
};

export const getClusterContacts = async (primaryId: number) => {
  const result = await pool.query(
    `
    SELECT
      id,
      email,
      "phoneNumber",
      "linkedId",
      "linkPrecedence",
      "createdAt"
    FROM contact
    WHERE (id = $1 OR "linkedId" = $1)
      AND "deletedAt" IS NULL
    `,
    [primaryId]
  );
  return result.rows;
};

export const insertSecondaryContact = async (
  prop: userInputProp,
  primaryId: number
): Promise<void> => {
  await pool.query(
    `
    INSERT INTO contact (email, "phoneNumber", "linkedId", "linkPrecedence", "createdAt", "updatedAt")
    VALUES ($1, $2, $3, 'secondary', NOW(), NOW())
    `,
    [prop.email || null, prop.phoneNumber || null, primaryId]
  );
};