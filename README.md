# BizPilot AI

**Your First AI Employee for Every Small Business.**

BizPilot AI is a production-ready hackathon prototype for an autonomous AI SaaS platform. It is designed as an AI employee, not a simple chatbot: it can coordinate workflows, analyze business data, generate operational documents, manage inventory, answer customers, and recommend next actions.

## Project Overview

Small businesses lose hours every day to repetitive administrative work: customer support, invoices, quotations, order tracking, inventory updates, reports, and daily monitoring. BizPilot AI brings these jobs into one intelligent workspace that can understand requests, take action across business modules, and keep owners informed.

## Architecture

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **UI System:** shadcn-inspired glass panels, responsive navigation, lucide icons
- **Motion:** Framer Motion page transitions, hover states, animated counters and workflow progress
- **3D:** Three.js via React Three Fiber for the animated AI orb
- **AI Layer:** Gemini API-ready service boundary through environment variables
- **Backend Ready:** Firebase Authentication, Firestore, and Firebase Storage environment placeholders
- **Deployment:** Vercel-ready static build

## Features

- Firebase Authentication with email/password, Google sign-in, forgot password, session persistence, and logout
- Business setup flow after signup
- Multi-tenant Firestore architecture under `businesses/{businessId}/...`
- Protected routes for dashboard, orders, customers, inventory, invoices, reports, analytics, settings, automation, and AI
- Premium dark enterprise SaaS dashboard
- Autonomous order-to-invoice workflow simulator
- AI assistant with voice-ready UI, quick actions, and conversation history
- Business metrics: revenue, orders, AI score, business health
- Revenue forecast chart and operational activity stream
- Customers, orders, inventory, invoices, reports, analytics, knowledge base, automation, employees, and settings modules
- AI recommendations and next-best-action panels
- Role-based access and secure API readiness
- Responsive desktop, tablet, and mobile layouts

## Screenshots

Add screenshots from the running app here before submission:

- Dashboard command center
- AI assistant and workflow runner
- Mobile responsive view

## Installation

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production Build

```bash
npm run build
npm run preview
```

## Vercel Deployment

This project is ready for Vercel deployment using the included `vercel.json` configuration.

1. Commit and push your repo to GitHub, GitLab, or Bitbucket.
2. Create a new Vercel project and import the repo.
3. Use the default build command:

```bash
npm run build
```

4. Set `dist` as the output directory if prompted, or rely on `vercel.json`.
5. Add the following environment variables in Vercel:

```text
VITE_AI_PROVIDER
VITE_GROQ_ENABLED
VITE_GROQ_MODEL
GROQ_API_KEY
VITE_XAI_API_KEY
VITE_XAI_MODEL
VITE_GEMINI_API_KEY
VITE_GEMINI_MODEL
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

6. Deploy the project and verify the `Signup` and `Dashboard` routes.

## Environment Variables

Copy `.env.example` to `.env` and provide real Firebase and AI provider credentials.

```bash
VITE_AI_PROVIDER=groq
VITE_GROQ_ENABLED=true
VITE_GROQ_MODEL=llama-3.3-70b-versatile
GROQ_API_KEY=
VITE_XAI_API_KEY=
VITE_XAI_MODEL=grok-4.3
VITE_GEMINI_API_KEY=
VITE_GEMINI_MODEL=gemini-1.5-flash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

For the local hackathon demo, GroqCloud is proxied through Vite using `GROQ_API_KEY`, while xAI/Grok or Gemini can also be enabled with their matching variables. Use `VITE_AI_PROVIDER=groq`, `VITE_AI_PROVIDER=grok`, or `VITE_AI_PROVIDER=gemini`. For production, move live AI requests to a backend route so API keys are not exposed to users.

## Authentication & Multi-Tenancy

New users sign up with Firebase Authentication, complete Business Setup, and receive a tenant workspace where `businessId` equals their Firebase `uid`. Business data is stored in Firestore under:

```text
businesses/{businessId}/profile/details
businesses/{businessId}/customers/{customerId}
businesses/{businessId}/orders/{orderId}
businesses/{businessId}/inventory/{itemId}
businesses/{businessId}/invoices/{invoiceId}
businesses/{businessId}/reports/{reportId}
businesses/{businessId}/employees/{employeeId}
businesses/{businessId}/automation/{ruleId}
```

Firestore security rules are in `firestore/rules.txt`.

## Folder Structure

```text
bizpilot-ai/
  src/
    auth/
    components/
    firebase/
    pages/
    App.tsx
    main.tsx
    styles.css
  index.html
  package.json
  tailwind.config.js
  postcss.config.js
  vite.config.ts
  .env.example
  README.md
```

## Deployment

1. Push the project to GitHub.
2. Import it into Vercel.
3. Add environment variables in Vercel Project Settings.
4. Use `npm run build` as the build command.
5. Deploy.

For Google Sign-In, add every runtime domain in Firebase Console > Authentication > Settings > Authorized domains:

- `localhost`
- `127.0.0.1`
- Your Vercel domain, for example `your-project.vercel.app`
- Any custom production domain

## Future Scope

- Real Gemini function-calling agent for workflow execution
- Firebase-backed customers, orders, inventory, invoices, and reports
- PDF, Word, and Excel export pipelines
- RAG-powered knowledge assistant with document embeddings
- Barcode scanning and supplier integrations
- Email, WhatsApp, and SMS notification channels
- Audit logs, approval chains, and multi-tenant billing
- Predictive inventory and customer behavior modeling
