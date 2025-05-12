# Nuna API Setup Guide

Follow these steps to properly set up and run the Nuna API project:

## 1. Update tsconfig.json

First, update your `tsconfig.json` to use CommonJS modules instead of ESM:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "esModuleInterop": true,
    "outDir": "./dist",
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

## 2. Update Import Paths

Update all import statements in your files to use `.js` extensions or remove extensions completely for CommonJS:

For example, in `index.ts`:

```typescript
import authRoutes from "./src/routes/authRoutes";
import journalRoutes from "./src/routes/journalRoutes";
```

And in other route files:

```typescript
import { protect } from "../middleware/auth";
```

## 3. Generate Prisma Client

Run the following command to generate the Prisma client based on your schema:

```bash
npx prisma generate
```

This is crucial as it ensures the `journal` model is properly recognized in the Prisma client.

## 4. Create Database and Run Migrations

To set up your database:

```bash
npx prisma migrate dev --name init
```

## 5. Run the Application

Start the development server:

```bash
npm run dev
```

