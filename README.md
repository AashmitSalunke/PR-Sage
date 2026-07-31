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

# 📸 Project Screenshots

## 1. Dashboard / Home Page

<img width="1917" height="876" alt="image" src="https://github.com/user-attachments/assets/b8a9ee97-8ba2-4977-b230-c459dd5481cd" />


## 2. GitHub Pull Request Review

<img width="1917" height="882" alt="image" src="https://github.com/user-attachments/assets/a759e4e0-21f3-48c4-bb31-e3794b31a8c2" />




## 3. AI Review Streaming (SSE)

<img width="1917" height="862" alt="image" src="https://github.com/user-attachments/assets/806f69fd-41c9-46ee-831e-456a11416386" />


## 4. Inline GitHub Comments
<img width="410" height="357" alt="image" src="https://github.com/user-attachments/assets/c1077a57-864b-4ffc-80c1-f2614b0ca676" />




## 5. Review History

<img width="1917" height="877" alt="image" src="https://github.com/user-attachments/assets/b199fd85-235e-46e2-916f-1825a9a8eec1" />


## 6. User Settings

<img width="1917" height="877" alt="image" src="https://github.com/user-attachments/assets/bfbad888-8805-46ce-a83a-53455b6f6a79" />


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

## Deploy to Netlify

This project is split into a frontend and backend:

- Frontend: Netlify static site
- Backend: separate Node/Express host such as Render, Railway, or another VPS

### Netlify frontend setup

1. Import this repo into Netlify.
2. Set the build command:

```bash
cd client && npm install && npm run build
```

3. Set the publish directory to:

```bash
client/dist
```

4. Add the environment variable in Netlify:

```bash
VITE_API_BASE_URL=https://your-backend-url.example.com/api
```

5. Make sure your backend allows the Netlify domain in `CLIENT_URL`:

```bash
CLIENT_URL=https://your-app-name.netlify.app
```

The project already includes the Netlify rewrite config in `netlify.toml`.

---

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

```text
review-agent/
├── client/          # React + Vite frontend
├── server/          # Express + Node.js backend
├── .env             # Environment variables template
└── README.md
```
