# Community Notice Board 📌

A premium, cloud-native notice board application designed for real-time team bulletins, built as a **Cloud Computing Project**. The application utilizes a serverless architecture powered by **Firebase**, and features a fully responsive masonry dashboard with a dynamic theme engine (Dark, Light, and Cyberpunk). It also supports Docker containerisation for cloud hosting.

### 🔗 Project Links

* **GitHub Repository:** [Goodvibes74/notice-board](https://github.com/Goodvibes74/notice-board)
* **Live Web App (Firebase Hosting):** [notice-board-13b6d.web.app](https://notice-board-13b6d.web.app)
* **Docker Hub Image:** [goodvibes74/notice-board](https://hub.docker.com/r/goodvibes74/notice-board)

---

## 🚀 Key Features

* **Real-time Synchronization:** notice boards update instantly across all active sessions using Firebase Firestore listeners (`onSnapshot`).
* **Authentication & User Management:** User sign-up and sign-in powered by Firebase Auth, featuring custom username displays, loading states, and robust error messaging.
* **Premium Theme Engine:** Persisted in `localStorage`, users can cycle through three Harmonious theme states:
  * 🌌 **Midnight Glow (Dark):** Dark luxe aesthetics with glassmorphic cards and floating neon background blobs.
  * ☀️ **Aurora Light (Light):** A clean, high-contrast, modern layout.
  * 👾 **Cyberpunk Neon (Cyberpunk):** A retro-futuristic styling with neon glowing card borders and neon pink accents.
* **Interactive Notice Composer:** Authenticated users can publish messages with titles (up to 80 chars), body descriptions (up to 800 chars), category classification, and custom preset accent colors.
* **Notice Actions & Reactions:** Users can delete their own notices (with a safety prompt) and react ("like") any bulletin notice.
* **Smart Filtering & Sorting:** Fast client-side search by title or body contents, category filters (All, General, Announcement, Sticky, Idea, Event), and sorting by date (newest/oldest) or popularity (most liked).
* **Route Protection:** Seamless page shielding for private routes (`/board`) with loading spinners and session verification checks.
* **Serverless Cloud Function:** Automatic formatting of notice timestamps on document creation, utilizing a Node.js-based Firestore cloud function.
* **Multi-Stage Containerisation:** Highly optimized Docker builds serving static React + Vite output through a lightweight Nginx web server configured for client-side routing.
* **Polished Academic Report Generator:** Built-in Node script to compile a comprehensive, highly styled `.docx` project report describing the architecture, design choices, and deployment configurations.

---

## 🛠️ Technology Stack & Architecture

* **Frontend Framework:** [React 19](https://react.dev/) + [Vite](https://vite.dev/)
* **Languages:** HTML5, Modern CSS, ES6+ Javascript
* **Backend services (PaaS):** 
  * [Firebase Authentication](https://firebase.google.com/docs/auth) (Email & Password provider)
  * [Cloud Firestore](https://firebase.google.com/docs/firestore) (Serverless NoSQL Database)
  * [Firebase Cloud Functions](https://firebase.google.com/docs/functions) (Event-driven background handlers)
* **Web Server & Containerization:** [Nginx](https://www.nginx.com/) and [Docker](https://www.docker.com/) (Image hosted on [Docker Hub](https://hub.docker.com/r/goodvibes74/notice-board))
* **Document Compilation:** [docx](https://docx.js.org/) for generating the academic project report

### Architectural Diagram

```
[ Client Browser ] <---(Real-time Streams)---> [ Cloud Firestore ]
        |                                              ^
        |--(Auth Checks)--> [ Firebase Auth ]          |
        |                                       (Trigger Function)
        |-----------------------------------------[ Cloud Functions ]
                                                  (stampNoticeDate)
```

---

## 📂 Project Structure

```
notice-board/
├── .agents/            # Agent design guidelines and licensing
├── dist/               # Compiled production bundle output
├── functions/          # Serverless Firebase Cloud Functions (v2)
│   ├── index.js        # Firestore trigger function (date stamping)
│   └── package.json    # Functions runtime dependencies
├── public/             # Static public assets (icons, etc.)
├── src/
│   ├── components/     # Reusable UI parts (ProtectedRoute, etc.)
│   ├── pages/          # Page views (LoginPage, BoardPage)
│   ├── App.jsx         # Router configuration
│   ├── firebase.js     # Firebase connection setup & config
│   ├── index.css       # Core design system stylesheet
│   └── main.jsx        # App entry point
├── Dockerfile          # Multi-stage container instructions
├── nginx.conf          # Nginx server configuration (React Router support)
├── package.json        # Frontend application dependencies
├── report.js           # docx generator script for the project report
└── README.md           # Project documentation (this file)
```

---

## ⚙️ Setup & Running Locally

### Prerequisites

* [Node.js](https://nodejs.org/) (v18 or higher recommended)
* [Firebase CLI](https://firebase.google.com/docs/cli) (if modifying or deploying cloud functions)

### 1. Install Dependencies

Install the client-side packages from the root directory:

```bash
npm install
```

To install dependencies required for Firebase Cloud Functions:

```bash
cd functions
npm install
cd ..
```

### 2. Local Development

Run the Vite local development server:

```bash
npm run dev
```

The app will typically boot at `http://localhost:5173`.

### 3. Production Build

To compile the static files for production deployment:

```bash
npm run build
```

The output will be bundled inside the `/dist` directory.

---

## ⚡ Serverless Cloud Functions

The serverless function stamps notice documents on creation with a human-readable date.

### Local Testing (Emulators)

To run the Firebase Emulator suite locally:

```bash
firebase emulators:start
```

### Deployment

To deploy the cloud function and hosting assets to the active Firebase project:

```bash
# Deploy functions only
firebase deploy --only functions

# Build and deploy frontend only
npm run build
firebase deploy --only hosting

# Deploy everything
firebase deploy
```

The live web application is deployed and hosted at [https://notice-board-13b6d.web.app](https://notice-board-13b6d.web.app).

---

## 🐳 Docker Deployment

The application is containerized utilizing a two-stage Docker workflow:

* **Stage 1 (Build):** Compiles the React application using Node Alpine.
* **Stage 2 (Serve):** Copies built files to Nginx Alpine and serves them on Port 80.

The pre-built image is published and available on [Docker Hub](https://hub.docker.com/r/goodvibes74/notice-board).

### Pull & Run from Docker Hub

You can pull and run the pre-built image directly from Docker Hub:

```bash
docker pull goodvibes74/notice-board
docker run -d -p 8080:80 goodvibes74/notice-board
```

### Build the Image

Run the following command from the root directory:

```bash
docker build -t community-notice-board .
```

### Run the Container

Start the Nginx server container mapping port 80 to port 8080:

```bash
docker run -d -p 8080:80 community-notice-board
```

Visit the app at `http://localhost:8080`.

---

### Execute Generation

Run the script from the root directory:

```bash
node report.js
```

The generated document will be saved directly into `/mnt/user-data/outputs/Notice_Board_Cloud_Project_Report.docx` (or your defined system path).
