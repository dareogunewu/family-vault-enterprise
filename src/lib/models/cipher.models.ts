// Bitwarden-inspired data models for Family Vault Enterprise
// Based on Bitwarden's proven cipher and vault item architecture

export enum CipherType {
  Login = 1,
  SecureNote = 2,
  Card = 3,
  Identity = 4,
  SshKey = 5,
  Document = 6,
}

export enum CipherRepromptType {
  None = 0,
  Password = 1,
  Biometric = 2,
  // Yubikey = 3, // Can be added later
}

export enum UriMatchType {
  Domain = 0,
  Host = 1,
  StartsWith = 2,
  Exact = 3,
  RegularExpression = 4,
  Never = 5,
}

export interface LoginUriData {
  uri?: string;
  match?: UriMatchType;
  uriChecksum?: string;
}

export interface LoginData {
  username?: string;
  password?: string;
  passwordRevisionDate?: string;
  totp?: string;
  autofillOnPageLoad?: boolean;
  uris?: LoginUriData[];
  fido2Credentials?: Fido2CredentialData[];
}

export interface Fido2CredentialData {
  credentialId: string;
  keyType: string;
  keyAlgorithm: string;
  keyCurve: string;
  keyValue: string;
  rpId: string;
  rpName: string;
  userHandle?: string;
  userName?: string;
  userDisplayName?: string;
  counter: string;
  discoverable: string;
  creationDate: string;
}

export interface SecureNoteData {
  type: number;
}

export interface CardData {
  cardholderName?: string;
  number?: string;
  brand?: string;
  expMonth?: string;
  expYear?: string;
  code?: string;
}

export interface IdentityData {
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  address3?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  company?: string;
  email?: string;
  phone?: string;
  ssn?: string;
  username?: string;
  passportNumber?: string;
  licenseNumber?: string;
}

export interface DocumentData {
  fileName: string;
  size: number;
  sizeName: string;
  mimeType: string;
  encrypted: boolean;
  signed: boolean;
  category: string;
  uploadDate: string;
  sharedWith: string[];
  docusignEnvelopeId?: string;
}

export interface FieldData {
  type: number;
  name?: string;
  value?: string;
  linkedId?: number;
}

export interface AttachmentData {
  id?: string;
  url?: string;
  fileName?: string;
  key?: string;
  size?: number;
  sizeName?: string;
}

export interface PasswordHistoryData {
  password: string;
  lastUsedDate: string;
}

export interface CipherData {
  id?: string;
  organizationId?: string;
  folderId?: string;
  userId?: string;
  edit: boolean;
  viewPassword: boolean;
  organizationUseTotp: boolean;
  favorite: boolean;
  revisionDate: string;
  type: CipherType;
  name?: string;
  notes?: string;
  login?: LoginData;
  secureNote?: SecureNoteData;
  card?: CardData;
  identity?: IdentityData;
  document?: DocumentData;
  fields?: FieldData[];
  attachments?: AttachmentData[];
  passwordHistory?: PasswordHistoryData[];
  collectionIds?: string[];
  creationDate: string;
  deletedDate?: string;
  reprompt: CipherRepromptType;
  key?: string; // Encrypted cipher key
}

export class CipherData {
  id?: string;
  organizationId?: string;
  folderId?: string;
  userId?: string;
  edit: boolean;
  viewPassword: boolean;
  organizationUseTotp: boolean;
  favorite: boolean;
  revisionDate: string;
  type: CipherType;
  name?: string;
  notes?: string;
  login?: LoginData;
  secureNote?: SecureNoteData;
  card?: CardData;
  identity?: IdentityData;
  document?: DocumentData;
  fields?: FieldData[];
  attachments?: AttachmentData[];
  passwordHistory?: PasswordHistoryData[];
  collectionIds?: string[];
  creationDate: string;
  deletedDate?: string;
  reprompt: CipherRepromptType;
  key?: string;

  constructor(data?: Partial<CipherData>) {
    if (!data) {
      return;
    }

    this.id = data.id;
    this.organizationId = data.organizationId;
    this.folderId = data.folderId;
    this.userId = data.userId;
    this.edit = data.edit ?? true;
    this.viewPassword = data.viewPassword ?? true;
    this.organizationUseTotp = data.organizationUseTotp ?? false;
    this.favorite = data.favorite ?? false;
    this.revisionDate = data.revisionDate ?? new Date().toISOString();
    this.type = data.type ?? CipherType.Login;
    this.name = data.name;
    this.notes = data.notes;
    this.creationDate = data.creationDate ?? new Date().toISOString();
    this.deletedDate = data.deletedDate;
    this.reprompt = data.reprompt ?? CipherRepromptType.None;
    this.key = data.key;

    if (data.login) {
      this.login = {
        ...data.login,
        uris: data.login.uris?.map(uri => ({ ...uri })) || [],
        fido2Credentials: data.login.fido2Credentials?.map(cred => ({ ...cred })) || [],
      };
    }

    if (data.secureNote) {
      this.secureNote = { ...data.secureNote };
    }

    if (data.card) {
      this.card = { ...data.card };
    }

    if (data.identity) {
      this.identity = { ...data.identity };
    }

    if (data.document) {
      this.document = { ...data.document };
    }

    if (data.fields) {
      this.fields = data.fields.map(field => ({ ...field }));
    }

    if (data.attachments) {
      this.attachments = data.attachments.map(attachment => ({ ...attachment }));
    }

    if (data.passwordHistory) {
      this.passwordHistory = data.passwordHistory.map(history => ({ ...history }));
    }

    if (data.collectionIds) {
      this.collectionIds = [...data.collectionIds];
    }
  }

  static fromJSON(json: any): CipherData {
    return new CipherData({
      id: json.id,
      organizationId: json.organizationId,
      folderId: json.folderId,
      userId: json.userId,
      edit: json.edit,
      viewPassword: json.viewPassword,
      organizationUseTotp: json.organizationUseTotp,
      favorite: json.favorite,
      revisionDate: json.revisionDate,
      type: json.type,
      name: json.name,
      notes: json.notes,
      login: json.login,
      secureNote: json.secureNote,
      card: json.card,
      identity: json.identity,
      document: json.document,
      fields: json.fields,
      attachments: json.attachments,
      passwordHistory: json.passwordHistory,
      collectionIds: json.collectionIds,
      creationDate: json.creationDate,
      deletedDate: json.deletedDate,
      reprompt: json.reprompt,
      key: json.key,
    });
  }
}

export interface FolderData {
  id?: string;
  userId?: string;
  name?: string;
  revisionDate: string;
}

export interface CollectionData {
  id?: string;
  organizationId?: string;
  name?: string;
  readOnly?: boolean;
  hidePasswords?: boolean;
  manage?: boolean;
  externalId?: string;
}

// Family-specific extensions
export enum FamilyRole {
  Admin = 'admin',
  Member = 'member',
  Viewer = 'viewer',
  Emergency = 'emergency',
}

export interface FamilyMemberData {
  id: string;
  name: string;
  email: string;
  role: FamilyRole;
  status: 'active' | 'pending' | 'inactive';
  joinDate: string;
  lastAccess: string;
  permissions: string[];
  // yubiKeyIds?: string[]; // Can be added later for enhanced 2FA
}

export interface EmergencyAccessData {
  id?: string;
  emergencyContactId: string;
  grantor: string;
  grantee: string;
  type: 'view' | 'takeover';
  waitTimeDays: number;
  status: 'invited' | 'accepted' | 'confirmed' | 'recovery_initiated' | 'recovery_approved' | 'recovery_rejected';
  creationDate: string;
  revisionDate: string;
}