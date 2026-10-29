# Conversational Train Search

A personal-use train search assistant with a React chat interface and a Node.js
backend. Users can describe a journey in natural language, provide the missing
travel details through a conversation, and then start an automated train search.

The project combines:

- React and Vite for the frontend
- Express for the backend API
- An Ollama-compatible chat model for extracting journey details
- Redis for short-lived chat sessions and API rate limiting
- Selenium WebDriver and Chrome for browser-based train searches

## Important limitation

The Selenium workflow depends on the target railway website being accessible
from the machine running Chrome. Railway websites may show different content,
challenge pages, or block requests from cloud/datacenter IP addresses. For
that reason, this project is best run locally for personal use. A successful
backend deployment does not guarantee that the browser automation will work
from a cloud provider.

Use the automation responsibly, respect the target website's terms of use and
rate limits, and do not use this project to bypass access controls or
anti-bot protections.

## Requirements

- Node.js 20 or newer
- npm
- Google Chrome or Chromium
- A Redis instance
- An Ollama-compatible model provider:
  - Ollama Cloud, with an API key, or
  - a local Ollama server

## Clone the project

```bash
git clone <your-repository-url>
cd automation
```

## Configure the backend

Copy the included example file:

```bash
cp backend/.env.example backend/.env
```

On Windows PowerShell, use:

```powershell
Copy-Item backend\.env.example backend\.env
```

Then replace the placeholder values in `backend/.env` with your own
credentials. The complete template is available at
[`backend/.env.example`](./backend/.env.example).

If you run Ollama locally, use a local URL and omit the cloud key:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=<installed-model-name>
```

Never commit `.env` files or API keys to version control. Replace the example
values with credentials created in your own Redis and model-provider accounts.

Install backend dependencies:

```bash
cd backend
npm install
```

Start the backend:

```bash
npm start
```

The API listens on `http://localhost:3000` by default.

## Configure and run the frontend

In another terminal:

```bash
cd frontend/frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally:

```text
http://localhost:5173
```

During local development, Vite proxies `/api` requests to
`http://localhost:3000`.

If the frontend and backend are hosted separately, create
`frontend/frontend/.env` and set the public backend URL:

```env
VITE_API_URL=https://your-backend.example.com/api/chat
```

The frontend derives the `/api/search` URL from `VITE_API_URL`.

## Available API endpoints

### `POST /api/chat`

Continues a conversational session and extracts:

- departure station
- destination station
- journey date

Example request:

```json
{
  "sessionId": "a-valid-session-id",
  "message": "I want to travel from New Delhi to Mumbai tomorrow"
}
```

### `POST /api/search`

Starts the Selenium-based train search after the journey details are complete.

Example request:

```json
{
  "sessionId": "a-valid-session-id",
  "from": "NDLS",
  "to": "CSMT",
  "date": "30/10/2026"
}
```

The browser must be able to start Chrome in headless mode. The backend already
sets the common server-compatible Chrome flags:

- `--headless=new`
- `--no-sandbox`
- `--disable-dev-shm-usage`

## Useful commands

Backend:

```bash
cd backend
npm start
npm test
```

Frontend:

```bash
cd frontend/frontend
npm run dev
npm run build
npm run lint
```

## Troubleshooting

### Redis configuration errors

Confirm that `REDIS_URL` is present and includes the correct protocol,
credentials, host, and port. Hosted Redis services commonly require a TLS
connection beginning with `rediss://`.

### Ollama authentication errors

If `OLLAMA_URL` points to `https://ollama.com`, set
`OLLAMA_API_KEY` to a valid key from your own account. For local Ollama, use
`http://localhost:11434` instead.

### Chrome or Selenium errors

Confirm that Chrome/Chromium is installed and that `CHROME_BIN` points to the
correct executable when it is not discoverable automatically. If Chrome starts
but the expected page elements cannot be found, inspect the target website
response from the same machine. The website may have changed its markup, may
be loading slowly, or may be blocking the machine's IP address.

### Cloud deployment

The API can be deployed to a Node-compatible host, but the Selenium search may
not work from a datacenter IP. For reliable personal use, run the backend on a
local computer or another permitted environment with a normal browser network
connection.

## Project structure

```text
automation/
├── backend/
│   ├── llm/                 # Conversation and journey extraction
│   ├── scraper/             # Selenium browser automation
│   ├── server.js            # Express API
│   ├── rateLimit.js         # Redis-backed rate limiting
│   └── validation.js        # Request validation
└── frontend/
    └── frontend/
        ├── src/             # React application
        └── vite.config.js   # Local API proxy
```

## Disclaimer

This is an educational and personal-use project. It is not affiliated with,
endorsed by, or sponsored by any railway operator or third-party website.
Availability, fares, schedules, and search results should always be verified
on the official service before making travel decisions or purchases.
