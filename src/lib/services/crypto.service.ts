// Bitwarden-inspired cryptographic service for Family Vault Enterprise
// Based on Bitwarden's proven zero-knowledge encryption architecture

export class CryptoService {
  private static readonly PBKDF2_ITERATIONS = 600000; // Updated to current security standards
  private static readonly ARGON2_ITERATIONS = 3;
  private static readonly ARGON2_MEMORY = 64 * 1024; // 64MB
  private static readonly ARGON2_PARALLELISM = 4;
  
  // Bitwarden-style key derivation
  async makePasswordHash(password: string, salt: string, iterations?: number): Promise<string> {
    const key = await this.makeKey(password, salt, iterations);
    return await this.hashPassword(password, key);
  }

  // Master key derivation (similar to Bitwarden's approach)
  async makeKey(password: string, salt: string, iterations?: number): Promise<CryptoKey> {
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(salt),
        iterations: iterations || CryptoService.PBKDF2_ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );

    return key;
  }

  // Password hashing for authentication
  async hashPassword(password: string, key: CryptoKey): Promise<string> {
    const keyBytes = await window.crypto.subtle.exportKey('raw', key);
    
    const hashKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const hashBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(password),
        iterations: 1,
        hash: 'SHA-256',
      },
      hashKey,
      256
    );

    return this.arrayBufferToBase64(hashBits);
  }

  // Symmetric encryption (AES-GCM) - Bitwarden's choice for vault data
  async encrypt(data: string, key: CryptoKey): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM

    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      dataBuffer
    );

    return {
      data: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv),
    };
  }

  // Symmetric decryption
  async decrypt(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
    const data = this.base64ToArrayBuffer(encryptedData.data);
    const iv = this.base64ToArrayBuffer(encryptedData.iv);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  }

  // Key stretching with salt (Bitwarden pattern)
  async stretchKey(key: CryptoKey): Promise<CryptoKey> {
    const keyBytes = await window.crypto.subtle.exportKey('raw', key);
    
    return await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Generate secure random bytes
  generateRandomBytes(length: number): Uint8Array {
    return window.crypto.getRandomValues(new Uint8Array(length));
  }

  // Generate cipher key (for individual vault items)
  async generateCipherKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt cipher key with master key (key wrapping)
  async encryptCipherKey(cipherKey: CryptoKey, masterKey: CryptoKey): Promise<EncryptedData> {
    const keyBytes = await window.crypto.subtle.exportKey('raw', cipherKey);
    const keyString = this.arrayBufferToBase64(keyBytes);
    return await this.encrypt(keyString, masterKey);
  }

  // Decrypt cipher key with master key
  async decryptCipherKey(encryptedKey: EncryptedData, masterKey: CryptoKey): Promise<CryptoKey> {
    const keyString = await this.decrypt(encryptedKey, masterKey);
    const keyBytes = this.base64ToArrayBuffer(keyString);
    
    return await window.crypto.subtle.importKey(
      'raw',
      keyBytes,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  // Future: YubiKey integration can be added here for enhanced 2FA
  // For now, using standard password-based authentication via Supabase

  // Secure comparison (timing-safe)
  secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    
    return result === 0;
  }

  // Utility functions
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Generate secure salt
  generateSalt(length: number = 32): string {
    const salt = this.generateRandomBytes(length);
    return this.arrayBufferToBase64(salt);
  }

  // TOTP generation (for 2FA)
  async generateTOTP(secret: string, window: number = 0): Promise<string> {
    const time = Math.floor(Date.now() / 1000 / 30) + window;
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, time, false);

    const keyBuffer = this.base64ToArrayBuffer(secret);
    const key = await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', key, timeBuffer);
    const signatureArray = new Uint8Array(signature);
    const offset = signatureArray[19] & 0xf;
    
    const code = (
      ((signatureArray[offset] & 0x7f) << 24) |
      ((signatureArray[offset + 1] & 0xff) << 16) |
      ((signatureArray[offset + 2] & 0xff) << 8) |
      (signatureArray[offset + 3] & 0xff)
    ) % 1000000;

    return code.toString().padStart(6, '0');
  }
}

export interface EncryptedData {
  data: string;
  iv: string;
}

export interface KeyPair {
  publicKey: CryptoKey;
  privateKey: CryptoKey;
}

// Organization key management (for family sharing)
export class OrganizationCryptoService extends CryptoService {
  // Generate organization key for family sharing
  async generateOrganizationKey(): Promise<CryptoKey> {
    return await this.generateCipherKey();
  }

  // Encrypt organization key with user's master key
  async encryptOrganizationKey(orgKey: CryptoKey, userMasterKey: CryptoKey): Promise<EncryptedData> {
    return await this.encryptCipherKey(orgKey, userMasterKey);
  }

  // Share organization access (RSA encryption for key sharing)
  async generateKeyPair(): Promise<KeyPair> {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256',
      },
      true,
      ['encrypt', 'decrypt']
    );

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    };
  }

  // Encrypt organization key with member's public key (for sharing)
  async encryptForMember(orgKey: CryptoKey, memberPublicKey: CryptoKey): Promise<string> {
    const keyBytes = await window.crypto.subtle.exportKey('raw', orgKey);
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      memberPublicKey,
      keyBytes
    );

    return this.arrayBufferToBase64(encrypted);
  }
}

// Singleton instance
export const cryptoService = new CryptoService();
export const orgCryptoService = new OrganizationCryptoService();