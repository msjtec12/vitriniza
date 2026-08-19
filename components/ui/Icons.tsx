import React from 'react';

export const InstagramIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const WhatsAppIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

export const WhatsAppSolidIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.4 1.28-1.92 1.34-.5.06-1.12.1-3.23-.77-2.7-1.12-4.44-3.87-4.57-4.05-.13-.18-1.08-1.44-1.08-2.74 0-1.3.68-1.94.92-2.2.24-.26.53-.33.71-.33.18 0 .35 0 .5.01.16.01.37-.06.58.44.22.52.74 1.8.8 1.93.06.13.1.29.02.46-.08.18-.13.29-.26.43-.13.14-.27.32-.38.43-.13.13-.26.26-.11.52.15.26.67 1.1 1.44 1.78.99.88 1.82 1.15 2.08 1.28.26.13.41.11.56-.06.15-.17.65-.75.82-1.01.17-.26.35-.22.58-.13.24.09 1.5.71 1.76.84.26.13.43.2.49.31.06.11.06.66-.18 1.34z" />
  </svg>
);

export const VerifiedCheckIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.41 14.59L6.3 12.3a.996.996 0 1 1 1.41-1.41L10.59 13.76l6.89-6.89a.996.996 0 1 1 1.41 1.41l-7.6 7.6a.996.996 0 0 1-1.41 0z" />
  </svg>
);

export const PixIcon = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M9.8 14.2l2.2-2.2 2.2 2.2-2.2 2.2-2.2-2.2zm9.9-4.4l-5.3-5.3c-1.3-1.3-3.5-1.3-4.8 0L4.3 9.8c-1.3 1.3-1.3 3.5 0 4.8l5.3 5.3c1.3 1.3 3.5 1.3 4.8 0l5.3-5.3c1.3-1.3 1.3-3.5 0-4.8zm-2.1 4l-4.1 4.1c-.8.8-2.2.8-3 0L6.4 13.8c-.8-.8-.8-2.2 0-3l4.1-4.1c.8-.8 2.2-.8 3 0l4.1 4.1c.8.8.8 2.2 0 3z" />
  </svg>
);
