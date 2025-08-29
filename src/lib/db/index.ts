// Database connection and configuration for Family Vault Enterprise
// Using Neon Postgres with Drizzle ORM

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Environment variables validation
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create Neon connection
const sql = neon(process.env.DATABASE_URL);

// Create Drizzle instance with schema
export const db = drizzle(sql, { schema });

// Database types for TypeScript
export type Database = typeof db;
export type User = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;
export type Organization = typeof schema.organizations.$inferSelect;
export type NewOrganization = typeof schema.organizations.$inferInsert;
export type Cipher = typeof schema.ciphers.$inferSelect;
export type NewCipher = typeof schema.ciphers.$inferInsert;
export type CipherLogin = typeof schema.cipherLogins.$inferSelect;
export type NewCipherLogin = typeof schema.cipherLogins.$inferInsert;
export type CipherDocument = typeof schema.cipherDocuments.$inferSelect;
export type NewCipherDocument = typeof schema.cipherDocuments.$inferInsert;
export type Session = typeof schema.sessions.$inferSelect;
export type NewSession = typeof schema.sessions.$inferInsert;
export type AuditLog = typeof schema.auditLogs.$inferSelect;
export type NewAuditLog = typeof schema.auditLogs.$inferInsert;

// Export all schema tables
export * from './schema';