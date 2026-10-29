# Koudamki VAPT Suite

A small VAPT-style security dashboard with a secure backend chat proxy for Groq.

## Features
- VAPT Kanban board for findings
- Security report generator
- Defensive coding examples for SQL injection and XSS
- Chat assistant that calls the backend instead of exposing a secret API key in the browser

## Required environment variable
Create a local environment file or set this in your deployment environment:

GROQ_API_KEY=your_key_here

Optional:
GROQ_MODEL=llama-3.3-70b-versatile

## Local setup
1. Copy `.env.example` to a real environment file for your platform.
2. Add your Groq API key.
3. Deploy to Vercel or run a static server for the frontend.
4. Use the app normally; the frontend only calls `/api/chat`.

## Important security note
Never put your Groq API key in browser JavaScript or in `localStorage`. The browser should only call your backend endpoint.

## Deployment
For Vercel:
- Add `GROQ_API_KEY` in Project Settings > Environment Variables
- Deploy the repo
- The `/api/chat` route will use it securely

## Files of interest
- `vapt.html` — security dashboard UI
- `api/chat.js` — backend chat proxy to Groq
- `vercel.json` — Vercel routing
