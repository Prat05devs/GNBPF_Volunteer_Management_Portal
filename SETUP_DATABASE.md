# Database Setup for Prisma Accelerate

## Problem
The tables don't exist in your database yet, causing the "table does not exist" error.

## Solution: Deploy Schema via Prisma Console

### Steps:

1. **Go to Prisma Console**
   - Visit: https://console.prisma.io
   - Log in with your account

2. **Find Your Project**
   - Navigate to your GNBPF project
   - It should be the one associated with your Accelerate API key

3. **Deploy the Schema**
   Option A - If you see "Data Browser":
   - Click on "Data Browser"
   - Look for "Deploy Schema" or "Apply Schema" button
   - Upload or paste your schema from `prisma/schema.prisma`
   
   Option B - If you see "Schema" tab:
   - Go to the "Schema" section
   - Click "Edit Schema"
   - Paste the contents of your `prisma/schema.prisma`
   - Click "Deploy" or "Apply"

4. **Verify Tables Created**
   - Check the Data Browser to see if tables like User, Task, Attendance, Submission exist
   - You should see all 4 tables created

### Alternative: Use Direct Database URL

If you have access to a direct PostgreSQL connection string (not through Accelerate), add it to `.env`:

```env
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/..."  # Keep this
DIRECT_URL="postgresql://user:password@host:5432/database"      # Add this
```

Then update `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")  # Add this line
}
```

Then run: `yarn prisma db push`

## After Setup

Once tables are created, restart the dev server and try registering again!
