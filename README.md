# PR-Sage 🤖

Built PR Sage, a full-stack AI code review platform that autonomously analyzes GitHub Pull Requests using the Google Gemini API. Features real-time review streaming via SSE, inline GitHub comment posting, JWT-based auth, per-user settings, and full review history — all on a MERN stack.

---

## Architecture

```
React (Vite)  ──REST/SSE──►  Express/Node.js  ──Mongoose──►  MongoDB
                                   │
                          ┌────────┴────────┐
                     GitHub API          Gemini API
                  (diffs / comments)   (LLM streaming)
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18 |
| MongoDB | ≥ 6 (local or Atlas) |
| Git | Any |

### Get a Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create an API key and add it to your `.env` file.

---

## Quick Start

### 1. Clone & configure

```bash
git clone <repo-url>
cd review-agent
cp .env .env.local   # edit values
```

### 2. Server

```bash
cd server
npm install
npm run dev      # nodemon (port 5000)
```

### 3. Client

```bash
cd client
npm install
npm run dev      # Vite (port 5173)
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login, receive JWT |
| GET | `/api/auth/me` | Current user info |
| POST | `/api/reviews` | Start PR review (SSE stream) |
| GET | `/api/reviews/:id` | Get single review |
| POST | `/api/reviews/:id/post-comments` | Post comments to GitHub |
| GET | `/api/history` | Paginated review history |
| DELETE | `/api/history/:id` | Delete a review |
| GET | `/api/settings` | Get settings |
| PUT | `/api/settings` | Update settings |

---

## Environment Variables

See `.env` for the full list. Key variables:

- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — Secret for signing JWTs (min 32 chars)
- `ENCRYPTION_KEY` — 32-char key for encrypting GitHub tokens in DB
- `GEMINI_API_KEY` — Google Gemini API key

---

## Project Structure

```
review-agent/
├── client/          # React + Vite frontend
├── server/          # Express + Node.js backend
├── .env             # Environment variables template
└── README.md
```
