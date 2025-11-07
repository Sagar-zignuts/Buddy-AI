# Buddy Chrome Extension (Frontend)

This is a Manifest V3 Chrome extension that injects a React panel on supported coding sites (LeetCode, HackerRank, Codeforces) and talks to the backend at `http://localhost:3175`.

## Prerequisites
- Node 18+
- Backend running on `http://localhost:3175` with POST `/api/ai/hints`

## Install and Build
```bash
cd frontend/buddy-extension
npm install
npm run build
```

The build outputs into `dist/`.

## Load in Chrome
1. Open Chrome → go to `chrome://extensions`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked" and select the `dist/` folder
4. Navigate to a supported site (e.g., `https://leetcode.com`) and the Buddy panel appears in the top-right.

## Development
You can run `npm run dev` to get a quick build in watch mode, but for MV3 content scripts you generally reload the unpacked extension after each build.

## Configuration
- Backend URL is currently hardcoded to `http://localhost:3175` in `src/utils/api.ts`. Update if needed.
- Site parsers live in `src/utils/dom.ts`.

## Files
- `manifest.json`: MV3 manifest
- `vite.config.ts`: Build config for bundling the content script
- `src/content.tsx`: Content script mounting the React UI
- `src/utils/dom.ts`: Extracts problem text from the page
- `src/utils/api.ts`: Calls the backend `/api/ai/hints`
- `src/index.css`: Lightweight styles for the panel
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
