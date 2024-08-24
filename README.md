# Embeddings with Supabase

This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Project Description

This project integrates with Supabase to manage and search for images based on their embeddings and descriptions. It includes functionality to:

1. **Store Images**: Upload and store images along with their metadata in a Supabase database.
2. **Search Similar Images**: Use a PostgreSQL function to find images that are similar to a given image based on its embedding vector and description.
3. **Display Image Gallery**: Show a gallery of images and allow users to view details and similar images.

### Key Functions

- **match_images**: A PostgreSQL function that retrieves images similar to a given image based on its embedding vector and description.
- **word_similarity**: A helper function that calculates the similarity between two text descriptions.

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

Then, run the development server:
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

## Environment Variables

Rename `env.example` to `.env.local` in the root of your project to add the following environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
OPENAI_API_KEY=your-openai-api-key
```

## Seeding the Database

To seed the database with initial data, run:

```bash
npm run seed-db
```

This will execute the script located at lib/seed.ts.
