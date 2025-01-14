/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
        return [
            {
                source: '/',
                destination: '/ijara',
                permanent: true,
            },
        ]
    },
}

module.exports = nextConfig
