# JobKai Frontend

Modern React-based web application for the JobKai AI-powered career platform.

## Overview

The JobKai frontend provides an intuitive interface for job seekers to:
- Optimize and improve their resumes with AI
- Match with relevant job opportunities
- Showcase their developer footprint (GitHub/StackOverflow)
- Practice interviews with AI-generated questions and feedback
- Manage their profile and career journey

## Features

- 🔐 **Firebase Authentication**: Secure user authentication
- 📄 **Resume Analysis**: Upload and analyze resumes with AI feedback
- 💼 **Job Matching**: Find jobs that match your profile
- 🎯 **Developer Footprint**: Visualize GitHub and StackOverflow activity
- 🎤 **AI Interviewer**: Practice interviews with AI-powered questions
- 🎨 **Modern UI**: Clean, responsive design with shadcn-ui components
- 🌙 **Dark Mode**: Theme switching support

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or compatible package manager)
- **Backend Services**: Running API Gateway at http://localhost:8000

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Firebase

Create or update Firebase configuration in `src/firebase/config.ts`:

```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at: **http://localhost:5173**

## Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Build for development environment
npm run build:dev

# Preview production build
npm run preview

# Lint code
npm run lint
```

## Technology Stack

### Core
- **React**: UI library (v18+)
- **TypeScript**: Type safety
- **Vite**: Fast build tool and dev server

### UI & Styling
- **shadcn-ui**: Component library
- **Radix UI**: Headless UI primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### State & Data
- **React Query (@tanstack/react-query)**: Data fetching and caching
- **Zustand**: State management (if used in store/)
- **React Hook Form**: Form handling
- **Zod**: Schema validation

### Backend Integration
- **Axios**: HTTP client
- **Firebase**: Authentication and real-time database

### Special Features
- **@vapi-ai/web**: Voice API integration

## Project Structure

```
front-end/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn-ui components
│   │   ├── AppSidebar.tsx  # Navigation sidebar
│   │   ├── Layout.tsx      # Main layout wrapper
│   │   ├── Navbar.tsx      # Top navigation
│   │   └── ProtectedRoute.tsx  # Auth guard
│   ├── pages/              # Page components
│   │   ├── AIInterviewer.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Jobs.tsx
│   │   ├── Resume.tsx
│   │   └── ...
│   ├── services/           # API service modules
│   ├── firebase/           # Firebase configuration
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utilities
│   │   ├── api.ts         # API client setup
│   │   └── utils.ts       # Helper functions
│   ├── constants/          # App constants
│   ├── store/              # State management
│   ├── App.tsx             # Root component
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── index.html              # HTML template
├── vite.config.ts          # Vite configuration
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies

```

## Configuration Files

- **vite.config.ts**: Vite build and dev server settings
- **tailwind.config.ts**: Tailwind CSS theme customization
- **tsconfig.json**: TypeScript compiler options
- **components.json**: shadcn-ui component configuration
- **eslint.config.js**: ESLint rules

## API Integration

The frontend communicates with the backend API Gateway at `http://localhost:8000`.

Configure the API base URL in `src/lib/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
```

## Building for Production

```bash
# Build optimized production bundle
npm run build

# Preview production build locally
npm run preview
```

The build output will be in the `dist/` directory.

## Development Tips

### Adding New Components

Use shadcn-ui CLI to add components:
```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
```

### Environment Variables

Create `.env` file for environment-specific configuration:
```env
VITE_API_URL=http://localhost:8000
VITE_FIREBASE_API_KEY=your-api-key
```

### Hot Module Replacement

Vite provides fast HMR. Changes to React components will reflect instantly without full page reload.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Port Already in Use

If port 5173 is busy, Vite will automatically use the next available port (5174, 5175, etc.)

### Build Errors

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Type Errors

```bash
# Check TypeScript errors
npx tsc --noEmit
```

## How to Run

1. **Start Backend**: Ensure the backend services are running (see [backend README](../backend/README.md))
2. **Install Dependencies**: `npm install`
3. **Start Dev Server**: `npm run dev`
4. **Access App**: Navigate to http://localhost:5173

For complete setup including backend services, see the [main project README](../README.md).
