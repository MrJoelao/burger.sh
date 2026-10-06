# burger.sh

University project for the Web and Mobile Programming course at Università degli Studi di Milano.
Work in progress: backend (Node.js + Express v5 + MongoDB, REST API with Swagger/OpenAPI) and frontend (Preact + Vite + Tailwind CSS 4, SPA architecture).

## Backend setup

1. Copy `backend/.env.example` to `backend/.env` and fill in real values (MongoDB connection string, JWT secret).
2. Install dependencies: run `npm install` in the project root, then in `backend/`.
3. Load the shared menu: `npm run seed:meals` (from `backend/`).
4. Create the first admin account: `npm run seed:admin -- --name <name> --surname <surname> --email <email> --password <password>` (from `backend/`; the password needs at least 12 characters).
5. Start the server: `npm start`, or `npm run dev` to restart on file changes.
6. Run the test suite: `npm test` (from `backend/`). See `backend/tests/README.md` for details.
7. Access the Swagger documentation at http://localhost:3000/api-docs (development only).

## Frontend setup

The frontend is built with Preact, Vite, and Tailwind CSS. Run `npm run frontend:dev` from the project root to start the development server on port 4000.

## Demo

Run `npm run demo` from the repository root. It builds the frontend, starts the backend in production mode and the frontend production preview server together, and seeds an idempotent database named `burger-demo`. The frontend is available on port `4173`; the backend API is on port `3000`.

The demo includes sample restaurants and manager accounts in Milano Citta Studi, but never creates an admin: the CEO setup remains available through the normal setup flow. Demo managers use the password `DemoPassword123!`. Set `DEMO_MONGODB_URI` to use a dedicated MongoDB instance; otherwise the database name is derived from `MONGODB_URI` and changed to `burger-demo`.

## Project structure

- `backend/` - Node.js + Express REST API with MongoDB, Mongoose, JWT auth, Swagger docs
- `frontend/` - Preact SPA with Vite, Tailwind CSS, custom router, context-based state management
- `docs/ita/` - Italian technical documentation (requirements, data model, architecture, demo scenarios)
- `docs/ita/diagrams/` - Domain model diagram (Draw.io format)
