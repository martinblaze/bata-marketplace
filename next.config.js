/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'res.cloudinary.com', 'lh3.googleusercontent.com'],
  },
  // Removed experimental.serverActions as it's now stable and enabled by default
}

module.exports = nextConfig