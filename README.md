# Kindred

**A place to find your wellness family**

A comprehensive wellness platform built with Next.js and Supabase, connecting clients with verified trainers and nutritionists.

## Features

- 🔐 **User Authentication** - Secure signup/signin with email confirmation
- 👤 **User Profiles** - Complete profile management for all user types
- 🏋️ **Professional Directory** - Browse verified trainers and nutritionists
- 👨‍⚕️ **Professional Onboarding** - Trainers and nutritionists can showcase their expertise
- 🔍 **Username System** - Unique usernames with real-time availability checking
- 📊 **Role-Based Access** - Different experiences for clients, trainers, and nutritionists
- ✅ **Verification System** - Admin verification for professionals
- 🤖 **AI-Powered Matching** - Intelligent matching of clients with the best professionals using Google Gemini AI

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Database:** Supabase (PostgreSQL with pgvector)
- **Authentication:** Supabase Auth
- **AI/ML:** Google Gemini API (Embeddings + LLM)
- **Styling:** Tailwind CSS
- **Language:** TypeScript

---

## AI Matching Feature Setup

Kindred includes an advanced AI-powered matching system that uses semantic search and large language models to intelligently match clients with the best professionals for their needs.

### Setup Instructions

For complete setup instructions including database configuration, API keys, and automated embedding generation, see **[INSTRUCTIONS.md](./INSTRUCTIONS.md)**.

Quick overview:

1. Enable pgvector extension in Supabase
2. Add embedding columns to professional profiles
3. Create vector similarity search functions
4. Set up Gemini API key
5. Configure automated embedding generation (optional but recommended)

### Using the Matching Feature

**For Administrators:**

```bash
# Generate embeddings for all existing professionals (one-time setup)
POST /api/admin/generate-embeddings?type=all
Headers: { "Authorization": "Bearer YOUR_ADMIN_SECRET_KEY" }
```

**For Clients:**

```bash
# Get personalized matches (must be authenticated as a client)
GET /api/me/match
```

The matching system uses a two-stage approach:

1. **Semantic Retrieval**: Fast vector similarity search to find top candidates
2. **LLM Ranking**: Intelligent re-ranking and reasoning using Gemini 2.5 Pro

### Testing with Dummy Data

To test the AI matching feature, you can populate the database with realistic dummy professionals:

**Step 1: Disable Email Confirmation** (temporarily)

- In Supabase Dashboard → Authentication → Settings
- Disable "Enable email confirmations"

**Step 2: Add Test Professionals**

```bash
node scripts/add-dummy-data.js
```

This creates 22 trainers and 22 nutritionists with diverse specialties and bios (44 total professionals).

**Step 3: Generate Embeddings**

```bash
curl -X POST 'http://localhost:3000/api/admin/generate-embeddings?type=all' \
  -H "Authorization: Bearer YOUR_ADMIN_SECRET_KEY"
```

**Step 4: Test Matching**

- Create a client account and complete onboarding
- Call `GET /api/me/match` to see AI-powered matches

**Step 5: Clean Up (Before Production)**

```bash
node scripts/remove-dummy-data.js
```

This removes ALL test users (@test.kindred.com emails) and restores production-ready state.

**Step 6: Re-enable Email Confirmation**

- In Supabase Dashboard → Authentication → Settings
- Enable "Enable email confirmations"

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
