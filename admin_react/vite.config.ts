import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Explicitly loads .env.{mode} — required for VITE_* vars at config time
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    base: env.VITE_BASE_PATH || '/',

    // Dev proxy: only active during npm run dev
    // Forwards /api_staging/* to the real staging backend — avoids CORS on localhost
    // Never touches /api (production) — development cannot reach production backend
    server: {
      proxy: {
        '/api_staging': {
          target: 'http://80.241.218.23',
          changeOrigin: true,
          // Path stays as /api_staging/... — no rewrite needed
        },
        '/uploads_staging': {
          target: 'http://80.241.218.23',
          changeOrigin: true,
        },
      },
    },
  };
});
