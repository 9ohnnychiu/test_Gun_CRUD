# Gun.js CRUD Demo

🚀 **Live Demo:** [https://9ohnnychiu.github.io/test_Gun_CRUD/](https://9ohnnychiu.github.io/test_Gun_CRUD/)

A decentralized, offline-first notes app built with [Next.js](https://nextjs.org/) and [Gun.js](https://gun.eco/) to demonstrate full **CRUD** (Create, Read, Update, Delete) operations on a peer-to-peer database.

## Features

- **Create** – Add new notes with a simple input form
- **Read** – Notes are streamed in real-time from the Gun.js graph database
- **Update** – Inline editing with save/cancel controls
- **Delete** – Remove notes instantly (set node to `null` in Gun.js)
- **Offline-first** – Gun.js persists data locally and syncs when peers are available
- **Decentralized** – No central server required; data lives in the browser via Gun.js

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| UI Library | [React 19](https://react.dev/) |
| Database | [Gun.js](https://gun.eco/) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) |
| Icons | [Lucide React](https://lucide.dev/) |
| Language | TypeScript |

## Project Structure

```
├── app/
│   ├── page.tsx          # Root page – dynamically imports GunDemo (SSR disabled)
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   └── GunDemo.tsx       # Main CRUD component using Gun.js
├── hooks/
│   └── use-mobile.ts     # Mobile detection hook
└── lib/
    └── utils.ts          # Shared utilities
```

## Getting Started

**Prerequisites:** Node.js (v18 or later recommended)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the development server:**
   ```bash
   npm run dev
   ```

3. **Open** [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run clean` | Clean the Next.js build cache |

## How It Works

Gun.js is initialized client-side only (SSR is disabled via `next/dynamic`) because it relies on browser APIs such as `window` and `localStorage`.

```ts
// app/page.tsx
const GunDemo = dynamic(() => import('@/components/GunDemo'), { ssr: false });
```

Inside `GunDemo.tsx` all four CRUD operations map directly to Gun.js APIs:

```ts
const gun = Gun();
const notesNode = gun.get('demo-notes-app-v2');

// Create
notesNode.get(id).put(newNote);

// Read (real-time listener)
notesNode.map().on((note, id) => { /* update state */ });

// Update
notesNode.get(id).put({ text: updatedText });

// Delete
notesNode.get(id).put(null);
```
