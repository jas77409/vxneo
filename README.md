# VXNeo - Privacy Audit Platform 🔐

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node](https://img.shields.io/badge/node-20.x-green.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](https://www.docker.com/)

> Open-source privacy audit platform for detecting data breaches, broker exposures, and calculating comprehensive privacy scores.

## ✨ Features

- 🔍 **Data Breach Detection** - Scan emails for compromised accounts via HIBP
- 📊 **Privacy Score Calculation** - Get a comprehensive 0-100 privacy rating
- 🎯 **Data Broker Tracking** - Identify where your personal data is being sold
- 🤖 **Automated Processing** - Background workers process audits automatically
- 🔐 **Secure Authentication** - Passwordless magic link authentication via Supabase
- 📱 **Modern Dashboard** - Real-time privacy statistics, breach details, and recommendations
- 🐳 **Docker Ready** - Complete containerized deployment with Docker Compose

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for development)
- Supabase account (free tier available)
- Domain with SSL certificate (for production)

### Installation
```bash
# Clone the repository
git clone https://github.com/yourusername/vxneo.git
cd vxneo

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials and API keys

# Start with Docker Compose
docker-compose up -d

# Access at http://localhost:3000
```

### Development Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📖 Documentation

- [Installation Guide](./docs/INSTALLATION.md) *(coming soon)*
- [Configuration](./docs/CONFIGURATION.md) *(coming soon)*
- [API Documentation](./docs/API.md) *(coming soon)*
- [Contributing Guidelines](./CONTRIBUTING.md)

## 🏗️ Architecture
```
┌─────────────────────────────────────────┐
│         NGINX (Port 443)                │
│         SSL Termination                  │
└──────────────┬──────────────────────────┘
               │
        ┌──────▼───────┐
        │  VXNeo Web   │ (SvelteKit - Port 3000)
        └──────┬───────┘
               │
    ┌──────────┼──────────────┐
    │          │              │
┌───▼───┐  ┌───▼────┐  ┌─────▼─────┐
│ Redis │  │Supabase│  │Browserless│
│(Cache)│  │  (DB)  │  │(Scraping) │
└───────┘  └───┬────┘  └───────────┘
               │
        ┌──────┴──────┐
        │             │
    ┌───▼────┐  ┌─────▼──────┐
    │ Audit  │  │  Scraper   │
    │ Worker │  │  Worker    │
    └────────┘  └────────────┘
```

## 🛠️ Tech Stack

**Frontend:**
- SvelteKit - Full-stack framework
- Tailwind CSS - Styling
- TypeScript - Type safety

**Backend:**
- Node.js 20 - Runtime
- Supabase - PostgreSQL database + Auth
- Redis - Caching and queuing

**Workers:**
- Background audit processing
- Data broker scraping
- Automated recommendations

**Infrastructure:**
- Docker & Docker Compose
- NGINX - Reverse proxy
- Prometheus & Grafana - Monitoring

## 🔐 Security

- Passwordless authentication via magic links
- Secure httpOnly cookies for session management
- Row Level Security (RLS) in database
- Environment-based secrets management
- SSL/TLS encryption in production

**Reporting Security Issues:** Please email security@vxneo.com

## 📊 Database Schema

Main tables:
- `audit_requests` - Audit queue and status
- `audit_results` - Detailed audit findings
- `removal_requests` - Data broker removal tracking
- `profiles` - User profile information

See database migrations in `supabase/migrations/` for complete schema.

## 🧪 Testing
```bash
# Run tests
npm test

# Run linter
npm run lint

# Format code
npm run format

# Health check
curl http://localhost:3000/api/system/health
```

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Have I Been Pwned](https://haveibeenpwned.com/) - Breach data API
- [Supabase](https://supabase.com/) - Backend infrastructure
- [SvelteKit](https://kit.svelte.dev/) - Application framework
- All contributors and users of VXNeo

## 📧 Contact

- **Website:** https://vxneo.com
- **Issues:** [GitHub Issues](https://github.com/yourusername/vxneo/issues)
- **Email:** contact@vxneo.com

## 🗺️ Roadmap

- [x] Core privacy audit functionality
- [x] Magic link authentication
- [x] Background worker system
- [x] Docker deployment
- [ ] Real-time breach monitoring
- [ ] Automated data broker removal
- [ ] Multi-email support per user
- [ ] Mobile application
- [ ] Browser extension
- [ ] API for third-party integrations

---

**Made with ❤️ for privacy**
