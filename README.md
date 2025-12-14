# Zyeuté - Package Installer

> Quebec's premier French social media platform with advanced monetization features

[![TypeScript](https://img.shields.io/badge/TypeScript-97.6%25-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Replit](https://img.shields.io/badge/Deployed%20on-Replit-orange)](https://replit.com/@northern-ventur/Package-Installer)

## 📱 Overview

Zyeuté Package Installer is a comprehensive social media application built specifically for the Quebec French-speaking market. It features real-time interactions, virtual gifting, Stripe payment integration, and a modern, responsive UI built with React and TypeScript.

**Live Demo:** [https://package-installer--northern-ventur.replit.app](https://package-installer--northern-ventur.replit.app)

## ✨ Features

### Core Functionality
- 🔐 **User Authentication** - Secure registration and login system
- 📝 **Real-time Feed** - Post and view content with live updates
- ❤️ **Social Interactions** - Like posts and engage with content
- 💬 **Messaging System** - Real-time chat with Socket.IO
- 🎁 **Virtual Gifts** - Send and receive virtual gifts to creators
- 💳 **Stripe Integration** - Secure payment processing for virtual currency
- 🎨 **Premium UI** - Beautiful gradient designs and animations
- 📱 **Responsive Design** - Works seamlessly on all devices
- 🇫🇷 **French Interface** - Built for Quebec's Francophone community

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
- **Deployment:** Replit
- **Version Control:** Git/GitHub
- **Package Manager:** npm
- **TypeScript:** Full type safety

## 📂 Project Structure

```
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
└── .replit                  # Replit configuration
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
```env
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

### Running on Replit

1. Fork or import this repository to Replit
2. Set up your environment variables in Replit Secrets
3. Click the "Run" button
4. The app will automatically install dependencies and start

## 🧪 Testing & Evaluation

Zyeuté V3 includes a comprehensive evaluation framework for testing services, AI agents, and components:

### Running Tests
```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with interactive UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

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

- **Themes:** Modify CSS variables in `client/src/index.css`
- **Colors:** Update gradient schemes
- **Components:** Extend or modify in `client/src/components`
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

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

**Quick start**:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
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
