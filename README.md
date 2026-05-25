# Study Swap Place

> A modern platform for students to collaborate, share resources, and optimize their learning experience.

![TypeScript](https://img.shields.io/badge/TypeScript-95.9%25-3178c6?style=flat-square)
![React](https://img.shields.io/badge/React-19.2.0-61dafb?style=flat-square)
![TanStack Start](https://img.shields.io/badge/TanStack%20Start-1.167-ef4444?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

## 📋 Overview

Study Swap Place is a full-stack web application built with modern technologies that enables students to swap study materials, collaborate on learning resources, and build a supportive academic community. The platform leverages TypeScript for type safety, React for a responsive user interface, and Supabase for secure backend infrastructure.

## ✨ Features

- **Resource Sharing**: Easily swap study materials, notes, and learning resources with peers
- **Real-time Collaboration**: Connect with students in real-time using modern web technologies
- **User-Friendly Interface**: Intuitive UI built with Radix UI components and Tailwind CSS
- **Type-Safe Development**: Full TypeScript codebase for enhanced reliability and developer experience
- **Responsive Design**: Works seamlessly across all device sizes
- **Data Management**: Powerful state management with TanStack Query
- **Form Validation**: Robust form handling with React Hook Form and Zod validation
- **Rich Components**: Comprehensive UI library with charts, modals, and interactive elements

## 🛠 Tech Stack

### Frontend
- **React** 19.2.0 - Modern UI library
- **TypeScript** 5.8.3 - Type-safe JavaScript
- **TanStack Start** 1.167.50 - Full-stack React framework
- **TanStack React Router** 1.168.25 - Type-safe routing
- **TanStack React Query** 5.83.0 - Server state management
- **Tailwind CSS** 4.2.1 - Utility-first styling
- **Radix UI** - Accessible component library
- **React Hook Form** 7.71.2 - Efficient form handling
- **Zod** 3.24.2 - TypeScript-first schema validation

### Backend
- **Supabase** - PostgreSQL database and authentication
- **PLpgSQL** - Database procedures and functions

### Development Tools
- **Vite** 7.3.1 - Lightning-fast build tool
- **ESLint** 9.32.0 - Code quality
- **Prettier** 3.7.3 - Code formatting
- **Cloudflare Vite Plugin** 1.25.5 - Cloudflare deployment support

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or Bun
- npm, yarn, pnpm, or bun package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/radhakrishna131/study-swap-place.git
   cd study-swap-place
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5173` to see the application in action.

## 📦 Available Scripts

```bash
npm run dev         # Start development server with hot reload
npm run build       # Build for production
npm run build:dev   # Build in development mode
npm run preview     # Preview production build locally
npm run lint        # Run ESLint to check code quality
npm run format      # Format code with Prettier
```

## 📁 Project Structure

```
study-swap-place/
├── app/                  # Application source code
├── public/              # Static assets
├── src/                 # TypeScript source files
│   ├── components/      # React components
│   ├── lib/            # Utility functions
│   ├── pages/          # Page components
│   └── styles/         # Global styles
├── .eslintrc.js        # ESLint configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── package.json        # Project dependencies
```

## 🧩 Key Components

### UI Components
- Accordion, Alert Dialog, Avatar
- Buttons, Checkboxes, Dropdowns
- Forms, Modals, Navigation Menus
- Tabs, Tooltips, and more from Radix UI

### Data Visualization
- Charts and graphs using Recharts
- Progress indicators
- Data tables with sorting and filtering

### Form Handling
- Reactive forms with React Hook Form
- Schema validation with Zod
- Accessible form inputs with Radix UI

## 🔐 Security & Performance

- **Type Safety**: Full TypeScript codebase prevents runtime errors
- **Schema Validation**: Zod ensures data integrity
- **Secure Authentication**: Supabase authentication
- **Optimized Queries**: TanStack Query handles caching and synchronization
- **Code Splitting**: Vite provides efficient bundling

## 🌍 Deployment

The project is configured for deployment to Cloudflare Workers using the Cloudflare Vite Plugin.

```bash
npm run build
# Deploy to Cloudflare
```

## 📝 Code Quality

This project maintains high code standards:

- **ESLint**: Enforces consistent code style
- **Prettier**: Automatic code formatting
- **TypeScript**: Type checking for reliability
- **Zod**: Runtime type validation

To format your code:
```bash
npm run format
```

To check for linting issues:
```bash
npm run lint
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please ensure all code is formatted and passes linting checks before submitting a PR.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋 Support & Issues

If you encounter any issues or have suggestions for improvements, please [open an issue](https://github.com/radhakrishna131/study-swap-place/issues) on GitHub.

## 📞 Contact

For questions or inquiries, feel free to reach out to the project maintainer:
- **GitHub**: [@radhakrishna131](https://github.com/radhakrishna131)

---

**Happy studying! 🎓**

Made with ❤️ by the Study Swap Place team
