import {
  getContacts,
  createContact,
  getContactIdsByLinkedId,
  updateLinkedContacts,
  getClusterContacts,
  insertSecondaryContact,
} from "../queries/contact.repository.ts";
import type { userInputProp } from "../model/userInputProp.ts";
import pool from "../config/config.ts";

interface ConsolidatedContact {
  contact: {
    primaryContatctId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

/** Fetch a single contact row by id */
const getContactById = async (id: number) => {
  const result = await pool.query(
    `SELECT id, email, "phoneNumber", "linkedId", "linkPrecedence", "createdAt"
     FROM contact WHERE id = $1`,
    [id]
  );
  return result.rows[0];
};

export const identifyContact = async (
  prop: userInputProp
): Promise<ConsolidatedContact> => {
  const { email, phoneNumber } = prop;

  if (!email && !phoneNumber) {
    throw new Error("At least one of email or phoneNumber is required");
  }

  // ── 1. Find contacts matching incoming email or phoneNumber ──────────────
  const matchedContacts = await getContacts({
    email: email ?? null,
    phoneNumber: phoneNumber ?? null,
  });

  // ── 2. No match → create brand-new primary ───────────────────────────────
  if (matchedContacts.length === 0) {
    const newId = await createContact({
      email: email ?? null,
      phoneNumber: phoneNumber ?? null,
    });
    return {
      contact: {
        primaryContatctId: newId,
        emails: email ? [email] : [],
        phoneNumbers: phoneNumber ? [phoneNumber] : [],
        secondaryContactIds: [],
      },
    };
  }

  // ── 3. Resolve primary ID for each matched contact ───────────────────────
  const resolvedPrimaryIds = matchedContacts.map((c) =>
    c.linkPrecedence === "primary" ? (c.id as number) : (c.linkedId as number)
  );
  const uniquePrimaryIds = [...new Set(resolvedPrimaryIds)];

  // ── 4. Multiple primaries → fetch each one, sort by createdAt, merge ──────
  let truePrimaryId: number;

  if (uniquePrimaryIds.length > 1) {
    // Fetch the actual primary rows (they may NOT be in matchedContacts)
    const primaryRows = await Promise.all(
      uniquePrimaryIds.map((id) => getContactById(id))
    );

    // Sort oldest first
    primaryRows.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    truePrimaryId = primaryRows[0].id;

    // Demote all newer primaries + their children under truePrimaryId
    for (const degraded of primaryRows.slice(1)) {
      const children = await getContactIdsByLinkedId(degraded.id);
      const childIds = children.map((r: { id: number }) => r.id);
      await updateLinkedContacts([degraded.id, ...childIds], truePrimaryId);
    }
  } else {
    truePrimaryId = uniquePrimaryIds[0]!;
  }

  // ── 5. Fetch the full cluster ─────────────────────────────────────────────
  const cluster = await getClusterContacts(truePrimaryId);

  // ── 6. New info in request? → add a secondary ────────────────────────────
  const clusterEmails = new Set(cluster.map((c) => c.email).filter(Boolean));
  const clusterPhones = new Set(
    cluster.map((c) => c.phoneNumber).filter(Boolean)
  );

  const emailIsNew = email && !clusterEmails.has(email);
  const phoneIsNew = phoneNumber && !clusterPhones.has(phoneNumber);

  if (emailIsNew || phoneIsNew) {
    await insertSecondaryContact(
      { email: email ?? null, phoneNumber: phoneNumber ?? null },
      truePrimaryId
    );
  }

  // ── 7. Re-fetch final cluster and build response ──────────────────────────
  const finalCluster = await getClusterContacts(truePrimaryId);

  const primaryRow = finalCluster.find((c) => c.id === truePrimaryId);
  const secondaryRows = finalCluster.filter((c) => c.id !== truePrimaryId);

  // Primary values must come first
  const emailsOrdered: string[] = [];
  const phonesOrdered: string[] = [];

  if (primaryRow?.email) emailsOrdered.push(primaryRow.email);
  if (primaryRow?.phoneNumber) phonesOrdered.push(primaryRow.phoneNumber);

  for (const row of secondaryRows) {
    if (row.email && !emailsOrdered.includes(row.email))
      emailsOrdered.push(row.email);
    if (row.phoneNumber && !phonesOrdered.includes(row.phoneNumber))
      phonesOrdered.push(row.phoneNumber);
  }

  return {
    contact: {
      primaryContatctId: truePrimaryId,
      emails: emailsOrdered,
      phoneNumbers: phonesOrdered,
      secondaryContactIds: secondaryRows.map((r) => r.id),
    },
  };
};

export default identifyContact;