import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Image Sign - Secure Digital Image Authentication',
    short_name: 'Image Sign',
    description: 'Protect your digital assets with cryptographic signatures and verified identity embedding.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/favicon/favicon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/favicon/favicon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
} 