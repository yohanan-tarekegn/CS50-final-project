# GatherRound

GatherRound is a small web application for organizing informal group plans. An organizer creates a gathering, adds options such as dates, times, places, or activities, and shares one invitation link. Participants can open the link, review the choices, and vote for every option that works for them. The goal is to replace scattered messages with one simple, shareable poll.

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

The API listens on `http://127.0.0.1:5000`. In a second terminal, install and start the frontend:

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
