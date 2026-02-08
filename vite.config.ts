import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const csp = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:5180 ws://localhost:5180 http://127.0.0.1:5180 ws://127.0.0.1:5180 https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com https://api.moonshot.cn; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
const securityHeaders = {
  'Content-Security-Policy': csp,
  'Referrer-Policy': 'no-referrer',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5180,
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
})
