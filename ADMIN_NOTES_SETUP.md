# Admin Notes Database Persistence

## What Was Implemented

1. **Migration fix** – [20250208000000_add_notes_to_soli_contribution_settings.sql](supabase/migrations/20250208000000_add_notes_to_soli_contribution_settings.sql) was updated to target `ticket_settings` (the table name at that point in migration history). Previously it referenced `soli_contribution_settings`, which is created later by `20260119120000`.

2. **Supabase MCP** – [.cursor/mcp.json](.cursor/mcp.json) was added to allow migrations via MCP in Cursor. **Restart Cursor** so the Supabase MCP loads, then log in when prompted.

## Verify the Notes Column Exists

If migrations were applied before the fix, the `notes` column may already exist. To check in the Supabase Dashboard:

1. Go to [Supabase Dashboard](https://app.supabase.com) → your project → **SQL Editor**
2. Run:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'soli_contribution_settings' 
  AND column_name = 'notes';
```

- If a row is returned, the column exists and notes persistence is ready.
- If no row is returned, apply the migration.

## Apply the Migration (if needed)

**Option A: Supabase Dashboard**

1. Go to SQL Editor.
2. Run:

```sql
ALTER TABLE public.soli_contribution_settings 
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN public.soli_contribution_settings.notes IS 'Admin notes for Soli-Contribution settings. Autosaves as user types.';
```

Use `soli_contribution_settings` because the table has already been renamed in production.

**Option B: Supabase CLI**

```bash
supabase link --project-ref ndhfsjroztkhlupzvjzh
supabase db push
```

**Option C: Supabase MCP (after restarting Cursor)**

Ask Cursor to apply the migration using the Supabase MCP `apply_migration` tool.

## Test Notes Persistence

1. Log in as an admin.
2. Open **Admin** → **Tickets** → **Settings**.
3. Type in the Notes textarea.
4. Wait about 1 second (autosave).
5. Reload the page and confirm the notes persist.
