# Website Review Web Application

The application takes a URL input from the user, fetches metadata and performance metrics from public APIs, and displays them in a modern dashboard.

## Setup commands

```bash
npm create vite@latest . -- --template react
npm install
npm install framer-motion gh-pages
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

## Run locally

```bash
npm run dev
```

## Build and deploy to GitHub Pages

```bash
npm run build
npm run deploy
```
