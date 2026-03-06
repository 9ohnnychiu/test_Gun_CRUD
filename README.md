# Gun.js CRUD Demo

🚀 **Live Demo:** [https://9ohnnychiu.github.io/test_Gun_CRUD/](https://9ohnnychiu.github.io/test_Gun_CRUD/)

A decentralized, real-time notes app built with [Next.js](https://nextjs.org/) and [Gun.js](https://gun.eco/) that demonstrates full **CRUD** (Create, Read, Update, Delete) operations on a peer-to-peer database — with **instant cross-browser synchronization**.

## Features

- **Create** – Add new notes with a simple input form
- **Read** – Notes are streamed in real-time from the Gun.js graph database
- **Update** – Inline editing with save/cancel controls
- **Delete** – Remove notes instantly (set node to `null` in Gun.js)
- **Cross-browser sync** – Changes propagate instantly to every open tab or browser via Gun relay peers
- **Shareable rooms** – Each session gets a unique URL (`?room=<id>`) that can be shared so others join the same live room
- **Visual sync feedback** – Cards flash with an indigo highlight when they receive a remote update
- **Offline-first** – Gun.js persists data locally and re-syncs automatically when connectivity is restored

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

2. **Configure relay peers (optional for local dev — required in production for cross-browser sync):**
   ```bash
   # .env.local
   NEXT_PUBLIC_GUN_PEERS="https://your-relay.example/gun"
   ```
   If this variable is not set, the app automatically falls back to a public community relay peer (`https://peer.wallie.io/gun`), so cross-browser sync works out-of-the-box without any configuration.

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open** [http://localhost:3000](http://localhost:3000) in your browser.

## Deploying to GitHub Pages

The included GitHub Actions workflow (`.github/workflows/nextjs.yml`) builds and deploys the app automatically on every push to `main`.

For cross-browser sync to work on the deployed site you can optionally pin your own relay peers:

1. Go to your repository **Settings → Secrets and variables → Actions**.
2. Click **New repository secret**.
3. Set **Name** to `NEXT_PUBLIC_GUN_PEERS` and **Value** to a comma-separated list of HTTPS Gun relay endpoints, e.g. `https://your-relay.example/gun`.
4. Push a new commit to `main` — the workflow will pick up the secret and bake the relay URL into the static build.

If the secret is not set, the app falls back to the public community relay automatically.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build for production |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run clean` | Clean the Next.js build cache |

## How Cross-Browser Sync Works

Gun.js is initialized with relay peers from `NEXT_PUBLIC_GUN_PEERS`. Any browser that loads the same room URL automatically connects to those peers and receives all changes in real time:

```ts
const gun = Gun({
  peers: (process.env.NEXT_PUBLIC_GUN_PEERS ?? '')
    .split(',')
    .map((peer) => peer.trim())
    .filter(Boolean),
});
```

When you open the app, it appends a unique `?room=<id>` to the URL. Gun scopes its data graph to that room, so only browsers sharing the same link see the same notes. Copy the link and open it in a second browser — every create, update, and delete will appear instantly in both windows.

## How It Works

Gun.js is initialized client-side only (SSR is disabled via `next/dynamic`) because it relies on browser APIs such as `window` and `localStorage`.

```ts
// app/page.tsx
const GunDemo = dynamic(() => import('@/components/GunDemo'), { ssr: false });
```

Inside `GunDemo.tsx` all four CRUD operations map directly to Gun.js APIs:

```ts
const gun = Gun({
  peers: (process.env.NEXT_PUBLIC_GUN_PEERS ?? '')
    .split(',')
    .map((peer) => peer.trim())
    .filter(Boolean),
});
const notesNode = gun.get(`demo-notes-app-v2-${roomId}`);

// Create
notesNode.get(id).put(newNote);

// Read (real-time listener — fires on every peer update)
notesNode.map().on((note, id) => { /* update state */ });

// Update
notesNode.get(id).put({ text: updatedText });

// Delete
notesNode.get(id).put(null);
```

## Troubleshooting Relay Errors

If DevTools shows messages like:

- `WebSocket connection to 'wss://.../gun' failed`
- status stays `Relay offline`

then your configured relay URL is unreachable (offline, blocked by network/CORS, or no longer maintained).  
Fix it by pointing `NEXT_PUBLIC_GUN_PEERS` to a reachable Gun relay endpoint (or your own relay), then restart the app.

## Testing Cross-Browser Sync

1. Open [the live demo](https://9ohnnychiu.github.io/test_Gun_CRUD/) — a unique room URL is generated automatically.
2. Copy the URL from the indigo banner at the top of the page.
3. Paste it into a second browser window (or a different browser / incognito tab).
4. Add, edit, or delete a note in one window — you'll see the change appear in the other within a second.
