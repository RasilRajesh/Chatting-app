# Live Chat – Real-time Messaging Web App

A production-ready real-time live chat application built with **Next.js (App Router)**, **TypeScript**, **Convex**, **Clerk**, **Tailwind CSS**, and **shadcn/ui**-style components.

## Features

### Required
- **Authentication** – Clerk (email sign-in/sign-up), user profile and avatar, Convex user sync, protected routes, loading states
- **Schema** – Users, conversations, messages, conversationReads, typingStatus, reactions with indexes
- **User list & search** – All users (except current), real-time search, start or open conversation, sidebar with last message and unread badge
- **One-on-one real-time messaging** – Convex subscriptions, send with Enter, prevent empty messages
- **Message timestamps** – Today (time only), this year (date + time), other (full date)
- **Empty states** – No conversations, no messages, no search results, no group members, no reactions
- **Responsive layout** – Desktop: sidebar + chat; mobile: list first, tap to open full-screen chat, back to list
- **Online/offline** – Set online on load, offline on unload, green dot, real-time
- **Typing indicator** – Update on type, “User is typing…”, hide after 2s inactivity and on send
- **Unread count** – Per conversation, badge in sidebar, clear when opened, real-time

### Optional
- **Delete own messages** – Soft delete, “This message was deleted”
- **Reactions** – 👍 ❤️ 😂 😮 😢, toggle, counts, real-time
- **Loading & error states** – Skeletons, send spinner, retry on failure
- **Group chat** – Create group, name, multiple members, group name and count in sidebar

## Tech Stack

- **Next.js 15** (App Router)
- **TypeScript** (strict)
- **Convex** (database + realtime)
- **Clerk** (auth)
- **Tailwind CSS**
- **shadcn/ui**-style components (Radix-based)

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd live-chat-app
npm install
```

### 2. Environment variables

Copy the example env file and fill in values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

- **Convex**  
  - `NEXT_PUBLIC_CONVEX_URL` – from [Convex Dashboard](https://dashboard.convex.dev) after creating a project.

- **Clerk**  
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`  
  - `CLERK_SECRET_KEY`  
  From [Clerk Dashboard](https://dashboard.clerk.com) → API Keys.

### 3. Convex

```bash
npx convex dev
```

This will:

- Create/link the Convex project
- Push the schema and functions
- Generate types (e.g. `convex/_generated/`)

Keep this running in a separate terminal while developing.

### 4. Clerk + Convex (JWT for Convex auth)

So Convex can authenticate requests using Clerk:

1. **Clerk**  
   - Dashboard → JWT Templates → New template → Convex.  
   - Name it e.g. `convex`.  
   - Copy the **Issuer URL** (e.g. `https://…clerk.accounts.dev`).

2. **Convex**  
   - Dashboard → Settings → Auth → Add provider.  
   - Choose **Clerk**.  
   - Paste the Clerk Issuer URL and save.

3. **App**  
   - In Clerk, the Convex template is usually used by default when you use `getToken({ template: "convex" })`.  
   - This app uses `convex/react-clerk`, which passes the Clerk token to Convex; ensure the template name matches what Convex expects (often `convex`).

### 5. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up or sign in with Clerk; your user is synced to Convex and you can start chatting.

## Project structure

```
app/
  layout.tsx              # Root layout (Clerk + Convex providers)
  page.tsx                 # Redirects to /chat/new
  globals.css
  sign-in/[[...sign-in]]/page.tsx
  sign-up/[[...sign-up]]/page.tsx
  chat/
    layout.tsx             # Chat layout, user sync, online status, Sidebar
    new/page.tsx           # New chat (user list)
    [conversationId]/page.tsx  # Conversation view

components/
  Sidebar.tsx              # Conversations, search, new group, unread badges
  ChatWindow.tsx           # Messages, input, typing, new-messages button
  MessageBubble.tsx         # Single message, delete, reactions
  TypingIndicator.tsx
  UserSearch.tsx
  GroupCreateModal.tsx
  Reactions.tsx
  providers/
    ConvexClientProvider.tsx
    ChatContext.tsx
  ui/                      # Button, Input, Avatar, Dialog, etc.

convex/
  schema.ts                # users, conversations, messages, etc.
  users.ts
  conversations.ts
  messages.ts
  typing.ts
  reactions.ts
  conversationReads.ts
  auth.config.ts
```

## Deployment (Vercel)

### 1. Convex production

```bash
npx convex deploy
```

Use the production deployment URL in Vercel env (see below).

### 2. Vercel

1. Import the repo in [Vercel](https://vercel.com).
2. Add environment variables:
   - `NEXT_PUBLIC_CONVEX_URL` – Convex **production** URL from `npx convex deploy`.
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. In Clerk Dashboard, set the production URL in **Allowed redirect URLs** (e.g. `https://your-app.vercel.app`).
4. Deploy.

### 3. Convex auth in production

In Convex Dashboard, the same Clerk JWT issuer (from setup step 4) is used for production as long as the Convex project is the same. No extra Convex config is needed if you only have one Convex project.

## Scripts

- `npm run dev` – Next.js dev server
- `npm run build` – Next.js production build
- `npm run start` – Next.js production server
- `npx convex dev` – Convex dev (schema + functions)
- `npx convex deploy` – Convex production deploy

## License

MIT
