// Database initialization script for Family Vault Enterprise
// Runs on Vercel to create tables in Neon database

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

async function initDatabase() {
  console.log('🚀 Initializing Family Vault Enterprise database...');

  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash TEXT NOT NULL,
        salt TEXT NOT NULL,
        master_key_hash TEXT NOT NULL,
        encrypted_user_key TEXT NOT NULL,
        yubikey_ids JSONB DEFAULT '[]'::jsonb,
        email_verified BOOLEAN DEFAULT false,
        two_factor_enabled BOOLEAN DEFAULT false,
        emergency_access_enabled BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true NOT NULL
      );
    `;

    // Create organizations table
    await sql`
      CREATE TABLE IF NOT EXISTS organizations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        owner_id UUID REFERENCES users(id) NOT NULL,
        encrypted_org_key TEXT NOT NULL,
        plan_type VARCHAR(50) DEFAULT 'family' NOT NULL,
        max_members INTEGER DEFAULT 6 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create organization_users table
    await sql`
      CREATE TABLE IF NOT EXISTS organization_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) NOT NULL,
        user_id UUID REFERENCES users(id) NOT NULL,
        role VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        permissions JSONB DEFAULT '[]'::jsonb,
        encrypted_org_key TEXT,
        joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
        last_access TIMESTAMP
      );
    `;

    // Create folders table
    await sql`
      CREATE TABLE IF NOT EXISTS folders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        organization_id UUID REFERENCES organizations(id),
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create ciphers table
    await sql`
      CREATE TABLE IF NOT EXISTS ciphers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        organization_id UUID REFERENCES organizations(id),
        folder_id UUID REFERENCES folders(id),
        type INTEGER NOT NULL,
        encrypted_name TEXT NOT NULL,
        encrypted_notes TEXT,
        favorite BOOLEAN DEFAULT false NOT NULL,
        reprompt INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        deleted_at TIMESTAMP
      );
    `;

    // Create cipher_logins table
    await sql`
      CREATE TABLE IF NOT EXISTS cipher_logins (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cipher_id UUID REFERENCES ciphers(id) NOT NULL,
        encrypted_username TEXT,
        encrypted_password TEXT,
        encrypted_totp TEXT,
        password_revision_date TIMESTAMP,
        autofill_on_page_load BOOLEAN DEFAULT false,
        uris JSONB DEFAULT '[]'::jsonb
      );
    `;

    // Create cipher_documents table
    await sql`
      CREATE TABLE IF NOT EXISTS cipher_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cipher_id UUID REFERENCES ciphers(id) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        size INTEGER NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        category VARCHAR(100) NOT NULL,
        encrypted BOOLEAN DEFAULT true NOT NULL,
        signed BOOLEAN DEFAULT false,
        s3_key TEXT,
        upload_date TIMESTAMP DEFAULT NOW() NOT NULL,
        docusign_envelope_id VARCHAR(100),
        shared_with JSONB DEFAULT '[]'::jsonb
      );
    `;

    // Create cipher_cards table
    await sql`
      CREATE TABLE IF NOT EXISTS cipher_cards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cipher_id UUID REFERENCES ciphers(id) NOT NULL,
        encrypted_cardholder_name TEXT,
        encrypted_number TEXT,
        encrypted_brand TEXT,
        encrypted_exp_month TEXT,
        encrypted_exp_year TEXT,
        encrypted_code TEXT
      );
    `;

    // Create cipher_identities table
    await sql`
      CREATE TABLE IF NOT EXISTS cipher_identities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cipher_id UUID REFERENCES ciphers(id) NOT NULL,
        encrypted_title TEXT,
        encrypted_first_name TEXT,
        encrypted_middle_name TEXT,
        encrypted_last_name TEXT,
        encrypted_address1 TEXT,
        encrypted_address2 TEXT,
        encrypted_address3 TEXT,
        encrypted_city TEXT,
        encrypted_state TEXT,
        encrypted_postal_code TEXT,
        encrypted_country TEXT,
        encrypted_company TEXT,
        encrypted_email TEXT,
        encrypted_phone TEXT,
        encrypted_ssn TEXT,
        encrypted_username TEXT,
        encrypted_passport_number TEXT,
        encrypted_license_number TEXT
      );
    `;

    // Create password_history table
    await sql`
      CREATE TABLE IF NOT EXISTS password_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cipher_id UUID REFERENCES ciphers(id) NOT NULL,
        encrypted_password TEXT NOT NULL,
        last_used_date TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create emergency_access table
    await sql`
      CREATE TABLE IF NOT EXISTS emergency_access (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        grantor_id UUID REFERENCES users(id) NOT NULL,
        grantee_id UUID REFERENCES users(id) NOT NULL,
        type VARCHAR(20) NOT NULL,
        wait_time_days INTEGER NOT NULL,
        status VARCHAR(30) DEFAULT 'invited' NOT NULL,
        emergency_key_encrypted TEXT,
        request_initiated TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create sessions table
    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) NOT NULL,
        token TEXT UNIQUE NOT NULL,
        refresh_token TEXT UNIQUE NOT NULL,
        device_type VARCHAR(50),
        device_name VARCHAR(100),
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        last_activity TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    // Create audit_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES users(id),
        organization_id UUID REFERENCES organizations(id),
        action VARCHAR(100) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id UUID,
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSONB,
        timestamp TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `;

    console.log('✅ Database tables created successfully!');

    // Create indexes for performance
    console.log('🔧 Creating indexes...');

    await sql`CREATE INDEX IF NOT EXISTS idx_ciphers_user_id ON ciphers(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ciphers_type ON ciphers(type);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_ciphers_organization_id ON ciphers(organization_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);`;

    console.log('✅ Database indexes created successfully!');
    console.log('🎉 Family Vault Enterprise database is ready!');

  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default initDatabase;