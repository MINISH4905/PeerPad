<div align="center">
  <h1>🚀 PeerPad AI</h1>
  <p><b>Smart Collaborative Learning Platform</b></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
</div>

<br />

PeerPad AI is an AI-powered collaborative note-taking and learning platform designed for students, teachers, and study groups. It combines real-time collaborative editing, handwriting support, AI assistance, and version control-inspired collaboration to make learning more interactive and efficient.

---

## 📖 Table of Contents
- [Project Overview](#-project-overview)
- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Key Features](#-key-features)
- [Tech Stack](#%EF%B8%8F-tech-stack)
- [System Architecture](#%EF%B8%8F-system-architecture)
- [Detailed Workflow](#-detailed-workflow)
- [Module Breakdown & Implementation Details](#-module-breakdown--implementation-details)
- [Folder Structure](#-folder-structure)
- [Database Schema Overview](#-database-schema-overview)
- [Core Workflows](#-core-workflows)
- [Installation Guide](#%EF%B8%8F-installation-guide)
- [API Overview](#-api-overview)
- [Future Enhancements](#-future-enhancements)
- [SDG Contributions](#-sdg-contributions)
- [Team](#-team)
- [License](#-license)

---

## 🌟 Project Overview
PeerPad AI brings the power of version control and artificial intelligence into the classroom. Tailored for study groups and academic collaboration, PeerPad AI seamlessly marries traditional note-taking methods (like handwriting) with modern cloud collaboration, enabling a unified, distraction-free environment for knowledge creation and sharing.

---

## 🚨 Problem Statement
Modern learning environments suffer from fragmented workflows and inadequate tools:
- **Scattered Knowledge:** Notes are distributed across disparate apps, physical notebooks, and local files.
- **Friction in Collaboration:** Study groups struggle to build shared resources without overwriting each other's work.
- **Poor Versioning:** No clear history or accountability for who changed what and when in shared notes.
- **Lack of Handwriting Support:** Most digital platforms ignore students who prefer stylus or physical drawing inputs.
- **Time Inefficiency:** Students spend excessive time summarizing notes rather than internalizing the core concepts.
- **Cognitive Overload:** Complex topics remain difficult to digest without immediate, contextual explanations.

---

## 💡 Solution Overview
PeerPad AI solves these challenges by providing a centralized hub where students and teachers can build knowledge together. The platform provides:
- **Google Docs-style collaborative note editing** with real-time updates.
- **AI-generated summaries, flashcards, and concept explanations** directly inside the workspace.
- **Handwriting-to-text conversion** leveraging mobile devices or styluses.
- **GitHub-style branching and merging** for notes, allowing safe experimentation and peer review.
- **Comments, suggestions, and annotations** for async discussions.
- **Role-based workspaces** separating teacher controls from student environments.
- **Version history and point-in-time restoration**.

---

## ✨ Key Features

### 📝 Core Features
- **Role-Based Auth:** Secure user authentication and workspace authorization.
- **Workspace & Folder Management:** Intuitive organization of subjects and courses.
- **Rich Text Notes Editor:** Powerful editing with markdown and inline formatting.
- **Handwriting Canvas:** Dedicated canvas for sketching and writing.
- **Mobile Device Integration:** Use a mobile phone as a drawing pad via USB or browser connection.
- **OCR Handwriting Recognition:** Convert drawn notes directly to text.
- **Version Control:** Branches, commits, and merge requests for text.
- **Export Capabilities:** Export to PDF, DOCX, and Markdown.

### 🤖 AI Features
- **Instant Summarization:** Distill long lectures into core points.
- **Flashcard & Quiz Generation:** Automatically create study materials from notes.
- **Topic Explanation:** Deep-dive explanations for selected complex terms.
- **Grammar Correction & Translation:** Multilingual support and syntax fixing.
- **Concept Maps:** AI-suggested relational diagrams based on text context.

### 🤝 Collaboration Features
- **Real-Time Sync:** Live cursors and presence indicators.
- **Conflict Resolution:** Safely merge conflicting edits.
- **Suggestion Mode & Approvals:** Propose changes without permanently altering the base note.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| --- | --- | --- |
| **Frontend** | React.js, TypeScript, Tailwind CSS | High-performance, strictly-typed UI with rapid styling. |
| **Editor & Collab** | TipTap, Yjs, Liveblocks | Rich text editing with CRDT-based real-time synchronization. |
| **State Management**| Zustand, React Router | Lightweight global state management and routing. |
| **Backend** | Node.js, Express.js, TypeScript | Scalable, event-driven API server. |
| **Real-Time** | Socket.IO | Bi-directional communication for presence and chat. |
| **Database** | PostgreSQL, Prisma ORM, Redis | ACID-compliant relational data, type-safe queries, and fast caching. |
| **AI & OCR** | OpenAI API, Tesseract.js / Google Vision | LLM integration for processing text; OCR for handwriting analysis. |
| **Storage** | Supabase Storage / AWS S3 | Object storage for images, exports, and profile pictures. |
| **Auth** | JWT, OAuth (Google) | Secure token-based and federated identity management. |
| **Deployment** | Vercel, Render/Railway, Docker | CI/CD pipelines and containerized cloud hosting. |

---

## 🏗️ System Architecture

```mermaid
graph TD
    Client[Web/Mobile Client]
    
    subgraph Frontend [Frontend Application]
        React[React.js UI]
        TipTap[TipTap Editor]
        Yjs[Yjs CRDT]
    end
    
    subgraph Backend [Backend Services]
        Express[Express API]
        Socket[Socket.IO Server]
        Liveblocks[Liveblocks Collab Server]
    end
    
    subgraph Data [Data Layer]
        Postgres[(PostgreSQL)]
        Redis[(Redis Cache)]
        Storage[(Object Storage)]
    end
    
    subgraph External [External APIs]
        OpenAI[OpenAI API]
        OCR[Google Vision / Tesseract]
        OAuth[Google OAuth]
    end

    Client <--> Frontend
    React <--> Express
    TipTap <--> Yjs
    Yjs <--> Liveblocks
    
    Express <--> Postgres
    Express <--> Redis
    Express <--> Storage
    Express <--> OpenAI
    Express <--> OCR
    React <--> OAuth
```

---

## 🔄 Detailed Workflow

### 🎓 Student Workflow
1. **Sign up/login** via Email or Google OAuth.
2. **Create/Join a workspace** (e.g., "Biology 101 Study Group").
3. **Create a note** and begin drafting using the keyboard or handwriting canvas.
4. **Invite collaborators** to edit in real time.
5. **Request AI assistance** for summaries, flashcards, or deep explanations of concepts.
6. **Create branches** to propose massive restructuring without breaking the main note.
7. **Merge approved changes** after peer review.
8. **Export** final study guides to PDF or Markdown.

### 👨‍🏫 Teacher Workflow
1. **Create a classroom workspace** and distribute invite links.
2. **Share lecture notes** with read-only or comment-only access.
3. **Review student branches** for assignments or collaborative projects.
4. **Comment and approve** changes to merge into the main classroom repository.
5. **Generate quizzes** automatically from the finalized lecture material to test student comprehension.

### 💻 Developer Workflow
1. **Clone repository** and install dependencies using `npm install`.
2. **Configure `.env`** variables for DB, Auth, and AI services.
3. **Run database migrations** with Prisma.
4. **Start local servers** (Frontend and Backend concurrently).
5. **Test workflows** like real-time sockets and AI endpoints.
6. **Push to GitHub** to trigger CI/CD deployment.

---

## 🧩 Module Breakdown & Implementation Details

### Authentication Module
- **Implementation:** Utilizes JWT for stateless session management and Google OAuth for quick onboarding.
- **Access Control:** Middleware ensures role-based protected routing (Student vs. Teacher permissions).

### Notes Editor Module
- **Implementation:** Built on TipTap (headless wrapper around ProseMirror).
- **Features:** Supports markdown shortcuts, inline formatting, floating menus, and autosave to PostgreSQL.

### Collaboration Module
- **Implementation:** CRDTs (Conflict-free Replicated Data Types) powered by Yjs and Liveblocks.
- **Features:** Live cursor tracking, presence awareness, and mathematically guaranteed conflict-free merges.

### AI Module
- **Implementation:** Express server securely proxies requests to OpenAI API.
- **Features:** Prompt-engineered endpoints to generate flashcards, summaries, and pedagogical explanations based on highlighted text.

### Handwriting Module
- **Implementation:** HTML5 Canvas element configured for stylus, touch, and remote mobile device input.
- **Features:** Captured strokes are sent to Tesseract.js/Google Vision to yield structured text, which is subsequently injected into the TipTap editor.

### Version Control Module
- **Implementation:** Custom relational schema mapping branches, commits (snapshots of the TipTap JSON state), and merge requests.
- **Features:** Differential state comparison to visualize additions/deletions before merging.

---

## 📁 Folder Structure

```text
peerpad-ai/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI elements
│   │   ├── hooks/          # Custom React hooks (e.g., useSocket)
│   │   ├── pages/          # Route-level components
│   │   ├── store/          # Zustand global state
│   │   └── utils/          # Helper functions
├── server/                 # Node.js Express backend
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Auth and validation guards
│   │   ├── routes/         # API endpoint definitions
│   │   ├── services/       # Business logic (AI, OCR)
│   │   └── sockets/        # WebSockets logic
├── shared/                 # Shared TypeScript types and constants
├── docs/                   # Extended project documentation
├── docker/                 # Containerization configs (Dockerfile, docker-compose)
└── README.md               # You are here!
```

---

## 🗄️ Database Schema Overview

The relational structure is managed via Prisma ORM:
- **`users`**: Authentication credentials, roles (Student/Teacher), profile data.
- **`workspaces`**: Collaborative environments.
- **`workspace_members`**: Join table tracking user roles within specific workspaces.
- **`folders` & `notes`**: Hierarchical content storage.
- **`note_versions`**: Historical states of notes for rollback.
- **`branches`**: Parallel working environments for a specific note.
- **`commits`**: Incremental state snapshots within a branch.
- **`merge_requests`**: Peer-review workflows combining branches.
- **`comments`**: Threaded discussions attached to note content.
- **`notifications`**: User alerts for mentions and merges.
- **`ai_requests`**: Usage tracking for API rate-limiting.
- **`handwriting_sessions`**: Stored blobs for OCR processing.

---

## ⚙️ Core Workflows

### Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant Client
    participant Server
    participant DB
    
    User->>Client: Login (Email/OAuth)
    Client->>Server: POST /auth/login
    Server->>DB: Validate Credentials
    DB-->>Server: User Data
    Server-->>Client: JWT Token
    Client->>Client: Store JWT (Local Storage)
```

### Real-Time Collaboration Flow
```mermaid
sequenceDiagram
    participant User A
    participant Yjs Client A
    participant Collab Server
    participant Yjs Client B
    participant User B
    
    User A->>Yjs Client A: Types "Hello"
    Yjs Client A->>Collab Server: Sync Update (Binary CRDT)
    Collab Server->>Yjs Client B: Broadcast Update
    Yjs Client B->>User B: UI Renders "Hello"
```

### AI & Handwriting Workflow
- **AI:** User selects text -> Client triggers `POST /ai/summarize` -> Server calls OpenAI -> Server returns summary -> Client renders AI Sidebar.
- **Handwriting:** User draws on Canvas -> Client generates Image Blob -> Client triggers `POST /ocr/convert` -> Server processes via Vision API -> Server returns String -> Client inserts into Editor.

---

## 🛠️ Installation Guide

Follow these exact steps to set up the development environment.

```bash
# 1. Clone the repository
git clone https://github.com/MINISH4905/PeerPad.git
cd PeerPad

# 2. Install dependencies for root, client, and server
npm install
cd client && npm install
cd ../server && npm install

# 3. Setup Environment Variables
cp .env.example .env
# (Fill in your required keys in the .env file)

# 4. Run database migrations
cd server
npx prisma migrate dev --name init

# 5. Start the application (runs both frontend and backend concurrently)
cd ..
npm run dev
```

---

## 🔑 Environment Variables

The system requires the following environment variables. Ensure these are securely configured in your `.env` file:

```env
# Database & Cache
DATABASE_URL="postgresql://user:password@localhost:5432/peerpad"
REDIS_URL="redis://localhost:6379"

# Security
JWT_SECRET="your_super_secret_jwt_string"

# Third-Party APIs
OPENAI_API_KEY="sk-..."
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# Storage Services
SUPABASE_URL="https://xyzcompany.supabase.co"
SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5c..."
```

---

## 🚀 Deployment Guide

1. **Database:** Deploy PostgreSQL via **Neon** or **Supabase**.
2. **Backend:** Deploy the Express server to **Render** or **Railway**. Ensure WebSocket support is enabled. Set production `.env` variables.
3. **Frontend:** Deploy the React app to **Vercel**. Connect the GitHub repository and configure build settings (`npm run build`). Update the `VITE_API_URL` to point to the live backend.

---

## 📡 API Overview

| Method | Route | Description |
| --- | --- | --- |
| **POST** | `/auth/register` | Register a new user |
| **POST** | `/auth/login` | Authenticate and return JWT |
| **GET** | `/notes/:id` | Fetch note details and initial state |
| **POST** | `/notes` | Create a new note |
| **POST** | `/ai/summarize` | Generate an AI summary for provided text |
| **POST** | `/ocr/convert` | Convert canvas image blob to text |
| **POST** | `/branches` | Create a new branch for a note |
| **POST** | `/merge-requests` | Create a request to merge a branch |

---

## 🔮 Future Enhancements
- 🎙️ **Voice-to-Text Dictation:** Live transcription of lectures directly into the workspace.
- 📚 **Smart Citation Generation:** Automatically format citations for academic papers.
- 🔗 **LMS Integrations:** Sync seamlessly with Canvas, Blackboard, and Google Classroom.
- 📶 **Offline Support:** PWA capabilities to read and edit notes without internet access.
- 📱 **Native Mobile Apps:** Dedicated iOS and Android applications.
- 🎨 **Whiteboard Mode:** An infinite canvas mode for deep visual brainstorming.

---

## 🌍 SDG Contributions

PeerPad AI actively contributes to the United Nations Sustainable Development Goals:
- 📖 **SDG 4 (Quality Education):** By providing powerful, AI-driven learning tools that enhance comprehension and collaborative studying.
- 🏗️ **SDG 9 (Industry, Innovation, and Infrastructure):** Introducing modern software infrastructure (version control, real-time sync) to academic environments.
- 🤝 **SDG 10 (Reduced Inequalities):** Lowering the barrier to premium educational assistance by providing scalable AI tutoring and tools regardless of geographical location.

---

## 👥 Team
- **PeerPad AI Core Team** 
- *Built with ❤️ for learners everywhere.*

---

## 📄 License
This project is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute this software in accordance with the license terms.
