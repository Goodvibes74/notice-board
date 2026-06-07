const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, LevelFormat, BorderStyle, WidthType,
  ShadingType, PageNumber, PageBreak, Header, Footer, Tab,
  TabStopType, TabStopPosition
} = require('docx');
const fs = require('fs');

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const headerBorder = { style: BorderStyle.SINGLE, size: 1, color: "D5E8F0" };
const headerBorders = { top: headerBorder, bottom: headerBorder, left: headerBorder, right: headerBorder };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, font: "Arial", size: 32, bold: true, color: "1E3A5F" })]
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 26, bold: true, color: "2E6099" })]
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, font: "Arial", size: 24, bold: true, color: "1A1A1A" })]
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: [new TextRun({ text, font: "Arial", size: 22, ...opts })]
  });
}

function paraRuns(runs) {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: runs.map(r => new TextRun({ font: "Arial", size: 22, ...r }))
  });
}

function bullet(text, bold = false) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: "Arial", size: 22, bold })]
  });
}

function bulletRuns(runs) {
  return new Paragraph({
    numbering: { reference: "bullets", level: 0 },
    spacing: { before: 40, after: 40 },
    children: runs.map(r => new TextRun({ font: "Arial", size: 22, ...r }))
  });
}

function code(text) {
  return new Paragraph({
    spacing: { before: 80, after: 80 },
    indent: { left: 720 },
    children: [new TextRun({ text, font: "Courier New", size: 18, color: "1A1A1A" })]
  });
}

function codeBlock(lines) {
  return lines.map(l => code(l));
}

function spacer() {
  return new Paragraph({ spacing: { before: 80, after: 80 }, children: [new TextRun("")] });
}

function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 1 } },
    children: [new TextRun("")]
  });
}

function makeTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) => new TableCell({
          borders: headerBorders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: "D5E8F0", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 140, right: 140 },
          children: [new Paragraph({
            children: [new TextRun({ text: h, font: "Arial", size: 20, bold: true, color: "1E3A5F" })]
          })]
        }))
      }),
      ...rows.map((row, ri) => new TableRow({
        children: row.map((cell, i) => new TableCell({
          borders,
          width: { size: colWidths[i], type: WidthType.DXA },
          shading: { fill: ri % 2 === 0 ? "FFFFFF" : "F8FAFC", type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 140, right: 140 },
          children: [new Paragraph({
            children: [new TextRun({ text: cell, font: "Arial", size: 20 })]
          })]
        }))
      }))
    ]
  });
}

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: "\u2022",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      },
      {
        reference: "numbered",
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: "%1.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } }
        }]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      {
        id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "1E3A5F" },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 }
      },
      {
        id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "2E6099" },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 }
      },
      {
        id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "1A1A1A" },
        paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2 }
      }
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            spacing: { after: 80 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: "2E6099", space: 4 } },
            children: [
              new TextRun({ text: "Cloud Computing Project Report  |  Community Notice Board", font: "Arial", size: 18, color: "2E6099" }),
            ]
          })
        ]
      })
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC", space: 4 } },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: "Makerere University  |  College of Computing and Information Sciences", font: "Arial", size: 16, color: "888888" }),
              new TextRun({ children: [new Tab()], font: "Arial", size: 16, color: "888888" }),
              new TextRun({ children: ["Page ", new PageNumber()], font: "Arial", size: 16, color: "888888" })
            ]
          })
        ]
      })
    },
    children: [

      // ─── TITLE PAGE ───────────────────────────────────────────────
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 1440, after: 200 },
        children: [new TextRun({ text: "Cloud Computing Project Report", font: "Arial", size: 52, bold: true, color: "1E3A5F" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 160 },
        children: [new TextRun({ text: "Community Notice Board Web Application", font: "Arial", size: 32, color: "2E6099" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 600 },
        children: [new TextRun({ text: "React  \u2022  Firebase  \u2022  Docker", font: "Arial", size: 24, color: "888888", italics: true })]
      }),
      divider(),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 100 },
        children: [new TextRun({ text: "Makerere University", font: "Arial", size: 24, bold: true })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 100 },
        children: [new TextRun({ text: "College of Computing and Information Sciences", font: "Arial", size: 22, color: "555555" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 100 },
        children: [new TextRun({ text: "Cloud Computing Course Assignment", font: "Arial", size: 22, color: "555555" })]
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 0, after: 100 },
        children: [new TextRun({ text: "June 2026", font: "Arial", size: 22, color: "555555" })]
      }),

      // Page break after title
      new Paragraph({ children: [new PageBreak()] }),

      // ─── 1. INTRODUCTION ──────────────────────────────────────────
      h1("1. Introduction"),

      h2("1.1 Background"),
      para("Cloud computing is the on-demand delivery of computing resources — servers, storage, databases, networking, software, and analytics — over the internet. Rather than owning and maintaining physical data centres, organisations and developers can access technology services from a cloud provider and pay only for what they use."),
      para("This project was undertaken as part of the Cloud Computing course at Makerere University's College of Computing and Information Sciences. The objective was to design, build, and deploy a web application that runs natively on the cloud, demonstrating practical understanding of cloud services, serverless computing, containerisation, and cloud-based deployment pipelines."),

      h2("1.2 Project Overview"),
      para("The application built is a Community Notice Board — a real-time web platform where authenticated users can post, view, and delete public notices or announcements. The application was built using the following technology stack:"),
      spacer(),
      makeTable(
        ["Layer", "Technology", "Cloud Role"],
        [
          ["Frontend", "React 18 + Vite", "Single-page application"],
          ["Authentication", "Firebase Auth", "Identity as a service (IDaaS)"],
          ["Database", "Cloud Firestore", "Managed NoSQL cloud database"],
          ["Serverless", "Firebase Cloud Functions", "Event-driven serverless computing"],
          ["Hosting", "Firebase Hosting", "CDN-backed static hosting"],
          ["Containerisation", "Docker + Nginx", "Immutable container build"],
          ["Registry", "Docker Hub", "Cloud container registry"],
        ],
        [2200, 2600, 4226]
      ),
      spacer(),

      h2("1.3 Cloud Computing Concepts Demonstrated"),
      para("This project directly demonstrates the following cloud computing concepts:"),
      bullet("Platform as a Service (PaaS) — Firebase provides the entire backend infrastructure"),
      bullet("Serverless / Function as a Service (FaaS) — Cloud Functions run without managing servers"),
      bullet("Managed databases — Firestore handles scaling, replication, and availability automatically"),
      bullet("Containerisation — Docker packages the application into a portable, reproducible image"),
      bullet("Container registries — Docker Hub provides cloud-based image storage and distribution"),
      bullet("Content Delivery Networks (CDN) — Firebase Hosting distributes assets globally"),
      bullet("Identity as a Service — Firebase Authentication manages users without custom auth code"),

      // ─── 2. CLOUD CONCEPTS ────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      h1("2. Cloud Computing Concepts"),

      h2("2.1 Cloud Service Models"),
      para("Cloud services are typically categorised into three models, each abstracting a different level of infrastructure management:"),
      spacer(),
      makeTable(
        ["Model", "Full Name", "What the Provider Manages", "Example"],
        [
          ["IaaS", "Infrastructure as a Service", "Hardware, networking, virtualisation", "Google Compute Engine, AWS EC2"],
          ["PaaS", "Platform as a Service", "IaaS + OS, runtime, middleware", "Firebase, Google App Engine, Heroku"],
          ["SaaS", "Software as a Service", "Everything including the application", "Gmail, Google Docs, Slack"],
        ],
        [1100, 2200, 2800, 2926]
      ),
      spacer(),
      para("This project uses Firebase, which is a PaaS offering. The developer (student) is responsible only for writing application code. Google manages all underlying infrastructure, scaling, security patching, and availability."),

      h2("2.2 Serverless Computing"),
      para("Serverless computing is a cloud execution model in which the cloud provider dynamically allocates compute resources to run code in response to events. The developer writes functions — small, single-purpose pieces of code — and the provider handles all server provisioning, scaling, and maintenance. Billing is based on actual execution time rather than reserved capacity."),
      para("In this project, a Firebase Cloud Function named stampNoticeDate was implemented. This function is triggered automatically every time a new document is created in the Firestore notices collection. It reads the createdAt timestamp, formats it into a human-readable string (for example, 'Monday, 9 June 2026 at 14:32'), and writes it back onto the same document as a formattedDate field. This happens entirely in Google's infrastructure with no server management required."),

      h2("2.3 Containerisation"),
      para("Containerisation is the process of packaging an application together with all of its dependencies, libraries, and configuration into a single portable unit called a container. Containers are isolated from the host operating system and from each other, making them consistent and reproducible across any environment — a developer's laptop, a staging server, or a production cloud cluster."),
      para("Docker is the industry-standard containerisation platform. A Dockerfile is a text file that defines the instructions for building a container image. Once built, an image can be run as a container on any machine with Docker installed, producing identical behaviour regardless of the underlying operating system."),
      para("Containerisation differs from traditional virtualisation in that containers share the host operating system kernel rather than running a full guest OS. This makes containers significantly lighter and faster to start than virtual machines."),

      h2("2.4 Multi-Stage Docker Builds"),
      para("A multi-stage Docker build is a technique that uses multiple FROM instructions in a single Dockerfile. Each stage can use a different base image, and files can be selectively copied between stages. This is particularly powerful for compiled or transpiled applications such as React:"),
      bullet("Stage 1 (builder): Uses a Node.js image to install npm dependencies and run the build process. This stage produces a compiled dist/ folder of static HTML, CSS, and JavaScript."),
      bullet("Stage 2 (serve): Uses a lightweight Nginx image and copies only the compiled dist/ folder from Stage 1. The final image contains no Node.js, no source code, and no node_modules — only the built output and the web server."),
      para("The result is a final image typically under 30MB, compared to over 300MB if the full Node.js build environment were included. This improves security (less attack surface), reduces deployment time, and lowers storage costs in the container registry."),

      h2("2.5 Container Registries"),
      para("A container registry is a cloud-based repository for storing and distributing container images. Docker Hub is the most widely used public container registry. Once an image is pushed to Docker Hub, it can be pulled and run on any machine or cloud service with internet access, enabling consistent deployment across environments."),

      // ─── 3. SYSTEM ARCHITECTURE ───────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      h1("3. System Architecture"),

      h2("3.1 Architecture Overview"),
      para("The Notice Board application follows a client-serverless architecture. There is no traditional application server — all backend logic is handled either by Firebase's managed services or by event-driven Cloud Functions. The diagram below describes the flow of data through the system:"),
      spacer(),
      makeTable(
        ["Component", "Technology", "Responsibility"],
        [
          ["User's browser", "React SPA", "Renders the UI, handles routing, calls Firebase SDK"],
          ["Firebase Hosting", "Google CDN", "Serves compiled static assets globally"],
          ["Firebase Auth", "Firebase service", "Manages user registration, login, and session tokens"],
          ["Cloud Firestore", "Firebase service", "Stores and syncs notice documents in real time"],
          ["Cloud Functions", "Google serverless", "Runs stampNoticeDate on Firestore write events"],
          ["Docker image", "Docker + Nginx", "Containerised build for portable deployment"],
          ["Docker Hub", "Container registry", "Stores and distributes the production image"],
        ],
        [2000, 2200, 4826]
      ),
      spacer(),

      h2("3.2 Data Flow"),
      para("The following describes the lifecycle of a notice being posted by a user:"),
      new Paragraph({
        numbering: { reference: "numbered", level: 0 },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: "User submits the post form in the React UI.", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "numbered", level: 0 },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: "React calls addDoc() via the Firebase SDK, writing the notice to Firestore with title, body, author email, uid, and a serverTimestamp.", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "numbered", level: 0 },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: "The Cloud Function stampNoticeDate is triggered by the Firestore write event.", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "numbered", level: 0 },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: "The function formats the createdAt timestamp and writes formattedDate back onto the document.", font: "Arial", size: 22 })]
      }),
      new Paragraph({
        numbering: { reference: "numbered", level: 0 },
        spacing: { before: 40, after: 40 },
        children: [new TextRun({ text: "The onSnapshot() listener in all connected React clients detects the document update and re-renders the notice feed in real time — no page refresh required.", font: "Arial", size: 22 })]
      }),
      spacer(),

      h2("3.3 Firestore Data Structure"),
      para("The application uses a single Firestore collection with the following document structure:"),
      spacer(),
      makeTable(
        ["Field", "Type", "Description"],
        [
          ["title", "string", "The notice heading entered by the user"],
          ["body", "string", "The full notice content"],
          ["author", "string", "Email address of the posting user"],
          ["uid", "string", "Firebase Auth user ID of the posting user"],
          ["createdAt", "Timestamp", "Firestore server-side timestamp set on creation"],
          ["formattedDate", "string", "Human-readable date written by the Cloud Function"],
        ],
        [1600, 1400, 6026]
      ),
      spacer(),

      h2("3.4 Security Rules"),
      para("Firestore security rules enforce data access policies server-side, meaning they cannot be bypassed by the client application:"),
      bullet("Read access: any visitor, including unauthenticated users, can read notices"),
      bullet("Create access: only authenticated users (request.auth != null) can post notices"),
      bullet("Delete access: only the original author can delete their own notice, enforced by matching request.auth.uid against the stored uid field"),
      bullet("Update access: disabled entirely — notices are immutable after posting"),

      // ─── 4. IMPLEMENTATION ────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      h1("4. Implementation"),

      h2("4.1 Project Setup — React and Vite"),
      para("The frontend was scaffolded using Vite, a modern build tool that provides fast hot module replacement during development and optimised production builds. The project was initialised with the React template:"),
      spacer(),
      ...codeBlock([
        "npm create vite@latest notice-board -- --template react",
        "cd notice-board",
        "npm install",
        "npm install firebase react-router-dom",
      ]),
      spacer(),
      para("Vite was chosen over Create React App because it uses native ES modules during development, resulting in significantly faster startup times, and produces smaller, more optimised production bundles via its Rollup-based build pipeline."),

      h2("4.2 Firebase Configuration"),
      para("Firebase was initialised in a dedicated src/firebase.js module that exports the auth and db instances used throughout the application. This centralises the configuration and prevents duplicate app initialisations:"),
      spacer(),
      ...codeBlock([
        "import { initializeApp } from 'firebase/app';",
        "import { getAuth } from 'firebase/auth';",
        "import { getFirestore } from 'firebase/firestore';",
        "",
        "const firebaseConfig = { /* project credentials */ };",
        "const app = initializeApp(firebaseConfig);",
        "",
        "export const auth = getAuth(app);",
        "export const db = getFirestore(app);",
      ]),
      spacer(),

      h2("4.3 Authentication"),
      para("Firebase Authentication was integrated using the Email/Password provider. The LoginPage component handles both new user registration and existing user sign-in through two separate button handlers using the Firebase Auth SDK methods createUserWithEmailAndPassword and signInWithEmailAndPassword."),
      para("A ProtectedRoute component wraps the board page and uses the onAuthStateChanged observer to listen for the user's authentication state. If no authenticated session exists, the component redirects to the login page. React Router DOM manages all client-side navigation between routes."),

      h2("4.4 Real-Time Firestore Board"),
      para("The board page uses Firestore's onSnapshot() method to establish a real-time listener on the notices collection. Unlike a standard one-time fetch, onSnapshot maintains an open connection and fires a callback every time the underlying data changes — whether that change originates from the current user or from any other connected client. This delivers collaborative real-time behaviour without polling or websocket management code."),
      spacer(),
      ...codeBlock([
        "const q = query(",
        "  collection(db, 'notices'),",
        "  orderBy('createdAt', 'desc')",
        ");",
        "",
        "const unsubscribe = onSnapshot(q, (snapshot) => {",
        "  const data = snapshot.docs.map(doc => ({",
        "    id: doc.id, ...doc.data()",
        "  }));",
        "  setNotices(data);",
        "});",
        "",
        "return unsubscribe; // cleanup on component unmount",
      ]),
      spacer(),

      h2("4.5 Cloud Function — stampNoticeDate"),
      para("A second-generation Firebase Cloud Function was written to demonstrate serverless event-driven computing. The function is triggered by a Firestore onCreate event on the notices collection. It reads the createdAt timestamp from the newly created document, formats it using the JavaScript Intl API, and writes the result back as a formattedDate field:"),
      spacer(),
      ...codeBlock([
        "exports.stampNoticeDate = onDocumentCreated(",
        "  'notices/{noticeId}',",
        "  async (event) => {",
        "    const createdAt = event.data.data().createdAt;",
        "    const formattedDate = createdAt.toDate().toLocaleDateString('en-GB', {",
        "      weekday: 'long', day: 'numeric', month: 'long',",
        "      year: 'numeric', hour: '2-digit', minute: '2-digit'",
        "    });",
        "    await getFirestore()",
        "      .collection('notices')",
        "      .doc(event.params.noticeId)",
        "      .update({ formattedDate });",
        "  }",
        ");",
      ]),
      spacer(),

      h2("4.6 Dockerfile — Multi-Stage Build"),
      para("The application was containerised using a multi-stage Dockerfile. The first stage uses a Node.js Alpine image to build the React application. The second stage uses a lightweight Nginx Alpine image to serve the compiled static output:"),
      spacer(),
      ...codeBlock([
        "# Stage 1: Build",
        "FROM node:20-alpine AS builder",
        "WORKDIR /app",
        "COPY package.json package-lock.json ./",
        "RUN npm ci",
        "COPY . .",
        "RUN npm run build",
        "",
        "# Stage 2: Serve",
        "FROM nginx:alpine",
        "RUN rm -rf /usr/share/nginx/html/*",
        "COPY --from=builder /app/dist /usr/share/nginx/html",
        "COPY nginx.conf /etc/nginx/conf.d/default.conf",
        "EXPOSE 80",
        "CMD [\"nginx\", \"-g\", \"daemon off;\"]",
      ]),
      spacer(),
      para("An nginx.conf file was also created to handle React Router's client-side routing. Without this configuration, direct navigation to sub-routes such as /board returns a 404 error because Nginx looks for a physical file at that path. The try_files directive instructs Nginx to fall back to index.html for any path, allowing React Router to handle routing on the client side."),

      h2("4.7 Docker Hub Deployment"),
      para("Once the image was built and verified locally, it was tagged with the Docker Hub repository name and pushed to the public registry:"),
      spacer(),
      ...codeBlock([
        "docker build -t notice-board .",
        "docker tag notice-board USERNAME/notice-board:v1",
        "docker push USERNAME/notice-board:v1",
      ]),
      spacer(),
      para("The image is now publicly accessible on Docker Hub. Any machine with Docker installed can pull and run the application without a local build environment — demonstrating the portability and reproducibility that containerisation provides."),

      // ─── 5. CHALLENGES AND TROUBLESHOOTING ───────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      h1("5. Challenges, Errors, and Resolutions"),

      para("The development of this project involved several real-world technical challenges that went beyond the initial planned scope. Each challenge required diagnosis, research, and a specific resolution. These are documented below as they represent authentic cloud deployment experience."),

      h2("5.1 Missing firebase.json — firebase deploy Failing"),
      h3("Error"),
      para("Running firebase deploy from the terminal produced: \"Error: Not in a Firebase app directory (could not locate firebase.json)\""),
      h3("Cause"),
      para("The firebase init command had not been run in the project, so firebase.json — the file Firebase CLI uses to understand the project structure and deployment targets — did not exist in the project root."),
      h3("Resolution"),
      para("The firebase init command was run from the correct project root directory. During initialisation, the Functions and Hosting features were selected. Critically, when prompted whether to overwrite existing files (functions/index.js, dist/index.html), the answer was No to preserve the already-written Cloud Function code and compiled React output."),

      h2("5.2 Vite Build Failure — Cannot Resolve Entry Module index.html"),
      h3("Error"),
      para("Running npm run build produced: \"[UNRESOLVED_ENTRY] Cannot resolve entry module index.html\""),
      h3("Cause"),
      para("The index.html file in the project root was deleted under the incorrect assumption that it was a leftover from an earlier plain HTML version of the project. In a Vite project, index.html in the root is the required entry point for the build pipeline — it is not a served page but the shell that loads the React application via a script module tag. Vite cannot build without it."),
      h3("Resolution"),
      para("The index.html file was restored to the project root with the standard Vite + React template content, including the root div element and the script tag pointing to src/main.jsx. The build then completed successfully."),

      h2("5.3 Cloud Function Deployment — Eventarc Permission Error"),
      h3("Error"),
      para("Deploying the Cloud Function produced: \"Permission denied while using the Eventarc Service Agent. Verify that it has Eventarc Service Agent role.\""),
      h3("Cause"),
      para("Firebase Cloud Functions v2 (second generation) use Google Cloud Eventarc as the underlying trigger mechanism. On a new Firebase project, the Eventarc Service Agent — a Google-managed service account — is automatically created but may not have its required IAM role assigned before the first deployment attempt. This is a Google Cloud propagation issue that occurs specifically on first-time deployments of v2 functions."),
      h3("Resolution"),
      para("The Google Cloud SDK (gcloud CLI) was installed on the development machine. The Eventarc Service Agent role was then granted manually to the auto-generated service account using the project number (694327861544) obtained from the Firebase console:"),
      spacer(),
      ...codeBlock([
        "gcloud projects add-iam-policy-binding notice-board-13b6d",
        "  --member=\"serviceAccount:service-694327861544",
        "           @gcp-sa-eventarc.iam.gserviceaccount.com\"",
        "  --role=\"roles/eventarc.serviceAgent\"",
      ]),
      spacer(),
      para("The firebase deploy command was then retried and completed successfully."),

      h2("5.4 PowerShell Line Continuation Syntax Error"),
      h3("Error"),
      para("Pasting multi-line gcloud commands that used the Unix backslash (\\) line continuation character into PowerShell produced parser errors: \"Missing expression after unary operator '--'\""),
      h3("Cause"),
      para("The backslash character is a line continuation operator in Unix shells (bash, zsh) but has no such meaning in Windows PowerShell. PowerShell uses the backtick (`) character for line continuation. When the Unix-style command was pasted across multiple lines, PowerShell tried to parse each line independently, causing syntax errors on the flag arguments."),
      h3("Resolution"),
      para("The gcloud command was rewritten as a single line with no line breaks, which is valid in both Unix shells and PowerShell. All subsequent multi-line commands were formatted as single-line equivalents for the Windows environment."),

      h2("5.5 Google Cloud SDK Not Installed"),
      h3("Issue"),
      para("The gcloud command was not available in the terminal, as the Google Cloud SDK had not been installed on the development machine."),
      h3("Resolution"),
      para("The Google Cloud SDK was downloaded from cloud.google.com/sdk and installed using the Windows installer. The installer was configured to add gcloud to the system PATH. VS Code was restarted after installation so that the new terminal sessions could locate the gcloud executable. The gcloud init command was then run to authenticate and select the correct Firebase project."),

      h2("5.6 Docker Hub Image Verification"),
      h3("Process"),
      para("After pushing the image to Docker Hub, the image was verified by removing the local copy and pulling it fresh from the registry:"),
      spacer(),
      ...codeBlock([
        "docker rmi USERNAME/notice-board:v1",
        "docker run -p 8080:80 USERNAME/notice-board:v1",
      ]),
      spacer(),
      para("This confirmed that the image was self-contained and could be deployed to any machine or cloud environment without access to the original source code or build environment."),

      // ─── 6. EVALUATION ────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      h1("6. Evaluation"),

      h2("6.1 Cloud-Native vs Traditional Hosting"),
      para("The approach taken in this project differs fundamentally from traditional web hosting:"),
      spacer(),
      makeTable(
        ["Aspect", "Traditional Hosting", "This Project (Cloud-Native)"],
        [
          ["Infrastructure", "Developer manages servers, OS, and runtime", "Google manages all infrastructure (PaaS)"],
          ["Scaling", "Manual — requires provisioning more servers", "Automatic — Firebase and Cloud Run scale on demand"],
          ["Backend logic", "Runs on a persistent application server", "Runs as stateless serverless functions (FaaS)"],
          ["Database", "Self-managed MySQL or PostgreSQL instance", "Managed Firestore with automatic replication"],
          ["Deployment", "FTP or SSH file transfer to a fixed server", "CLI deploy to a global CDN"],
          ["Portability", "Tied to a specific server configuration", "Docker image runs identically anywhere"],
        ],
        [1800, 3000, 4226]
      ),
      spacer(),

      h2("6.2 What Worked Well"),
      bullet("Firebase's real-time capabilities via onSnapshot() delivered a collaborative, live-updating experience with minimal code — no websocket management or polling logic was required."),
      bullet("The multi-stage Docker build produced a small, clean production image by separating the build environment from the runtime environment."),
      bullet("Firestore security rules provided server-enforced access control, ensuring that write and delete permissions could not be circumvented by client-side code manipulation."),
      bullet("Firebase Hosting's global CDN meant the application was immediately available at low latency without any server configuration."),
      bullet("The Cloud Function demonstrated genuine serverless computing — code running in response to a database event with no server provisioning required."),

      h2("6.3 Limitations and Areas for Improvement"),
      bullet("The Firebase configuration (API keys) is currently embedded in the client-side JavaScript bundle. For a production application, environment variables managed via a CI/CD pipeline would be more appropriate, though Firebase API keys are designed to be public-facing and are protected by Firestore security rules."),
      bullet("The Cloud Function uses a Firestore trigger which requires Eventarc, adding IAM complexity on new projects. An HTTP-triggered function would have been simpler to deploy initially."),
      bullet("There is no image or file attachment support for notices. Firebase Cloud Storage could be integrated to support this in a future iteration."),
      bullet("The Docker container is currently served from a local machine. A production deployment would push the image to a cloud container service such as Google Cloud Run or Google Kubernetes Engine."),

      h2("6.4 Learning Outcomes"),
      para("This project provided practical exposure to the following concepts that are central to modern cloud computing:"),
      bullet("The distinction between IaaS, PaaS, and SaaS, and the trade-offs of each model in terms of control, responsibility, and operational overhead."),
      bullet("How serverless functions enable event-driven architectures without requiring persistent server processes, and the IAM permission model that governs them in Google Cloud."),
      bullet("How Docker multi-stage builds produce minimal, portable container images — and why the separation of build and runtime environments matters for security and efficiency."),
      bullet("The practical workflow of pushing images to a container registry and the role registries play in cloud deployment pipelines."),
      bullet("Real-world troubleshooting of cloud deployment issues including IAM permission propagation, platform-specific CLI syntax differences, and build tool entry point requirements."),

      // ─── 7. CONCLUSION ────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      h1("7. Conclusion"),

      para("This project successfully designed, implemented, and deployed a cloud-native web application that demonstrates core cloud computing principles in a practical, working system. The Community Notice Board application leverages Firebase as a PaaS platform, Cloud Functions for serverless event-driven computing, Docker for containerisation, and Docker Hub as a container registry."),
      para("Beyond the planned scope, the project involved meaningful real-world troubleshooting: resolving Google Cloud IAM permission propagation issues for second-generation Cloud Functions, recovering from an incorrect deletion of a Vite build entry point, adapting Unix CLI commands for a Windows PowerShell environment, and installing and configuring the Google Cloud SDK from scratch."),
      para("These challenges, though unplanned, are representative of authentic cloud engineering work. The ability to read error messages, identify root causes, and apply targeted fixes is as important a cloud computing skill as understanding theoretical service models."),
      para("The completed application is live on Firebase Hosting, its Docker image is publicly available on Docker Hub, and all source code is structured according to standard React and Firebase project conventions. The project demonstrates that a fully functional, cloud-native, real-time web application can be built and deployed by a single developer using modern PaaS tooling, without managing any server infrastructure."),

      // ─── 8. REFERENCES ────────────────────────────────────────────
      new Paragraph({ children: [new PageBreak()] }),
      h1("8. References"),

      para("Firebase Documentation. (2024). Get started with Cloud Firestore. Google. https://firebase.google.com/docs/firestore/quickstart"),
      spacer(),
      para("Firebase Documentation. (2024). Get started with Firebase Authentication. Google. https://firebase.google.com/docs/auth/web/start"),
      spacer(),
      para("Firebase Documentation. (2024). Write functions for Cloud Firestore. Google. https://firebase.google.com/docs/functions/firestore-events"),
      spacer(),
      para("Docker Documentation. (2024). Multi-stage builds. Docker Inc. https://docs.docker.com/build/building/multi-stage/"),
      spacer(),
      para("Docker Documentation. (2024). Docker Hub overview. Docker Inc. https://docs.docker.com/docker-hub/"),
      spacer(),
      para("Google Cloud. (2024). Eventarc overview. Google. https://cloud.google.com/eventarc/docs/overview"),
      spacer(),
      para("Nginx Documentation. (2024). Beginner's guide. Nginx Inc. https://nginx.org/en/docs/beginners_guide.html"),
      spacer(),
      para("Vite Documentation. (2024). Why Vite. Evan You. https://vitejs.dev/guide/why.html"),
      spacer(),
      para("Mell, P. & Grance, T. (2011). The NIST definition of cloud computing (Special Publication 800-145). National Institute of Standards and Technology."),

    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('/mnt/user-data/outputs/Notice_Board_Cloud_Project_Report.docx', buffer);
  console.log('Report generated successfully.');
});