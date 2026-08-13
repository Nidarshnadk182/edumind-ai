# EduMind AI backend setup

## Included in this package

- Provider-independent AI gateway
- Native Ollama integration using `think: false`
- Streaming AI Tutor responses
- Cloud OpenAI-compatible provider support
- AI health endpoint: `GET /api/ai/health`
- Probability-based readiness engine: `POST /api/predictions`
- Adaptive-test blueprint endpoint: `POST /api/adaptive-test`
- pgvector-ready RAG tables and vector-search function
- Parent/teacher messaging tables and APIs
- Supabase RLS foundation

## Local run

```bash
npm install
cp .env.example .env.local
npm run dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
npm run dev
```

## GitHub / Vercel

1. Upload the contents of the inner `edumind-ai` folder to the repository root.
2. Import the repository in Vercel.
3. Add every required environment variable from `.env.example` in Vercel Project Settings.
4. Create a Supabase project and run migrations `0001` through `0006` in order.
5. Add the Supabase URL, anon key, and service-role key to Vercel.
6. Add a hosted LLM provider base URL and API key. Localhost Ollama cannot be reached by Vercel.

## Provider examples

### Local Ollama

```env
LLM_PROVIDER=ollama
LLM_BASE_URL=http://localhost:11434
LLM_FAST_MODEL=qwen3:4b
LLM_DEEP_MODEL=qwen3:8b
```

### OpenAI-compatible cloud service

```env
LLM_PROVIDER=openai-compatible
LLM_BASE_URL=https://provider.example.com/v1
LLM_API_KEY=replace_me
LLM_FAST_MODEL=fast-model-name
LLM_DEEP_MODEL=deep-model-name
```

## Important

The prediction endpoint returns a readiness estimate, not a guaranteed mark. The RAG database layer is included, but document extraction and embedding generation must be connected to a worker or hosted embedding API before uploaded documents can be searched.
