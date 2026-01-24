# Praxis AI - Praxis AI Platform

> A comprehensive clinical workflow management system for healthcare professionals managing NDIS participants.

**Designed and developed by [JD Digital Systems](https://jddigitalsystems.com)**

---

## Overview

Praxis AI (branded as **Praxis AI Platform**) is a modern, AI-powered clinical workflow management platform built for occupational therapists and healthcare professionals managing NDIS (National Disability Insurance Scheme) participants. The system streamlines participant management, report generation, compliance tracking, and clinical documentation through intelligent automation and intuitive design.

### Key Features

- **Dashboard Analytics**: Real-time insights into active participants, billable hours, AI processing queue, and pending approvals
- **Participant Management**: Comprehensive participant profiles, session tracking, and progress monitoring
- **AI-Powered Reports**: Automated generation of clinical reports with confidence scoring and human review workflows
- **NDIS Compliance**: Built-in support for NDIS plans, audits, and regulatory requirements
- **Clinical Toolkit**: Access to specialized tools for assessments and documentation
- **Dark Mode Support**: Full light/dark theme support for comfortable extended use
- **Real-time Collaboration**: Multi-user support with role-based access control

### Designed for Scale

Praxis AI is architected to support thousands of concurrent users while maintaining performance, data integrity, and compliance with healthcare regulations including:

- NDIS Quality and Safeguards Commission standards
- Privacy Act 1988 (Australian privacy principles)
- Healthcare data security best practices
- Audit logging and compliance reporting

---

## Technology Stack

### Frontend
- **Next.js 16.1.4** - React framework with App Router
- **React 19.2.3** - UI component library
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling with custom design system
- **Lucide React** - Modern icon library
- **Chart.js** - Data visualization

### Design System
- Custom color palette optimized for clinical workflows
- Inter font family for optimal readability
- Responsive layouts supporting mobile, tablet, and desktop
- Accessibility-first component design
- Consistent spacing and elevation system

---

## Project Structure

```
Praxis-AI/
├── .designs/               # UI design mockups and prototypes
│   ├── dashboard.html/png  # Main dashboard interface
│   ├── participants.html/png # Participant management
│   ├── reports.html/png    # Reports and documentation
│   ├── ai.html/png         # AI Assistant interface
│   ├── toolkit.html/png    # Clinical toolkit
│   ├── ndisplans.html/png  # NDIS plan management
│   ├── general.html/png    # General settings
│   └── profile.html/png    # User profile management
├── praxis-ai/            # Next.js application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # Reusable UI components
│   │   └── lib/           # Utility functions and helpers
│   ├── public/            # Static assets
│   └── package.json       # Dependencies
└── README.md              # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** 20.x or higher
- **npm** or **pnpm** package manager
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Praxis-AI/praxis-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

---

## Documentation

For comprehensive documentation, please refer to:

- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) - System architecture and design decisions
- [API.md](./docs/API.md) - Complete API reference and integration guide
- [DEPLOYMENT.md](./docs/DEPLOYMENT.md) - Deployment and environment setup
- [CLAUDE.md](./docs/CLAUDE.md) - AI integration and development guidelines
- [TESTING.md](./docs/TESTING.md) - Testing strategies and guidelines
- [CONTRIBUTING.md](./CONTRIBUTING.md) - Contribution guidelines
- [SECURITY.md](./SECURITY.md) - Security policies and vulnerability reporting
- [CHANGELOG.md](./CHANGELOG.md) - Version history and updates

---

## Roadmap

### Phase 1 - Foundation (Current)
- [x] UI/UX design system
- [ ] Core participant management
- [ ] Dashboard analytics
- [ ] Authentication and authorization

### Phase 2 - AI Integration
- [ ] AI-powered report generation
- [ ] Natural language processing for clinical notes
- [ ] Confidence scoring and review workflows
- [ ] Template management system

### Phase 3 - Compliance & Scale
- [ ] NDIS compliance automation
- [ ] Audit logging and reporting
- [ ] Multi-tenancy support
- [ ] Performance optimization for 1000+ concurrent users

### Phase 4 - Advanced Features
- [ ] Mobile applications (iOS/Android)
- [ ] Voice-to-text documentation
- [ ] Predictive analytics
- [ ] Integration marketplace

---

## Support & Maintenance

**Developed by**: [JD Digital Systems](https://jddigitalsystems.com)

For support, feature requests, or bug reports, please contact:
- Email: support@jddigitalsystems.com
- Website: [https://jddigitalsystems.com](https://jddigitalsystems.com)

---

## License

Copyright © 2024-2026 JD Digital Systems. All rights reserved.

This software is proprietary and confidential. Unauthorized copying, distribution, or use of this software, via any medium, is strictly prohibited.

---

## Acknowledgments

Built with modern web technologies and a commitment to improving clinical workflows for healthcare professionals supporting NDIS participants across Australia.

**JD Digital Systems** - Transforming Healthcare Through Technology
