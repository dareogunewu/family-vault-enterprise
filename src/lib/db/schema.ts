// Family Vault Enterprise Database Schema
// Optimized for Neon Postgres with encryption and family access

import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, serial, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table - Main authentication and user management
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  salt: text('salt').notNull(),
  masterKeyHash: text('master_key_hash').notNull(),
  encryptedUserKey: text('encrypted_user_key').notNull(),
  yubiKeyIds: jsonb('yubikey_ids').$type<string[]>().default([]),
  emailVerified: boolean('email_verified').default(false),
  twoFactorEnabled: boolean('two_factor_enabled').default(false),
  emergencyAccessEnabled: boolean('emergency_access_enabled').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
  isActive: boolean('is_active').default(true).notNull(),
});

// Organizations (Families)
export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerId: uuid('owner_id').references(() => users.id).notNull(),
  encryptedOrgKey: text('encrypted_org_key').notNull(),
  planType: varchar('plan_type', { length: 50 }).default('family').notNull(),
  maxMembers: integer('max_members').default(6).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Organization Members (Family Members)
export const organizationUsers = pgTable('organization_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  role: varchar('role', { length: 20 }).notNull(), // admin, member, viewer, emergency
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, active, inactive
  permissions: jsonb('permissions').$type<string[]>().default([]),
  encryptedOrgKey: text('encrypted_org_key'), // Encrypted with user's key
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  lastAccess: timestamp('last_access'),
});

// Folders for organizing vault items
export const folders = pgTable('folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Main ciphers table (passwords, documents, etc.)
export const ciphers = pgTable('ciphers', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id),
  folderId: uuid('folder_id').references(() => folders.id),
  type: integer('type').notNull(), // 1=Login, 2=SecureNote, 3=Card, 4=Identity, 5=SshKey, 6=Document
  encryptedName: text('encrypted_name').notNull(),
  encryptedNotes: text('encrypted_notes'),
  favorite: boolean('favorite').default(false).notNull(),
  reprompt: integer('reprompt').default(0).notNull(), // 0=None, 1=Password, 2=Biometric
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  deletedAt: timestamp('deleted_at'),
});

// Login data for password entries
export const cipherLogins = pgTable('cipher_logins', {
  id: uuid('id').primaryKey().defaultRandom(),
  cipherId: uuid('cipher_id').references(() => ciphers.id).notNull(),
  encryptedUsername: text('encrypted_username'),
  encryptedPassword: text('encrypted_password'),
  encryptedTotp: text('encrypted_totp'),
  passwordRevisionDate: timestamp('password_revision_date'),
  autofillOnPageLoad: boolean('autofill_on_page_load').default(false),
  uris: jsonb('uris').$type<Array<{uri: string, match?: number}>>().default([]),
});

// Document data for file entries  
export const cipherDocuments = pgTable('cipher_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  cipherId: uuid('cipher_id').references(() => ciphers.id).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  size: integer('size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  encrypted: boolean('encrypted').default(true).notNull(),
  signed: boolean('signed').default(false),
  s3Key: text('s3_key'), // MinIO/S3 storage key
  uploadDate: timestamp('upload_date').defaultNow().notNull(),
  docusignEnvelopeId: varchar('docusign_envelope_id', { length: 100 }),
  sharedWith: jsonb('shared_with').$type<string[]>().default([]),
});

// Card data for credit cards
export const cipherCards = pgTable('cipher_cards', {
  id: uuid('id').primaryKey().defaultRandom(),
  cipherId: uuid('cipher_id').references(() => ciphers.id).notNull(),
  encryptedCardholderName: text('encrypted_cardholder_name'),
  encryptedNumber: text('encrypted_number'),
  encryptedBrand: text('encrypted_brand'),
  encryptedExpMonth: text('encrypted_exp_month'),
  encryptedExpYear: text('encrypted_exp_year'),
  encryptedCode: text('encrypted_code'),
});

// Identity data for personal information
export const cipherIdentities = pgTable('cipher_identities', {
  id: uuid('id').primaryKey().defaultRandom(),
  cipherId: uuid('cipher_id').references(() => ciphers.id).notNull(),
  encryptedTitle: text('encrypted_title'),
  encryptedFirstName: text('encrypted_first_name'),
  encryptedMiddleName: text('encrypted_middle_name'),
  encryptedLastName: text('encrypted_last_name'),
  encryptedAddress1: text('encrypted_address1'),
  encryptedAddress2: text('encrypted_address2'),
  encryptedAddress3: text('encrypted_address3'),
  encryptedCity: text('encrypted_city'),
  encryptedState: text('encrypted_state'),
  encryptedPostalCode: text('encrypted_postal_code'),
  encryptedCountry: text('encrypted_country'),
  encryptedCompany: text('encrypted_company'),
  encryptedEmail: text('encrypted_email'),
  encryptedPhone: text('encrypted_phone'),
  encryptedSsn: text('encrypted_ssn'),
  encryptedUsername: text('encrypted_username'),
  encryptedPassportNumber: text('encrypted_passport_number'),
  encryptedLicenseNumber: text('encrypted_license_number'),
});

// Password history for tracking changes
export const passwordHistory = pgTable('password_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  cipherId: uuid('cipher_id').references(() => ciphers.id).notNull(),
  encryptedPassword: text('encrypted_password').notNull(),
  lastUsedDate: timestamp('last_used_date').defaultNow().notNull(),
});

// Emergency access for family members
export const emergencyAccess = pgTable('emergency_access', {
  id: uuid('id').primaryKey().defaultRandom(),
  grantorId: uuid('grantor_id').references(() => users.id).notNull(),
  granteeId: uuid('grantee_id').references(() => users.id).notNull(),
  type: varchar('type', { length: 20 }).notNull(), // view, takeover
  waitTimeDays: integer('wait_time_days').notNull(),
  status: varchar('status', { length: 30 }).default('invited').notNull(),
  emergencyKeyEncrypted: text('emergency_key_encrypted'),
  requestInitiated: timestamp('request_initiated'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Audit logs for security monitoring
export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  organizationId: uuid('organization_id').references(() => organizations.id),
  action: varchar('action', { length: 100 }).notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  resourceId: uuid('resource_id'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
});

// Sessions for authentication
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: text('token').unique().notNull(),
  refreshToken: text('refresh_token').unique().notNull(),
  deviceType: varchar('device_type', { length: 50 }),
  deviceName: varchar('device_name', { length: 100 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  organizations: many(organizations),
  organizationMemberships: many(organizationUsers),
  ciphers: many(ciphers),
  folders: many(folders),
  sessions: many(sessions),
  auditLogs: many(auditLogs),
  emergencyAccessAsGrantor: many(emergencyAccess, { relationName: 'grantor' }),
  emergencyAccessAsGrantee: many(emergencyAccess, { relationName: 'grantee' }),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  owner: one(users, { fields: [organizations.ownerId], references: [users.id] }),
  members: many(organizationUsers),
  ciphers: many(ciphers),
  folders: many(folders),
}));

export const ciphersRelations = relations(ciphers, ({ one, many }) => ({
  user: one(users, { fields: [ciphers.userId], references: [users.id] }),
  organization: one(organizations, { fields: [ciphers.organizationId], references: [organizations.id] }),
  folder: one(folders, { fields: [ciphers.folderId], references: [folders.id] }),
  login: one(cipherLogins),
  document: one(cipherDocuments),
  card: one(cipherCards),
  identity: one(cipherIdentities),
  passwordHistory: many(passwordHistory),
}));