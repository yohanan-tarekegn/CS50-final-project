# GatherRound
#### Video Demo:  https://youtu.be/Xj9PMRVM0u0

GatherRound is a web application for organizing informal group plans. An organizer creates a gathering, adds options such as dates, times, places, or activities, and shares one invitation link. Participants can open the link, review the choices, and vote for every option that works for them. The goal is to replace scattered messages with one simple, shareable poll.

The project is built as a React and TypeScript single-page application backed by a Python Flask API and a SQLite database. It is designed for local development and as a compact full-stack project: the frontend handles navigation and interaction, while the backend owns authentication, data validation, persistence, and vote rules.

## Features

- Create an account and sign in with a username and password. Passwords are stored as Werkzeug password hashes, not as plain text.
- Create a gathering with a required title, an optional description, and two to eight non-empty voting choices. Titles are limited to 120 characters, descriptions to 500 characters, and each choice to 160 characters.
- Open an event through its unique share URL. The event page shows the organizer, description, choices, vote totals, and the current user's vote state.
- Share an invitation with the copy-link control. It uses the browser clipboard when available and falls back to a copy command; if the browser blocks both methods, the page tells the organizer to copy the URL from the address bar.
- Vote for multiple choices independently. Selecting a choice adds the signed-in user's vote; selecting it again removes that vote. The page reloads the poll data after each change.
- View gatherings created by the current account on My Plans. Opening a plan and returning to the list preserves the expected navigation route.
- Sign in or create an account directly from a shared event. An unauthenticated participant is prompted to authenticate before a vote is sent, and the event link remains active after authentication.
- Restore the current account from the browser's Flask session cookie on startup and after page reloads. Each browser profile has its own cookie and identity; opening an invitation does not sign another visitor into the organizer's account.
- Validate event input in both the interface and API. The backend also rejects unauthenticated voting, malformed or missing options, and unknown option IDs.

## Typical Workflows

An organizer creates an account, fills in the gathering title and optional context, enters at least two choices, and submits the form. The app saves the gathering and opens its event page immediately. The organizer can copy the URL and send it to participants. From My Plans, the organizer can reopen any gathering they created.

A participant opens the shared URL. Event details and current totals are public to anyone who has the link. The participant can vote only after signing in or creating an account. After authentication, GatherRound returns to the same event and refreshes it with that participant's vote state. Votes belong to user accounts, so another signed-in visitor sees their own selection state rather than inheriting the sender's identity. Signing out while viewing My Plans hides the previous account's list and prompts for sign-in.

Choices are deliberately free text. They can represent time slots, venues, or any other decision, but GatherRound does not currently connect to a calendar, send email invitations, or prevent a participant from selecting several choices. Poll totals update for the current visitor after a vote; other open browsers see updated totals when they reload or revisit the page. This version does not provide live push updates, event editing/deletion, account recovery, or administrative moderation.

## Technology and Structure

The frontend lives in `frontend/`. It uses React 19, TypeScript, and Vite. `src/App.tsx` manages the top-level route state for the home page, `/plans`, and `/event/<share-code>`. Reusable UI is separated into `AuthPanel`, `EventComposer`, `EventDetail`, and `MyPlans` components. `src/api.ts` sends JSON requests and includes browser credentials so same-origin session cookies accompany API calls. Vite proxies `/api` requests to Flask during development.

The backend lives in `backend/`. `app.py` defines the Flask routes, reads the logged-in user from the Flask session, validates requests, hashes passwords, and queries the database through CS50's SQL helper. `schema.sql` defines four tables: `users` stores account names and password hashes; `events` stores the organizer, title, description, and share code; `options` stores each event's free-text choices; and `votes` connects users to choices. A database uniqueness constraint prevents duplicate votes by the same user on the same choice. The SQLite database is created at `backend/gatherround.db` and its tables are initialized from the schema when the backend starts.

## Repository File Guide

The files below are the files that make up the application and its development setup. Generated folders such as `frontend/node_modules`, `frontend/dist`, Python `__pycache__` folders, and local runtime data are not application source code.

### Root

- `README.md` is this project guide. It explains the product, workflows, implementation, setup, validation commands, file responsibilities, design decisions, and production considerations.

### Backend

- `backend/app.py` is the Flask application entry point. It creates the Flask app, configures CORS and the session secret, opens the SQLite database, initializes tables from the schema, and implements registration, login, logout, current-user lookup, event creation, public event lookup, event listing, and vote toggling. It also performs the server-side validation that cannot be trusted to the browser.
- `backend/schema.sql` is the database schema. It creates `users`, `events`, `options`, and `votes`, including foreign keys and the unique constraint that allows one vote per user per option.
- `backend/requirements.txt` lists the Python runtime dependencies: Flask for HTTP routes and sessions, Flask-CORS for local frontend/API communication, Werkzeug for password hashing, and CS50's SQL helper for SQLite access.
- `backend/gatherround.db` is the local SQLite database created and populated while running the application. It is runtime state rather than a source file. A deployment should use an appropriate database lifecycle and backup strategy instead of treating a development database as portable configuration.

### Frontend Entry and Configuration

- `frontend/index.html` is Vite's HTML shell. It defines the document language, viewport behavior, page title, favicon links, root mount element, and the module entry point.
- `frontend/package.json` defines the frontend package metadata, runtime dependencies, development dependencies, and scripts: `dev` starts Vite, `build` type-checks and bundles the app, `lint` runs ESLint, and `preview` serves the production bundle locally.
- `frontend/vite.config.ts` configures the React Vite plugin and the local development server. Its `/api` proxy forwards browser requests to Flask on port 5001, which lets the frontend use relative API URLs and preserves cookie behavior during development.
- `frontend/eslint.config.js` configures JavaScript, TypeScript, React Hooks, and React Refresh lint rules while excluding generated build output.
- `frontend/tsconfig.json` is the shared TypeScript project configuration. `frontend/tsconfig.app.json` type-checks the browser source under `src`, with strict unused-code checks and bundler resolution. `frontend/tsconfig.node.json` type-checks the Vite configuration and its Node.js types.
- `frontend/public/favicon.svg` supplies the browser tab icon. `frontend/public/icons.svg` contains the project's reusable static icon artwork.

### Frontend Source

- `frontend/src/main.tsx` is the React bootstrap file. It imports the global styles, finds the `root` element, and renders `App` inside React `StrictMode`.
- `frontend/src/App.tsx` is the application coordinator. It owns the current user, startup session check, lightweight browser-history routing, auth-panel visibility, shared event code, and transitions between the home page, My Plans, auth, and event views. It also ensures an auth form takes precedence over an event view, so a visitor can register or log in without losing an invitation URL.
- `frontend/src/api.ts` is the typed fetch wrapper. It sets JSON headers, includes credentials on every request so Flask session cookies are sent, parses JSON responses, and turns non-success responses into useful JavaScript errors for the UI.
- `frontend/src/App.css` contains the application-level visual system and component layout rules: navigation, landing page, forms, event details, voting controls, plan rows, responsive behavior, focus states, and copy-link feedback.
- `frontend/src/index.css` contains the global reset and base design tokens, including colors, typography defaults, focus outlines, selection styling, and the root/body sizing rules.
- `frontend/src/components/AuthPanel.tsx` renders login and account-creation forms. It switches between modes, submits credentials to the matching backend endpoint, displays server errors, disables duplicate submissions, and reports a successful user back to `App`.
- `frontend/src/components/EventComposer.tsx` renders the authenticated organizer's gathering form. It manages title, description, and a bounded list of choices, validates that at least two choices contain text before submission, and opens the created event when the API returns its share code.
- `frontend/src/components/EventDetail.tsx` loads a public gathering, displays its choices and vote totals, handles add/remove vote actions, redirects unauthenticated vote attempts to auth, refreshes data after a vote, and copies the invitation URL with a browser-clipboard fallback.
- `frontend/src/components/MyPlans.tsx` loads only the current user's created gatherings, displays loading/error/empty states, opens a selected plan, and shows a login prompt when the route is visited without an account. The component is reset when the active account changes so one user's plan list cannot remain visible after sign-out.
- `frontend/src/assets/` is reserved for frontend-imported assets. The current interface uses CSS and public SVG assets, so this directory does not contain a required application image.

## Design Decisions and Tradeoffs

### Session cookies instead of frontend token storage

I chose Flask's server-side session model with an HTTP cookie rather than storing a bearer token in `localStorage`. The backend remains the authority for identity, the frontend's `fetchApi` wrapper automatically includes credentials, and sign-out can clear the server session. This reduces the chance of accidentally exposing a long-lived token to scripts. It does mean production deployment must configure HTTPS, cookie flags, CORS, and a stable `SECRET_KEY` carefully.

### Public event details, authenticated votes

The event lookup endpoint is public because a share link should be useful before a guest creates an account. Vote creation is protected on the server, not just hidden in the UI. This balances low-friction invitations with an accountable vote model. A share code is a discovery mechanism, not authorization: anyone with the link can read the event, and anyone who wants to vote must have an account.

### Lightweight browser-history routing

The app uses `history.pushState` and a small pathname parser instead of adding a routing dependency. There are only three meaningful views, so a full router would add dependency and configuration overhead for little benefit. The tradeoff is that a production server must serve the SPA entry point for `/plans` and `/event/...` paths, and the app does not yet have nested route conventions or route-level data loaders.

### Free-text choices and multi-select voting

Choices are intentionally free text rather than separate date/time fields. Group decisions vary widely, and free text keeps the first version useful for brunches, trips, venues, activities, and other plans without imposing a calendar model. Participants can select every option that works because the product is intended to find overlap, not force a single preference. The tradeoff is that GatherRound does not parse dates, detect conflicts, rank preferences, or integrate with calendars yet.

### Duplicate validation in frontend and backend

The composer checks obvious input errors immediately so the user gets fast feedback. Flask repeats those checks because browser validation can be bypassed by direct HTTP requests. This small amount of duplication is deliberate: client validation improves usability, while server validation protects data integrity and keeps API behavior trustworthy.

### SQLite and a small relational schema

SQLite keeps the project easy to run, inspect, and grade locally without a separate database service. Splitting options and votes into relational tables instead of storing JSON inside an event makes vote counts, uniqueness, and ownership queries straightforward. The tradeoff is that a high-traffic deployment would eventually need a managed database, stronger migration tooling, and possibly transactional handling around multi-step event creation.

### Refresh-after-vote instead of optimistic updates

After a vote, the event component reloads the event from the API rather than guessing the new totals locally. This keeps the displayed count and `user_voted` state aligned with the database and makes add/remove behavior simple to reason about. The tradeoff is an extra request and a small delay after each click; live subscriptions or carefully designed optimistic updates could improve that later.

## API Overview

- `GET /api/me` returns the current account or `null` when signed out.
- `POST /api/register` creates an account and starts its session; `POST /api/login` authenticates an existing account; `POST /api/logout` clears the session.
- `GET /api/events` lists gatherings created by the current account. `POST /api/events` creates a gathering and its options and requires authentication.
- `GET /api/events/<share_code>` returns public event details and vote totals, along with whether the current account selected each choice.
- `POST /api/vote` toggles the authenticated user's vote for an option. Requests without a session are rejected.

API request and response bodies are JSON. Errors use an `error` field and an appropriate HTTP status code. The UI displays those messages for sign-in, poll creation, and voting failures.

## Run Locally on Windows

Use one terminal for the backend:

```powershell
py -m venv backend\.venv
backend\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
$env:SECRET_KEY = "replace-with-a-long-random-development-value"
python backend\app.py
```

The API listens on `http://127.0.0.1:5001`. In a second terminal, install and start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://127.0.0.1:5173`. Keep both processes running while using the application. The Vite development server forwards API calls to Flask, so frontend requests use the same browser origin and include the session cookie.

## Validation

From `frontend/`, run `npm run lint` for ESLint and `npm run build` for the TypeScript project build and optimized Vite bundle. The backend dependencies are listed in `backend/requirements.txt`; Python syntax can be checked with `python -m py_compile backend/app.py` from the repository root. The API can also be exercised with Flask's test client. Important scenarios include signed-out access to protected routes, invalid polls, public invite loading, signed-out vote rejection, vote add/remove behavior, and session restoration after reloading an event page.

## Deployment and Privacy Notes

The CORS allowlist and Vite proxy are configured for local development. A deployment must configure the frontend origin and API routing for its actual host. Set a strong, private, persistent `SECRET_KEY` through the environment. Without it, the backend generates a random key for that process, which is suitable only for local development and invalidates existing sessions when the backend restarts. Production should use HTTPS and secure cookie settings, rate-limit authentication endpoints, and provide a password recovery strategy before accepting real users. Share codes are intended to be hard to guess, but they are not an access-control boundary: anyone who receives a link can view its event and vote after signing in. Do not put sensitive personal information in event titles, descriptions, or choices.
