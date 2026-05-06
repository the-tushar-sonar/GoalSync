<div align="center">

# 🎯 GoalSync

**A Habit & Consistency Based Goal Progress Tracker**

[![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
[![Firebase](https://img.shields.io/badge/firebase-a08021?style=for-the-badge&logo=firebase&logoColor=ffcd34)](https://firebase.google.com/)
[![Tailwind CSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

_GoalSync bridges the psychological gap between long-term objectives and daily routines by providing a unified, real-time platform for hierarchical goal breakdown, habit tracking, and dynamic visual progress analysis._

</div>

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Core Features](#-core-features)
- [Architecture & Technology Stack](#-architecture--technology-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Installation](#local-installation)
  - [Firebase Environment Configuration](#firebase-environment-configuration)
  - [Executing the Application](#executing-the-application-development-mode)
- [Database Schema (Firestore)](#-database-schema-firestore)
- [Security & Authorization](#-security--authorization)
- [Deployment via CI/CD](#-deployment-via-cicd)

## 💡 About the Project

Many individuals systematically fail to achieve long-term goals due to poor daily consistency, a profound lack of progress visibility, and the absence of a structured system bridging macro-objectives with micro-actions. Existing digital productivity tools frequently fragment the user experience by isolating habit tracking from goal management, leading to cognitive fatigue and application abandonment.

**GoalSync** directly resolves this fragmentation. It is an optimized Single Page Application (SPA) that empowers users to define meaningful goals, deconstruct them into highly actionable milestones and daily habits, and visualize progress through an intuitive, non-punitive user interface. By unifying the micro and macro aspects of productivity, GoalSync establishes a sustainable framework for personal development.

## ✨ Core Features

- **Hierarchical Goal Management:** Define overarching goal durations, establish priority levels, and track granular completion percentages algorithmically derived from underlying habit execution data.
- **Seamless Goal Breakdown:** Effortlessly link specific daily or weekly habits to larger milestones, ensuring that every logged action contributes to a broader objective.
- **Frictionless Habit Tracking:** Execute daily habit check-ins with an absolute maximum of two clicks. The system features automated, transactional streak calculation and immediate progress synchronization.
- **Non-Punitive Recovery UX:** Employs advanced progressive psychological UI principles with a specialized "missed-day recovery flow," actively preventing total user demotivation when a consistency streak is inevitably broken.
- **Advanced Data Visualization:** View real-time dynamic progress bars, gamified streak counters, and comprehensive weekly consistency heatmaps.
- **Offline-First Synchronization:** Powered by Firebase Cloud Firestore, allowing cross-device data syncing and robust offline interaction capabilities, ensuring no data loss during network disruptions.

## 🛠 Architecture & Technology Stack

The application systematically abandons legacy RDBMS architectures in favor of a modern, highly scalable serverless ecosystem:

- **Frontend Framework:** React 18+ (initialized via Vite for rapid HMR and optimized build compilation)
- **Styling Engine:** Tailwind CSS for constructing responsive, accessible, utility-first interfaces without cascading bloat.
- **State Management:** Native React Context API combined with Custom Hooks for UI state; Firestore caching for server state.
- **Backend-as-a-Service (BaaS):** Firebase
  - **Authentication:** Secure, token-based user identity verification (OAuth 2.0 & Email/Password).
  - **Firestore:** Real-time, document-oriented NoSQL database optimized for rapid read operations.
  - **Hosting:** Edge-deployed production builds served via global CDN.
- **Continuous Integration:** GitHub Actions automating static analysis, testing, and production deployment pipelines.

## 🚀 Getting Started

Follow these rigorous instructions to properly bootstrap and configure a local development environment.

### Prerequisites

Ensure the local development machine has the following dependencies globally installed:

- **Node.js** (v18.0.0 or higher required for Vite compatibility)
- **npm** (Node Package Manager) or **yarn**
- **Firebase CLI:** Required for local emulation and deployment. Install via:

```bash
npm install -g firebase-tools
```

### Local Installation

1. **Clone the repository:**

   ```bash
   git clone [https://github.com/your-username/GoalSync.git](https://github.com/your-username/GoalSync.git)
   cd GoalSync
   ```

2. **Install project dependencies:**

   ```bash
   npm install
   ```

3. **Initialize the Firebase Workspace:**
   Authenticate your local CLI with Google Cloud and link the directory to your specific Firebase project:
   ```bash
   firebase login
   firebase use --add
   ```

### Firebase Environment Configuration

To prevent runtime crashes, the application must be supplied with valid Google Cloud credentials.

1. Navigate to the [Firebase Console](https://console.firebase.google.com/) and instantiate a new Web App project.
2. Explicitly enable **Firestore Database**, **Authentication**, and **Hosting** within the console dashboard.
3. In the absolute root directory of your cloned project, generate a file named `.env.local`.
4. Populate this file with your specific Firebase SDK configuration parameters:

   ```env
   VITE_FIREBASE_API_KEY="YOUR_API_KEY"
   VITE_FIREBASE_AUTH_DOMAIN="YOUR_PROJECT_ID.firebaseapp.com"
   VITE_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"
   VITE_FIREBASE_STORAGE_BUCKET="YOUR_PROJECT_ID.appspot.com"
   VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"
   VITE_FIREBASE_APP_ID="YOUR_APP_ID"
   ```

   **Security Warning:** The `.env.local` file is explicitly ignored by the `.gitignore` manifest. Never commit this file to a public repository.

### Executing the Application (Development Mode)

To safeguard production data, development should occur using the Firebase Local Emulator Suite.

1. **Start the Firebase Emulators (Firestore & Auth):**
   ```bash
   firebase emulators:start
   ```
2. **Launch the Vite Development Server (In a secondary terminal):**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

## 🗄️ Database Schema (Firestore)

GoalSync utilizes a denormalized NoSQL data model explicitly optimized for high-speed read performance and minimal billing overhead. Data is strictly segregated into nested subcollections beneath specific user profiles to guarantee cryptographically secure access control.

| Collection Path                    | Document Specification & Purpose                                                                                                                                       |
| :--------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/users/{uid}`                     | Root profile document. Contains cached global user statistics to prevent deep querying on initial load.                                                                |
| `/users/{uid}/goals/{goalId}`      | Stores overarching goal parameters, calculated `completionPercentage`, and an embedded array of localized milestone objects.                                           |
| `/users/{uid}/habits/{habitId}`    | Stores specific habit configurations, frequency arrays, and integers representing current and historical maximum streaks.                                              |
| `/users/{uid}/habit_logs/{logId}`  | Daily binary completion records. Document IDs are deterministically formatted as `{habitId}_{YYYYMMDD}` to enforce absolute idempotency and prevent duplicate logging. |
| `/users/{uid}/reflections/{refId}` | Stores qualitative, long-form weekly reflection notes for psychological review.                                                                                        |

## 🔒 Security & Authorization

This project implements rigorous Cloud Firestore Security Rules (`firestore.rules`). Because the React client communicates directly with the database, the rules engine acts as the sole barrier against unauthorized data manipulation.

The hierarchy dictates a strict owner-only access protocol. Utilizing the `{document=**}` wildcard, the system guarantees that all read and write requests to any subcollection (goals, habits, logs) are instantly rejected unless the requesting user's decoded JSON Web Token (`request.auth.uid`) exactly matches the parent document ID of the root `/users` collection.

## 🌐 Deployment via CI/CD

This repository is structurally configured with GitHub Actions to automate seamless deployments directly to Firebase Hosting.

1. Generate a continuous integration token via the CLI: `firebase login:ci`
2. Add the resulting alphanumeric token to your GitHub Repository Secrets under the exact variable nomenclature `FIREBASE_TOKEN`.
3. The integrated workflow pipeline (`.github/workflows/deploy.yml`) is automatically triggered upon any push or merge directed at the `main` branch. It systematically executes unit tests, builds the heavily optimized React SPA payload, and deploys it directly to the live Firebase edge servers.
