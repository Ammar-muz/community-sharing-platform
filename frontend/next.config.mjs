module.exports = {
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: 'http://44.200.227.55:5000/:path*',
      },
    ];
  },
};
