# Business Optimization Simulator V7

This branch contains the complete V7 classroom-platform source as `business-simulator-v7-source.tar.gz`.

## Extract and run

```bash
cd business-simulator-v7
./extract-source.sh
npm install
npm run check
npm run dev
```

The extracted project includes:

- React + TypeScript + Vite student and teacher portals
- local browser demo persistence
- Supabase-ready hosted persistence
- class codes, pseudonymous student sessions, autosave, and submissions
- simulation engine unit tests
- SQL migration with row-level security and RPCs
- architecture and deployment documentation

Hosted mode requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Without them, the app uses browser-local demo mode.
