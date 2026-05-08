## Project Structure Overview

- **Backend (`backend/`)**
  - Node.js + Express API.
  - MongoDB via Mongoose.
  - Folders:
    - `src/server.js` – Express app entrypoint.
    - `src/config/` – database configuration.
    - `src/models/` – Mongoose models.
    - `src/controllers/` – request handlers.
    - `src/routes/` – route definitions.
    - `src/middleware/` – auth and other middlewares.
- **Frontend (`frontend/`)**
  - React SPA (Vite).
  - Redux Toolkit store, route-based pages, basic dashboards.
  - Folders:
    - `src/pages/` – views (landing, auth, user/admin dashboards).
    - `src/components/` – layout and UI components.
    - `src/store/` – Redux slices and store.
    - `src/utils/` – API helper.
- **Docs**
  - `ARCHITECTURE.md` – high-level architecture, APIs, DB schema, WebSocket, security, and testing plan.

---

## How to Install Dependencies

From the **project root** (`Disaster-Management-System/Disaster-Management-System`):

```bash
cd backend
npm install

cd ../frontend
npm install
```

Ensure you have a running MongoDB instance and Node.js installed.

---

## How to Run the Backend

From `backend/`:

```bash
npm run dev
```

This starts the Express API using `src/server.js`. The default port is controlled via `PORT` in your environment (commonly `5000`).

---

## How to Run the Frontend

From `frontend/`:

```bash
npm run dev
```

This starts the Vite dev server (default: `http://localhost:5173`). The frontend is configured to call the backend API via the base URL defined in your environment variables or API utility.

---

## How to Run Tests

- **Backend tests**
  - (Add your chosen test runner later, e.g. Jest or Mocha.)
  - Example placeholder command:

```bash
cd backend
npm test
```

- **Frontend tests**
  - (Add your preferred test stack later, e.g. Vitest/RTL.)

```bash
cd frontend
npm test
```

As of now, test tooling is not yet wired up; this section defines the placeholders and naming convention to follow.

---

## Environment Variables (No Secrets)

Create a `.env` file in **backend** with (example keys, no secrets):

- **Backend**
  - `PORT` – API port (e.g., `5000`).
  - `MONGO_URI` – MongoDB connection string (e.g., `mongodb://localhost:27017`).
  - `DB_NAME` – database name (e.g., `disaster_management_system`).
  - `JWT_SECRET` – JWT signing secret (keep secret in real usage).
  - `JWT_REFRESH_SECRET` – refresh token secret (keep secret).
  - `S3_ENDPOINT` – S3-compatible endpoint base URL.
  - `S3_BUCKET_ORIGINALS` – bucket name for original images/files.
  - `S3_BUCKET_THUMBNAILS` – bucket for thumbnails.
  - `EMAIL_GATEWAY_URL` – base URL for email provider.
  - `SMS_GATEWAY_URL` – base URL for SMS provider.

Create a `.env` file in **frontend** with:

- **Frontend**
  - `VITE_API_BASE_URL` – base URL for backend API (e.g., `http://localhost:5000`).
  - `VITE_WS_URL` – WebSocket URL (e.g., `ws://localhost:5000/ws`).

Do **not** commit `.env` files to version control.

---

## Local Development Workflow

- Start MongoDB locally (or point to a development cluster).
- In one terminal, run the backend:

```bash
cd backend
npm run dev
```

- In another terminal, run the frontend:

```bash
cd frontend
npm run dev
```

- Access the app in your browser via the Vite dev URL (e.g., `http://localhost:5173`).
- Use the architecture and API design in `ARCHITECTURE.md` to:
  - Extend existing endpoints to match the full spec.
  - Add WebSocket support for real-time events.
  - Implement GIS, alerts, offline queueing, and analytics features incrementally.


