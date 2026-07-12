<p align="center">
  <img src="public/chaticons/logo_chat.png" width="88" height="88" alt="Paradox logo">
</p>

<h1 align="center">Paradox</h1>

<p align="center">
  A local-first, bring-your-own-key AI workspace for chat, web research, files, and connected apps.
</p>

## Overview

Paradox is a responsive Next.js application for streaming conversations across multiple AI providers. It combines model selection, web-grounded answers, deep research, citations, file analysis, and MCP tools in one interface.

## Feature Systems

### Streaming Chat

- Streams text, reasoning, tool activity, research progress, and citations through the chat API.
- Persists messages incrementally and restores interrupted in-progress responses when possible.
- Supports multiple AI providers, model switching, conversation branching, and image/PDF context.

### Search and Deep Research

- Search mode gives the selected model access to live web tools within a normal conversation.
- Deep Research first creates a structured plan of up to six steps, then executes search, social search, direct page reading, or site mapping as required.
- Research progress is streamed into an expandable timeline before the gathered material is synthesized into a cited response.

### Generative UI

- Structured component directives are parsed incrementally alongside streamed Markdown.
- A lazy-loaded registry renders interactive stock, crypto, weather, meeting, event, task/project, and deployment cards.
- Normal prose, code, tables, mathematics, and inline citations continue through the Markdown renderer around those components.

### Apps and Tools

- Apps & Tools provides preset connectors and a custom MCP endpoint workflow.
- Custom connectors support automatic authentication detection, public or bearer-token access, OAuth with PKCE, and automatic/direct/proxy connection modes.
- Tool schemas are discovered, cached locally, and namespaced to prevent collisions. Connected apps can be enabled per conversation from Add to chat.

### Sources, Files, and History

- Inline citations open grouped source details; complete source sets use a responsive desktop inspector or mobile bottom sheet.
- Attachments are stored separately from library metadata in IndexedDB and loaded lazily for previews.
- The library supports search, type filters, downloads, deletion, and navigation back to the originating chat.
- Chat history is browser-local and supports pagination, rename/delete actions, search, and branching.

## Getting Started

### Requirements

- Node.js 20 or newer
- npm

### Run Locally

```bash
git clone https://github.com/iamakchavan/Paradox.git
cd Paradox
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), then add at least one AI provider key from **Settings -> AI Providers**. Search-service keys can be configured under **Settings -> Search & Scrape**.

Provider keys, search services, and connectors are configured directly through Settings and Apps & Tools. No environment setup is required.

## Development

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npx tsc --noEmit` | Run the TypeScript check |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build |

## Architecture

- `app/(main)` contains the chat, library, apps, and responsive workspace routes.
- `app/api/chat` owns provider selection, tools, prompts, and streaming responses.
- `components/chat` contains focused UI packages for messages, input, settings, sources, integrations, and navigation.
- `hooks` owns browser persistence and reusable application state.
- `lib` contains the model registry, IndexedDB schema, research clients, and shared utilities.

The application uses Next.js 16, React, TypeScript, the Vercel AI SDK, Tailwind CSS, Radix UI, Framer Motion, and Dexie.

## Data and Keys

Chats, messages, attachments, library metadata, and connector configuration are stored in the browser with IndexedDB. Provider and search keys are stored in browser local storage and sent to the application API only when needed to call the selected service. Browser storage is not encrypted, so use Paradox only on devices and deployments you trust.

## Deployment

Paradox can be deployed to any host that supports Next.js server routes and streaming responses. The included Next.js configuration intentionally disables framework compression so chat and research streams are not buffered.

## License

[MIT](LICENSE)
