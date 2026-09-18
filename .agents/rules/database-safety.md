# CRITICAL DATABASE SAFETY RULE — SUNLIFE SOLAR

## ABSOLUTELY FORBIDDEN DATABASE

The Neon PostgreSQL database at `ep-gentle-king-apfztpuu-pooler.c-7.us-east-1.aws.neon.tech` belongs to **Bima Headquarter**.

**NEVER** run any database-modifying command (prisma db push, migrate, seed, reset, DROP, DELETE, INSERT, UPDATE, TRUNCATE, schema sync) against this database from the Sunlife Solar project.

## SUNLIFE SOLAR DATABASE

Sunlife Solar uses: `ep-autumn-forest-ayafh9sa-pooler.c-5.us-east-2.aws.neon.tech`

## PRE-FLIGHT CHECK

Before ANY database command:
1. Check `$env:DATABASE_URL` (shell environment)
2. Check `.env` file
3. Verify the hostname is `ep-autumn-forest` (Sunlife Solar)
4. If `ep-gentle-king` appears anywhere — **STOP IMMEDIATELY**

## KNOWN HAZARD

The system shell may have `DATABASE_URL` set to Bima HQ's database. Always override with `.env` values or use `--dotenv` flag.
