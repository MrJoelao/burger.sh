# burger.sh

University project for the Web and Mobile Programming course at Università degli Studi di Milano.  
Work in progress: backend (Node.js + Express + MongoDB, REST API) and frontend (HTML/CSS/JavaScript + Bootstrap).

## Backend setup

1. Copy `backend/.env.example` to `backend/.env` and fill in real values (MongoDB connection string, JWT secret).
2. Install dependencies: run `npm install` in the project root, then in `backend/`.
3. Load the shared menu: `npm run seed:meals` (from `backend/`).
4. Create the first admin account: `npm run seed:admin -- --name <name> --surname <surname> --email <email> --password <password>` (from `backend/`; the password needs at least 12 characters).
5. Start the server: `npm start`, or `npm run dev` to restart on file changes.
6. Run the test suite: `npm test` (from `backend/`). See `backend/tests/README.md` for details.
