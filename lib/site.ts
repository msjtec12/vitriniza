const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

export const SITE_URL = (configuredUrl || 'https://vitriniza.vercel.app').replace(/\/$/, '');
