// Bitwarden-inspired vault service for Family Vault Enterprise
// Provides zero-knowledge encryption and secure data management

import { CipherData, CipherType, LoginData, DocumentData, FamilyMemberData } from '../models/cipher.models';
import { cryptoService, orgCryptoService, EncryptedData } from './crypto.service';

export interface VaultState {
  ciphers: CipherData[];
  folders: FolderData[];
  organizations: OrganizationData[];
  collections: CollectionData[];
  masterKey?: CryptoKey;
  userKey?: CryptoKey;
}

export interface FolderData {
  id: string;
  name: string;
  revisionDate: string;
}

export interface OrganizationData {
  id: string;
  name: string;
  key?: CryptoKey;
  keyEncrypted?: EncryptedData;
  members?: FamilyMemberData[];
}

export interface CollectionData {
  id: string;
  organizationId: string;
  name: string;
  readOnly: boolean;
}

export class VaultService {
  private vaultState: VaultState = {
    ciphers: [],
    folders: [],
    organizations: [],
    collections: [],
  };

  // Initialize vault with master password (Supabase handles auth)
  async initializeVault(email: string, password: string): Promise<void> {
    const salt = this.getUserSalt(email);
    
    // Derive master key using password
    this.vaultState.masterKey = await cryptoService.makeKey(password, salt);

    // Generate user symmetric key (for faster operations)
    this.vaultState.userKey = await cryptoService.generateCipherKey();

    // Sync with Supabase database
    await this.syncVault();
  }

  // Add a new password to the vault
  async addLogin(data: {
    name: string;
    username?: string;
    password?: string;
    uri?: string;
    totp?: string;
    notes?: string;
    folderId?: string;
    favorite?: boolean;
  }): Promise<CipherData> {
    if (!this.vaultState.userKey) {
      throw new Error('Vault not initialized');
    }

    const cipher = new CipherData({
      id: this.generateId(),
      type: CipherType.Login,
      name: data.name,
      notes: data.notes,
      favorite: data.favorite || false,
      folderId: data.folderId,
      login: {
        username: data.username,
        password: data.password,
        totp: data.totp,
        uris: data.uri ? [{ uri: data.uri }] : [],
      },
    });

    // Encrypt the cipher
    const encryptedCipher = await this.encryptCipher(cipher);
    this.vaultState.ciphers.push(encryptedCipher);

    // In real implementation, sync with server
    await this.saveToServer(encryptedCipher);

    return cipher;
  }

  // Add a document to the vault
  async addDocument(data: {
    name: string;
    file: File;
    category: string;
    notes?: string;
    folderId?: string;
  }): Promise<CipherData> {
    if (!this.vaultState.userKey) {
      throw new Error('Vault not initialized');
    }

    const cipher = new CipherData({
      id: this.generateId(),
      type: CipherType.Document,
      name: data.name,
      notes: data.notes,
      folderId: data.folderId,
      document: {
        fileName: data.file.name,
        size: data.file.size,
        sizeName: this.formatFileSize(data.file.size),
        mimeType: data.file.type,
        encrypted: true,
        signed: false,
        category: data.category,
        uploadDate: new Date().toISOString(),
        sharedWith: [],
      },
    });

    // Encrypt the file contents
    const fileBuffer = await data.file.arrayBuffer();
    const fileData = new TextDecoder().decode(fileBuffer);
    const encryptedFile = await cryptoService.encrypt(fileData, this.vaultState.userKey);

    // Store encrypted file (in real implementation, this would go to S3/MinIO)
    await this.storeEncryptedFile(cipher.id!, encryptedFile);

    const encryptedCipher = await this.encryptCipher(cipher);
    this.vaultState.ciphers.push(encryptedCipher);

    return cipher;
  }

  // Get decrypted ciphers by type
  async getCiphersByType(type: CipherType): Promise<CipherData[]> {
    if (!this.vaultState.userKey) {
      return [];
    }

    const filteredCiphers = this.vaultState.ciphers.filter(c => c.type === type);
    const decryptedCiphers: CipherData[] = [];

    for (const cipher of filteredCiphers) {
      try {
        const decrypted = await this.decryptCipher(cipher);
        decryptedCiphers.push(decrypted);
      } catch (error) {
        console.error('Failed to decrypt cipher:', cipher.id, error);
      }
    }

    return decryptedCiphers;
  }

  // Search ciphers (encrypted search would be more complex in real implementation)
  async searchCiphers(query: string): Promise<CipherData[]> {
    if (!this.vaultState.userKey) {
      return [];
    }

    const allCiphers = await this.getAllDecryptedCiphers();
    return allCiphers.filter(cipher => 
      cipher.name?.toLowerCase().includes(query.toLowerCase()) ||
      cipher.notes?.toLowerCase().includes(query.toLowerCase()) ||
      (cipher.login?.username?.toLowerCase().includes(query.toLowerCase())) ||
      (cipher.login?.uris?.some(uri => uri.uri?.toLowerCase().includes(query.toLowerCase())))
    );
  }

  // Update cipher
  async updateCipher(cipherData: CipherData): Promise<void> {
    if (!this.vaultState.userKey) {
      throw new Error('Vault not initialized');
    }

    const index = this.vaultState.ciphers.findIndex(c => c.id === cipherData.id);
    if (index === -1) {
      throw new Error('Cipher not found');
    }

    cipherData.revisionDate = new Date().toISOString();
    const encryptedCipher = await this.encryptCipher(cipherData);
    this.vaultState.ciphers[index] = encryptedCipher;

    await this.saveToServer(encryptedCipher);
  }

  // Delete cipher
  async deleteCipher(cipherId: string): Promise<void> {
    const index = this.vaultState.ciphers.findIndex(c => c.id === cipherId);
    if (index === -1) {
      throw new Error('Cipher not found');
    }

    this.vaultState.ciphers.splice(index, 1);
    await this.deleteFromServer(cipherId);
  }

  // Family/Organization features
  async shareWithFamily(cipherId: string, memberIds: string[]): Promise<void> {
    if (!this.vaultState.organizations.length) {
      throw new Error('No family organization found');
    }

    const organization = this.vaultState.organizations[0];
    if (!organization.key) {
      throw new Error('Organization key not available');
    }

    const cipher = this.vaultState.ciphers.find(c => c.id === cipherId);
    if (!cipher) {
      throw new Error('Cipher not found');
    }

    // Re-encrypt with organization key for sharing
    const decryptedCipher = await this.decryptCipher(cipher);
    const orgEncryptedCipher = await this.encryptCipherWithKey(decryptedCipher, organization.key);

    // Add to organization collection
    orgEncryptedCipher.organizationId = organization.id;
    
    await this.saveToServer(orgEncryptedCipher);
  }

  // Emergency access
  async setupEmergencyAccess(contactEmail: string, waitTimeDays: number): Promise<void> {
    // In real implementation, this would create emergency access records
    // and handle secure key sharing for emergency contacts
    const emergencyAccess = {
      id: this.generateId(),
      contactEmail,
      waitTimeDays,
      status: 'invited',
      createdDate: new Date().toISOString(),
    };

    // Send invitation to emergency contact
    await this.sendEmergencyAccessInvitation(emergencyAccess);
  }

  // Breach detection (integrate with Have I Been Pwned)
  async checkPasswordBreaches(): Promise<{ cipherId: string; breachCount: number }[]> {
    const logins = await this.getCiphersByType(CipherType.Login);
    const breachResults: { cipherId: string; breachCount: number }[] = [];

    for (const cipher of logins) {
      if (cipher.login?.password) {
        const breachCount = await this.checkPasswordBreach(cipher.login.password);
        if (breachCount > 0) {
          breachResults.push({ cipherId: cipher.id!, breachCount });
        }
      }
    }

    return breachResults;
  }

  // Generate secure password
  generatePassword(options: {
    length: number;
    includeUppercase: boolean;
    includeLowercase: boolean;
    includeNumbers: boolean;
    includeSymbols: boolean;
    avoidAmbiguous: boolean;
  }): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const ambiguous = '0O1lI';

    let charset = '';
    if (options.includeUppercase) charset += uppercase;
    if (options.includeLowercase) charset += lowercase;
    if (options.includeNumbers) charset += numbers;
    if (options.includeSymbols) charset += symbols;

    if (options.avoidAmbiguous) {
      for (const char of ambiguous) {
        charset = charset.replace(new RegExp(char, 'g'), '');
      }
    }

    let password = '';
    const randomValues = cryptoService.generateRandomBytes(options.length);
    
    for (let i = 0; i < options.length; i++) {
      password += charset[randomValues[i] % charset.length];
    }

    return password;
  }

  // Private helper methods
  private async encryptCipher(cipher: CipherData): Promise<CipherData> {
    if (!this.vaultState.userKey) {
      throw new Error('No encryption key available');
    }

    const encryptedCipher = new CipherData(cipher);

    // Encrypt sensitive fields
    if (cipher.name) {
      const encrypted = await cryptoService.encrypt(cipher.name, this.vaultState.userKey);
      encryptedCipher.name = this.encodeEncryptedData(encrypted);
    }

    if (cipher.notes) {
      const encrypted = await cryptoService.encrypt(cipher.notes, this.vaultState.userKey);
      encryptedCipher.notes = this.encodeEncryptedData(encrypted);
    }

    if (cipher.login) {
      encryptedCipher.login = await this.encryptLoginData(cipher.login, this.vaultState.userKey);
    }

    return encryptedCipher;
  }

  private async encryptCipherWithKey(cipher: CipherData, key: CryptoKey): Promise<CipherData> {
    const encryptedCipher = new CipherData(cipher);

    if (cipher.name) {
      const encrypted = await cryptoService.encrypt(cipher.name, key);
      encryptedCipher.name = this.encodeEncryptedData(encrypted);
    }

    if (cipher.notes) {
      const encrypted = await cryptoService.encrypt(cipher.notes, key);
      encryptedCipher.notes = this.encodeEncryptedData(encrypted);
    }

    if (cipher.login) {
      encryptedCipher.login = await this.encryptLoginData(cipher.login, key);
    }

    return encryptedCipher;
  }

  private async decryptCipher(encryptedCipher: CipherData): Promise<CipherData> {
    if (!this.vaultState.userKey) {
      throw new Error('No decryption key available');
    }

    const cipher = new CipherData(encryptedCipher);

    // Decrypt fields
    if (encryptedCipher.name && this.isEncrypted(encryptedCipher.name)) {
      const encryptedData = this.decodeEncryptedData(encryptedCipher.name);
      cipher.name = await cryptoService.decrypt(encryptedData, this.vaultState.userKey);
    }

    if (encryptedCipher.notes && this.isEncrypted(encryptedCipher.notes)) {
      const encryptedData = this.decodeEncryptedData(encryptedCipher.notes);
      cipher.notes = await cryptoService.decrypt(encryptedData, this.vaultState.userKey);
    }

    if (encryptedCipher.login) {
      cipher.login = await this.decryptLoginData(encryptedCipher.login, this.vaultState.userKey);
    }

    return cipher;
  }

  private async encryptLoginData(login: LoginData, key: CryptoKey): Promise<LoginData> {
    const encryptedLogin: LoginData = { ...login };

    if (login.username) {
      const encrypted = await cryptoService.encrypt(login.username, key);
      encryptedLogin.username = this.encodeEncryptedData(encrypted);
    }

    if (login.password) {
      const encrypted = await cryptoService.encrypt(login.password, key);
      encryptedLogin.password = this.encodeEncryptedData(encrypted);
    }

    if (login.totp) {
      const encrypted = await cryptoService.encrypt(login.totp, key);
      encryptedLogin.totp = this.encodeEncryptedData(encrypted);
    }

    return encryptedLogin;
  }

  private async decryptLoginData(encryptedLogin: LoginData, key: CryptoKey): Promise<LoginData> {
    const login: LoginData = { ...encryptedLogin };

    if (encryptedLogin.username && this.isEncrypted(encryptedLogin.username)) {
      const encryptedData = this.decodeEncryptedData(encryptedLogin.username);
      login.username = await cryptoService.decrypt(encryptedData, key);
    }

    if (encryptedLogin.password && this.isEncrypted(encryptedLogin.password)) {
      const encryptedData = this.decodeEncryptedData(encryptedLogin.password);
      login.password = await cryptoService.decrypt(encryptedData, key);
    }

    if (encryptedLogin.totp && this.isEncrypted(encryptedLogin.totp)) {
      const encryptedData = this.decodeEncryptedData(encryptedLogin.totp);
      login.totp = await cryptoService.decrypt(encryptedData, key);
    }

    return login;
  }

  private async getAllDecryptedCiphers(): Promise<CipherData[]> {
    const decrypted: CipherData[] = [];
    for (const cipher of this.vaultState.ciphers) {
      try {
        decrypted.push(await this.decryptCipher(cipher));
      } catch (error) {
        console.error('Failed to decrypt cipher:', error);
      }
    }
    return decrypted;
  }

  // Utility methods
  private generateId(): string {
    return crypto.randomUUID();
  }

  private getUserSalt(email: string): string {
    // In real implementation, this would come from the server
    return email; // Simplified for demo
  }

  private encodeEncryptedData(encrypted: EncryptedData): string {
    return `encrypted:${encrypted.iv}:${encrypted.data}`;
  }

  private decodeEncryptedData(encoded: string): EncryptedData {
    const parts = encoded.split(':');
    if (parts.length !== 3 || parts[0] !== 'encrypted') {
      throw new Error('Invalid encrypted data format');
    }
    return { iv: parts[1], data: parts[2] };
  }

  private isEncrypted(value: string): boolean {
    return value.startsWith('encrypted:');
  }

  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  // Mock external service calls (would be real API calls)
  private async syncVault(): Promise<void> {
    // Load encrypted vault from server
    console.log('Syncing vault with server...');
  }

  private async saveToServer(cipher: CipherData): Promise<void> {
    console.log('Saving cipher to server:', cipher.id);
  }

  private async deleteFromServer(cipherId: string): Promise<void> {
    console.log('Deleting cipher from server:', cipherId);
  }

  private async storeEncryptedFile(cipherId: string, encryptedFile: EncryptedData): Promise<void> {
    console.log('Storing encrypted file for cipher:', cipherId);
  }

  private async sendEmergencyAccessInvitation(emergencyAccess: any): Promise<void> {
    console.log('Sending emergency access invitation:', emergencyAccess.contactEmail);
  }

  private async checkPasswordBreach(password: string): Promise<number> {
    // Simplified breach check - in real implementation, use Have I Been Pwned API
    const commonPasswords = ['password', '123456', 'password123', 'admin'];
    return commonPasswords.includes(password.toLowerCase()) ? 1 : 0;
  }
}

// Singleton instance
export const vaultService = new VaultService();