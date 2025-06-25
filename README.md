# QA Explain UI

A modern React application for QA document management and analysis.

## Features

- Modern React with TypeScript
- Vite for fast development and building
- Tailwind CSS for styling
- AWS Cognito Authentication
- File upload and management
- Document analysis and processing

## Prerequisites

- Node.js 18 or later
- npm or yarn
- An AWS account with Cognito User Pool

## Environment Setup

1. Create a `.env` file in the root directory with the following variables:

```env
VITE_COGNITO_USER_POOL_ID=your-user-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_COGNITO_IDENTITY_POOL_ID=your-identity-pool-id
VITE_AWS_REGION=your-aws-region
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Authentication Flow

The application uses AWS Cognito for authentication with the following features:

1. User sign-in with email and password
2. Password reset functionality
3. New password required challenge handling
4. Session management with token refresh
5. Automatic redirection to QA dashboard after login

## Project Structure

- `src/components/` - Reusable UI components
- `src/services/` - Service layer including authentication
- `src/contexts/` - React contexts including auth context
- `src/hooks/` - Custom React hooks
- `src/views/` - Page components
- `src/utils/` - Utility functions
- `src/types/` - TypeScript type definitions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
