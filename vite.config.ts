import { defineConfig } from 'vite';
import path from 'node:path';
import { execSync } from 'node:child_process';
import react from '@vitejs/plugin-react-swc';

// Resolve git commit and build time at build-time for display in production builds.
function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'unknown';
  }
}

const buildMeta = {
  commit: getGitCommit(),
  time: new Date().toISOString(),
};

// https://vitejs.dev/config/
export default defineConfig({
  // App will be served from http://sunlis.github.io/stylus_sudoku
  base: '/stylus_sudoku/',
  define: {
    __APP_COMMIT__: JSON.stringify(buildMeta.commit),
    __APP_BUILD_TIME__: JSON.stringify(buildMeta.time),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src'),
      '@static': path.resolve(__dirname, 'static'),
    },
  },
  server: {
    host: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts'
  }
});
