import { defineConfig, loadEnv } from 'vite';
import { NvidiaServerProxy } from './src/server/nvidiaProxy.ts';

export default defineConfig(({ mode }) => {
  // Load environment variables strictly into Node process.env (server-side only)
  const env = loadEnv(mode, process.cwd(), '');
  if (env.NVIDIA_API_KEY) {
    process.env.NVIDIA_API_KEY = env.NVIDIA_API_KEY;
  }
  if (env.NVIDIA_MODEL) {
    process.env.NVIDIA_MODEL = env.NVIDIA_MODEL;
  }

  return {
    plugins: [
      {
        name: 'venturecue-api-proxy',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && req.url.startsWith('/api/')) {
              NvidiaServerProxy.handleHttpRequest(req, res, next);
            } else {
              next();
            }
          });
        },
        configurePreviewServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url && req.url.startsWith('/api/')) {
              NvidiaServerProxy.handleHttpRequest(req, res, next);
            } else {
              next();
            }
          });
        },
      },
    ],
  };
});
