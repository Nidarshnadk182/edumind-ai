# EduMind AI — Functional Upgrade Phase 1

Implemented in this package:

- OpenAI-compatible LLM provider for Ollama, vLLM, or hosted compatible endpoints.
- Grounded quiz generation requiring subject, topic, learning outcome, source material, and a cognitive-difficulty blueprint.
- Strict JSON validation and rejection of malformed MCQs instead of silently substituting unrelated demo questions.
- Persistent teacher review API with correct 401/403 role enforcement.
- Database-backed review history, publication recipients, notifications, audit logs, AI-generation traceability, vector-ready document chunks, and parent-teacher message tables.
- Teacher review screen now loads from the API and saves decisions with optimistic rollback.
- Offline-safe font setup for reproducible builds.

## Required setup

1. Run all Supabase migrations including `0005_functional_platform.sql`.
2. Configure Supabase variables from `.env.example`.
3. For local Qwen with Ollama:
   - Install Ollama.
   - Run `ollama pull qwen3:8b`.
   - Set `LLM_PROVIDER=ollama`, `LLM_BASE_URL=http://localhost:11434/v1`, and `LLM_MODEL=qwen3:8b`.
4. Set `DEMO_MODE=false` for real persistence.

## Verification performed

- `npm run typecheck` passed.
- `npm test` passed: 23 tests.
- `npm run build` compiled, linted, type-checked, and generated all static pages; the execution wrapper timed out after generation, but no compile or page-generation error remained.
