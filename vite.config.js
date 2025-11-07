import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/lib/client-auth.ts',
      name: 'auth',
      fileName: 'auth'
    }
  }
});