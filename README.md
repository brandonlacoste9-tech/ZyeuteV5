# Zyeuté - Quebec Social Media Platform with Ti-Guy AI 🤖
> Quebec's premier French-Canadian social media platform with Ti-Guy AI chatbot for authentic "*joual*" conversations 🇨🇦💬
[![TypeScript](https://img.shields.io/badge/TypeScript-97.6%25-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🤖 NEW: AI-Powered Development with Copilot Agents

**Automate your audit, fixes, and testing with 4 specialized AI agents:**

- 🚨 **SWE Agent** - Live site testing + bug fixes + PRs
- 🔐 **Security Agent** - Vulnerability scanning + code quality
- ✅ **CI/CD Agent** - Automated testing + GitHub Actions
- 📋 **Triage Agent** - Issue organization + prioritization

**Quick Start:** [AGENT_QUICK_START.md](AGENT_QUICK_START.md) *(3 steps, 5 minutes)*  
**Full Guide:** [COPILOT_AGENT_GUIDE.md](COPILOT_AGENT_GUIDE.md) *(Complete documentation)*  
**Project Plan:** [AUDIT_MASTER_TRACKER.md](AUDIT_MASTER_TRACKER.md) *(48-hour recovery plan)*

**Deploy Agents:** https://github.com/brandonlacoste9-tech/zyeute-v3/issues/new/choose

---

## 🎯 Phase 1 Status - Auth Standardization & Testing Infrastructure

**Status:** ✅ **COMPLETE** (December 15, 2025)  
**Branch:** `copilot/human-testing-validation`

### Completed Deliverables

#### 📋 Documentation
- ✅ **AUTH_AUDIT_LOG.md** - Complete authentication audit with grep scan results
- ✅ **BUTTON_AUDIT_SKELETON.md** - Phase 2 button component standardization framework
- ✅ **MEDIA_PLAYBOOK.md** - Comprehensive media handling guide (10+ scenarios)

#### 🔧 CI/CD Infrastructure
- ✅ **lighthouse-ci.yml** - Performance testing workflow with Lighthouse
- ✅ **test.yml** - Existing test suite validation (maintained)

#### 🧪 Testing Framework
- ✅ **auth.e2e.test.ts** - Authentication flow E2E test scaffolding
- ✅ **guestMode.e2e.test.ts** - Guest mode E2E test scaffolding  
- ✅ **loginFlow.e2e.test.ts** - Complete login flow E2E test scaffolding

### Key Findings

#### Authentication Status
- **Login Flow:** ✅ Fully migrated to Supabase client-side auth
- **Guest Mode:** ✅ Working with 24-hour localStorage-based sessions
- **Legacy Endpoints:** ⚠️ Some `/auth/me` calls still present (Phase 2 cleanup)
- **Admin Checks:** ⚠️ Uses Express session instead of Supabase metadata (Phase 2)

#### Security Assessment
- ✅ Modern Supabase authentication
- ✅ OAuth support (Google)
- ✅ Session persistence
- ⚠️ Mixed auth systems (Supabase + Express sessions)

### Next Steps (Phase 2)
1. Migrate admin checks to Supabase user metadata
2. Fix `useAuth` hook to use Supabase auth state
3. Remove legacy `/auth/me` endpoint dependencies
4. Implement E2E tests (Playwright/Cypress)
5. Complete button component standardization

**See:** [AUTH_AUDIT_LOG.md](./AUTH_AUDIT_LOG.md) for full details

---

## 📱 Overview

Zyeuté/KryptoTrac is a comprehensive social media and cryptocurrency tracking application built specifically for Quebec's French-speaking market. It features real-time interactions, portfolio and transaction management, advanced price alerts, Stripe payment integration, and a modern, responsive UI built with React and TypeScript.


## ✨ Features

### Core Functionality
- 🔐 **User Authentication** - Secure registration and login system
- 📝 **Real-time Feed** - Post and view content with live updates
- ❤️ **Social Interactions** - Like posts and engage with content
- 💬 **Messaging System** - Real-time chat with Socket.IO
- 🎁 **Virtual Gifts** - Send and receive virtual gifts to creators
- 💳 **Stripe Integration** - Secure payment processing for virtual currency and premium features
- 🎨 **Premium UI** - Beautiful gradient designs and animations
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🇫🇷 **French Interface** - Built for Quebec's Francophone community
- 📊 **Portfolio Tracking** - Track cryptocurrency holdings, performance, and analytics
- 🧾 **Transaction History** - Log, import, and export all trades and transfers
- 🚨 **Price Alerts** - Multi-channel notifications (email, in-app, push)
- 🛡️ **Sentry Monitoring** - Real-time error and performance monitoring

### Advanced Features
- 🎬 **Video Player** - Custom video playback with controls
- 📧 **Email Integration** - Resend email notifications
- 🎉 **Festive Animations** - Celebration effects for successful interactions
- 🔔 **Notification System** - Real-time updates and alerts
- 💰 **Monetization** - Creator earnings through virtual gifts
- 📊 **Analytics Ready** - Track user engagement and behavior

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Custom CSS with Tailwind CSS utilities
- **State Management:** React Hooks
- **Routing:** React Router v6
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Real-time:** Socket.IO
- **Payment:** Stripe API
- **Email:** Resend
- **Session:** Express-Session
- **Database:** Production-ready connection (Supabase/PostgreSQL)

### DevOps
- **Deployment:** Fly.io
- **Version Control:** Git/GitHub
- **Package Manager:** npm
- **TypeScript:** Full type safety

## 📂 Project Structure

```text
Package-Installer/
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── features/   # Feature-specific components
│   │   │   └── ui/         # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and helpers
│   │   └── App.tsx         # Main app component
│   ├── public/             # Static assets
│   └── vite.config.ts      # Vite configuration
├── server/                  # Backend Express application
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   ├── services/           # Business logic
│   └── index.ts            # Server entry point
├── shared/                  # Shared types and utilities
│   └── types.ts            # TypeScript interfaces
├── attached_assets/         # Media and static files
├── script/                  # Build and deployment scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager
- Stripe account (for payment features)
- Resend account (for email features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Northern-ventures1/Package-Installer.git
cd Package-Installer
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:
```bash
PORT=3000
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
RESEND_API_KEY=your_resend_api_key
DATABASE_URL=your_database_connection_string
SESSION_SECRET=your_session_secret
```

4. **Run the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:3000`

4. The app will automatically install dependencies and start

## 🧪 Testing & Evaluation

Zyeuté V3 includes a comprehensive evaluation framework for testing services, AI agents, and components:

### Running Tests
```bash
# Run all tests once
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Suite
- **118 Total Tests** across 8 test files
- **Unit Tests** - Authentication, validation, utilities (58 tests)
- **Integration Tests** - User flows and API integration (11 tests)
- **Component Tests** - UI components and pages (49 tests)
- **Coverage Target** - 80%+ code coverage

### Framework Features
- **Testing Infrastructure** - Vitest + React Testing Library
- **Evaluation System** - Automated service evaluation with metrics
- **Tracing System** - Distributed tracing for debugging and monitoring
- **Performance Monitoring** - Track latency, throughput, and statistics

### Documentation
See [EVALUATION_FRAMEWORK.md](./EVALUATION_FRAMEWORK.md) for complete documentation on:
- Writing tests for components and services
- Evaluating AI agents and APIs
- Using tracing and performance monitoring
- Best practices and examples

## 🔄 CI/CD Pipeline

Zyeuté V3 includes automated testing and deployment workflows powered by GitHub Actions:

### Workflows
- **✅ Test Suite** - Runs on every PR and push, includes:
  - TypeScript type checking
  - Unit and integration tests
  - Code coverage reporting
  - Build verification

- **🔐 Security Scan** - Automated security checks:
  - npm audit for vulnerabilities
  - Dependency review on PRs
  - Weekly scheduled scans

- **🚀 Staging Deployment** - Preview deployments:
  - Deploys to Vercel preview on every PR
  - Automatic PR comments with preview URL
  - Full test suite runs before deployment

- **🌐 Production Deployment** - Automated production releases:
  - Deploys to production on main branch merge
  - Health checks after deployment
  - Slack notifications (optional)

### Setup
See [CI_CD_SETUP.md](./CI_CD_SETUP.md) for complete documentation on:
- Configuring GitHub secrets
- Setting up branch protection rules
- Workflow customization
- Troubleshooting guide

### Status Badges
Add these to your repository for visibility:
```markdown
[![Tests](https://github.com/brandonlacoste9-tech/zyeute-v3/actions/workflows/test.yml/badge.svg)](https://github.com/brandonlacoste9-tech/zyeute-v3/actions/workflows/test.yml)
[![Security](https://github.com/brandonlacoste9-tech/zyeute-v3/actions/workflows/security.yml/badge.svg)](https://github.com/brandonlacoste9-tech/zyeute-v3/actions/workflows/security.yml)
```

## 📋 QA & Regression Guides

Zyeuté V3 maintains comprehensive quality assurance documentation and testing playbooks to ensure consistent quality and accessibility across all features.

### Authentication & Auth Flow

- **[AUTH_AUDIT_LOG.md](./AUTH_AUDIT_LOG.md)** - Complete audit of authentication endpoints
  - Documents all `/api/auth/*` usage across the frontend
  - Standardization strategy for Supabase client-side authentication
  - Guest mode session management utilities
  - Before/after snapshots for each refactored call site

### Accessibility (A11y) Testing

- **[BUTTON_A11Y_AUDIT.md](./BUTTON_A11Y_AUDIT.md)** - Button accessibility audit framework
  - Comprehensive checklists for all button components
  - Keyboard navigation testing procedures
  - Screen reader compatibility verification
  - WCAG 2.1 Level AA compliance tracking
  - Covers: `Button.tsx`, `GoldButton.tsx`, `ChatButton.tsx`, `ColonyTriggerButton.tsx`, password toggles, Follow/Unfollow buttons

### Media Testing

- **[MEDIA_TEST_PLAYBOOK.md](./MEDIA_TEST_PLAYBOOK.md)** - Video and image testing guide
  - Image upload/display testing scenarios
  - Video playback and streaming tests
  - Device/browser coverage matrix (Desktop, Mobile, Tablet)
  - Network condition testing (4G, 3G, Slow 3G, Offline)
  - Meta tag validation (Open Graph, Twitter Cards)
  - Performance benchmarks and optimization checks
  - Error handling and fallback scenarios
  - Accessibility requirements for media

### E2E Testing

- **[test/e2e/](./test/e2e/)** - End-to-end test suite
  - **[auth-flow.test.ts](./test/e2e/auth-flow.test.ts)** - Authentication flow tests scaffold
    - Login flow with valid/invalid credentials
    - Guest mode entry and session management
    - Signup flow with validation
    - Profile CRUD operations
    - Session persistence and management
    - Error scenario handling
  - **[test/README.md](./test/README.md)** - Testing guide and best practices

### CI/CD Quality Gates

- **[.github/workflows/test.yml](./.github/workflows/test.yml)** - Automated test suite
  - 75% coverage threshold enforcement (configurable)
  - Automated coverage reports on PRs
  - Type checking with TypeScript
  - Build verification
  
- **[.github/workflows/lighthouse.yml](./.github/workflows/lighthouse.yml)** - Performance & accessibility CI
  - Lighthouse CI for critical routes
  - Performance score ≥90
  - Accessibility score ≥90
  - SEO score ≥90
  - Best Practices score ≥90
  - Automated Lighthouse reports on PRs

### Testing Best Practices

When contributing to the project:

1. **Before Making Changes**
   - Review relevant audit documents
   - Check existing test coverage
   - Understand accessibility requirements

2. **During Development**
   - Write tests for new features
   - Update audit checklists as needed
   - Run local tests: `npm test` and `npm run test:coverage`

3. **Before Submitting PR**
   - Run full test suite: `npm run test:all`
   - Check coverage report: `open coverage/lcov-report/index.html`
   - Verify accessibility with browser tools
   - Test on multiple devices/browsers (see playbooks)

4. **PR Review Process**
   - Automated tests run on every PR
   - Coverage report posted as comment
   - Lighthouse scores checked for performance regressions
   - Manual QA for critical paths

### Quick Links

- 📚 **All Audit Documents**: [AUTH_AUDIT_LOG.md](./AUTH_AUDIT_LOG.md), [BUTTON_A11Y_AUDIT.md](./BUTTON_A11Y_AUDIT.md), [MEDIA_TEST_PLAYBOOK.md](./MEDIA_TEST_PLAYBOOK.md)
- 🧪 **Test Suite**: [test/](./test/) directory
- 🔄 **CI/CD Workflows**: [.github/workflows/](./.github/workflows/) directory
- 📖 **Contributing Guide**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- 🐛 **Bug Tracking**: [BUG_TRACKER.md](./BUG_TRACKER.md)

---

## 🎮 Usage

### For Users
1. **Register** - Create an account with email and password
2. **Login** - Access your personalized feed
3. **Post** - Share your thoughts and updates
4. **Interact** - Like posts, send messages, and engage
5. **Send Gifts** - Support creators with virtual gifts

### For Creators
1. **Create Content** - Post engaging content for your audience
2. **Receive Gifts** - Earn through virtual gift monetization
3. **Track Earnings** - Monitor your creator revenue
4. **Engage Community** - Build your follower base

## 💳 Payment Integration

The app uses Stripe for secure payment processing:

- **Test Mode:** Use test cards for development
  - Card: `4242 4242 4242 4242`
  - Expiry: Any future date
  - CVC: Any 3 digits

- **Production:** Configure with live Stripe keys

## 📧 Email System

Email notifications powered by Resend:
- Welcome emails
- Gift notifications
- Account updates
- Security alerts

## 🔒 Security

- ✅ Session-based authentication
- ✅ HTTPS enforced in production
- ✅ Input validation and sanitization
- ✅ CSRF protection
- ✅ Secure payment processing via Stripe
- ✅ Environment variable protection

## 🌐 API Endpoints

### Authentication
- `POST /api/register` - Create new account
- `POST /api/login` - User login
- `GET /api/logout` - User logout

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `POST /api/posts/:id/like` - Like a post

### Gifts
- `GET /api/gifts` - Get available gifts
- `POST /api/gifts/send` - Send gift to creator
- `GET /api/gifts/received` - Get received gifts

### Payments
- `POST /api/stripe/create-payment-intent` - Initialize payment
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## 🎨 Customization

The app is highly customizable:

- **Themes:** Modify CSS variables in [`client/src/index.css`](./client/src/index.css)
- **Colors:** Update gradient schemes
- **Components:** Extend or modify in [`client/src/components`](./client/src/components)
- **Features:** Add new functionality in modular structure

## 🚦 Environment Configuration

### Development
```bash
NODE_ENV=development
PORT=3000
```

### Production
```bash
NODE_ENV=production
PORT=80
```

## 📈 Future Enhancements

- [ ] User profiles and customization
- [ ] Image and video uploads
- [ ] Comments on posts
- [ ] Advanced analytics dashboard
- [ ] Mobile native apps (iOS/Android)
- [ ] Multi-language support
- [ ] Advanced moderation tools
- [ ] Live streaming features
- [ ] Group chats and communities

## 🐛 Bug Tracking & Project Management

Zyeuté V3 uses a comprehensive issue tracking system:

- **[Bug Tracker](BUG_TRACKER.md)** - Live tracking of all bugs and features
- **[Issue Templates](.github/ISSUE_TEMPLATE/)** - Standardized bug reports and feature requests
- **[Project Board](.github/PROJECT_BOARD.md)** - Kanban board setup and workflow
- **[Sample Issues](.github/SAMPLE_ISSUES.md)** - Example issues and CLI commands
- **[Labels Guide](.github/LABELS.md)** - Label definitions and best practices

### Report a Bug

Found a bug? [Create a bug report](../../issues/new/choose) using our template.

### Request a Feature

Have an idea? [Submit a feature request](../../issues/new/choose) and let's discuss!

### Track Progress

View the [Project Board](../../projects) to see what we're working on.

## 🤝 Contributing

We'd love your contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on how to get started.

**Quick start**:
1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit your changes
   ```bash
   git commit -m 'feat: Add some AmazingFeature'
   ```
4. Push to the branch
   ```bash
   git push origin feature/AmazingFeature
   ```
5. Open a Pull Request

For more details, see [CONTRIBUTING.md](CONTRIBUTING.md).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Northern Ventures** - [GitHub](https://github.com/Northern-ventures1)

## 🙏 Acknowledgments

- Built for Quebec's Francophone community
- Powered by modern web technologies
- Deployed on Replit for seamless hosting

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Made with ❤️ for Quebec | Fait avec ❤️ pour le Québec 🇨🇦⚜️**
