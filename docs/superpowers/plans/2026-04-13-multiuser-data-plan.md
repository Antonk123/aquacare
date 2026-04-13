# Fas 2: Fleranvändardata — Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development to implement this plan.

**Goal:** Migrate water logs, notes, and schedule from localStorage to SQLite API so all facility users share data.

**Architecture:** New migration adds 3 tables. New API routes follow same patterns as Fas 1. Frontend hooks switch from useLocalStorage to fetch-based state. Settings stay in localStorage.

**Tech Stack:** Same as Fas 1 — Express, better-sqlite3, existing React hooks.

---

## Tasks

### Task 1: Database migration 002

Create `server/migrations/002_data_tables.sql` with water_logs, notes, schedule_completions tables.

### Task 2: Water Logs API routes

Create `server/routes/waterLogs.ts` — GET (list), POST (create), PATCH (update), DELETE.

### Task 3: Notes API routes

Create `server/routes/notes.ts` — GET (list), POST (create), PATCH (toggle/update), DELETE.

### Task 4: Schedule API routes

Create `server/routes/schedule.ts` — GET completions per period, POST toggle.

### Task 5: Streak API route

Add GET `/api/streak` to auth routes — compute from water_logs.

### Task 6: Register new routes in server/index.ts

### Task 7: Update useWaterLog hook to use API

### Task 8: Update useNotes hook to use API

### Task 9: Update useSchedule hook to use API

### Task 10: Update Dashboard streak to use API

### Task 11: Smoke test full flow
