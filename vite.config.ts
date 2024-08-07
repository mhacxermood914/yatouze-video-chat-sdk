/* eslint-disable @typescript-eslint/no-unused-vars */
import react from "@vitejs/plugin-react";
import { defineConfig } from 'vite';
import tailwindcss from 'tailwindcss';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

export default defineConfig(({ mode }) => {
  const { APP_URL } = process.env;

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    define: {
      // Pass environment variables to the client-side code
      'process.env': {
        APP_URL: JSON.stringify(APP_URL),
      },
    },
  };
});
