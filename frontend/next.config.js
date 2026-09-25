module.exports = {
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'http://localhost:5000/:path*',
      },
    ];
  },
};
