---
name: db-reset
description: Drop the local dev MongoDB database and rebuild it with the demo seed. Use when the dev data no longer fits the schemas (renamed field, changed unique index, broken seed run).
disable-model-invocation: true
---

# Reset the dev database

`npm run seed` is idempotent: it upserts and never deletes, so documents left
over from an older schema survive it, and an index Mongoose built from an older
schema stays until dropped. Dropping the database removes both.

Both steps destroy every document in the dev database, including uploaded
image references. Say so and wait for the user to confirm before step 1; the
project settings also ask before any seed run.

1. Drop, from the repo root (reads `MONGODB_URI` from `.env.local`, refuses
   `NODE_ENV=production`):

   ```sh
   node --env-file-if-exists=.env.local --input-type=module -e "import mongoose from 'mongoose'; if (process.env.NODE_ENV === 'production') throw new Error('db-reset refuses production'); const uri = process.env.MONGODB_URI; if (!uri) throw new Error('MONGODB_URI is not set'); await mongoose.connect(uri); const name = mongoose.connection.db.databaseName; await mongoose.connection.dropDatabase(); await mongoose.disconnect(); process.stdout.write('dropped ' + name + '\n');"
   ```

2. Rebuild and seed:

   ```sh
   npm run seed
   ```

3. Report the counts the seed printed. Files under `uploads/` that no dish
   references any more stay on disk; the seed rewrites the demo images. A
   running `npm run dev` keeps working: Mongoose reconnects to the new
   database.
