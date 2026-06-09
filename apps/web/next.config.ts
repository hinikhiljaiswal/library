import type { NextConfig } from 'next';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

if (process.env.RENDER === 'true') {
  if (!apiUrl) {
    throw new Error(
      'Missing NEXT_PUBLIC_API_URL. Add it to the Render web service environment as https://<your-api-service>.onrender.com, then redeploy.',
    );
  }

  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(apiUrl)) {
    throw new Error('NEXT_PUBLIC_API_URL must be the public API URL in production, not localhost.');
  }

  const url = new URL(apiUrl);
  if (url.hostname.endsWith('.onrender.com') && url.port) {
    throw new Error('NEXT_PUBLIC_API_URL must not include a port for Render public URLs.');
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: apiUrl,
  },
};

export default nextConfig;
