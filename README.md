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

## Publish with GitHub Actions

```bash
npm run build
```

This repository includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml` that automatically publishes the `dist` build to GitHub Pages whenever code is pushed to `main` or `master`.

Before the first deployment, enable **Settings → Pages → Source: GitHub Actions** in the repository.
