# Family Vault Enterprise

A comprehensive digital family vault application with enterprise-grade security, built with Next.js and inspired by Bitwarden's proven architecture.

## 🔐 Features

### Password Management
- **Zero-knowledge encryption** with ChaCha20-Poly1305
- **YubiKey FIDO2/WebAuthn** hardware authentication
- **Password strength analysis** and breach detection
- **Secure password generation** with customizable options
- **Auto-fill capabilities** for websites and applications

### Document Vault
- **Encrypted document storage** with client-side encryption
- **Drag & drop file upload** with support for multiple formats
- **Document categorization** and search functionality
- **Family sharing** with granular permissions
- **DocuSign integration** for legal document signing

### Family Access Management
- **Role-based permissions** (Admin, Member, Viewer, Emergency)
- **Secure invitation system** with encrypted email notifications
- **Real-time access control** and permission management
- **Audit trails** for all family member activities

### Legal Documents
- **DocuSign integration** for legally binding signatures
- **Estate planning tools** (Wills, Trusts, Power of Attorney)
- **Lawyer access management** with time-limited permissions
- **Document templates** for common legal needs
- **Notarization tracking** and witness management

### Security Features
- **Hardware security keys** (YubiKey) for authentication
- **End-to-end encryption** for all sensitive data
- **Zero-knowledge architecture** - even we can't see your data
- **Regular security audits** and breach monitoring
- **Emergency access protocols** for trusted contacts

## 🚀 Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **UI Components**: Shadcn/ui, Lucide React Icons
- **Authentication**: SimpleWebAuthn for FIDO2/WebAuthn
- **Encryption**: Web Crypto API with AES-GCM and ChaCha20-Poly1305
- **Database**: PostgreSQL with encryption at rest
- **File Storage**: MinIO S3-compatible storage
- **Deployment**: Vercel with automatic deployments

## 🛠 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- YubiKey or compatible FIDO2 device (recommended)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/family-vault-enterprise.git
   cd family-vault-enterprise/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔑 YubiKey Setup

1. **Purchase a YubiKey** from [Yubico](https://www.yubico.com/)
2. **Register your device** during account creation
3. **Enable FIDO2/WebAuthn** in security settings
4. **Test authentication** with your hardware key

## 🏗 Architecture

### Security Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   YubiKey       │    │  Client Browser  │    │  Encrypted DB   │
│  Hardware Key   │◄──►│  Zero-Knowledge  │◄──►│  Server Storage │
│  FIDO2/WebAuthn │    │  Encryption      │    │  AES-256        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### Data Flow
1. **Authentication**: YubiKey provides hardware-based 2FA
2. **Key Derivation**: Master password + hardware key = encryption keys
3. **Client Encryption**: All data encrypted before leaving your device
4. **Zero Knowledge**: Server never sees unencrypted data
5. **Family Sharing**: Re-encryption with shared organization keys

## 🔒 Security Considerations

- **Never store master passwords** - use hardware keys when possible
- **Regular backups** of your encrypted vault data
- **Emergency access setup** for trusted family members
- **Security key backup** - register multiple devices
- **Regular security audits** and password updates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [GitHub Wiki](https://github.com/YOUR_USERNAME/family-vault-enterprise/wiki)
- **Issues**: [GitHub Issues](https://github.com/YOUR_USERNAME/family-vault-enterprise/issues)
- **Security**: Create a security issue for vulnerabilities

## 🙏 Acknowledgments

- **Bitwarden** for inspiring the zero-knowledge architecture
- **Yubico** for pioneering hardware security keys
- **Next.js team** for the excellent framework
- **Vercel** for seamless deployment platform

## ⚠️ Disclaimer

This is a demonstration project showcasing enterprise security patterns. For production use, ensure:
- Professional security audit
- Proper key management infrastructure
- Compliance with relevant regulations (GDPR, HIPAA, etc.)
- Regular security updates and monitoring

---

**Family Vault Enterprise** - Securing families, one vault at a time. 🔐👨‍👩‍👧‍👦
