import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    outDir: 'dist',
  }
})
```

---

## Step 5 — Add Environment Variable for Gemini Key

Right now your Gemini API key is hardcoded in the files. Before deploying you should move it to an environment variable so it's not exposed publicly on GitHub.

Create a file called `.env` in your project root:
```
VITE_GEMINI_KEY=AIzaSyCURZ8pc2rIDWuI0jORYQdBSLH-lZOg9-w