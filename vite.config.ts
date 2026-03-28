import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import basicSsl from '@vitejs/plugin-basic-ssl';

// https://vitejs.dev/config/
export default defineConfig({
  // App will be served from https://sunlis.github.io/sudoku
  base: '/sudoku/',
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    https: true,
  },
  preview: {
    https: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts'
  }
});
