/** @type {import('next').NextConfig} */
const { i18n } = require('./next-i18next.config');

// const runtimeCaching = require('next-pwa/cache');
// const withPWA = require('next-pwa')({
//   disable: process.env.NODE_ENV === 'development',
//   dest: 'public',
//   runtimeCaching,
// });

const runtimeCaching = require('next-pwa/cache');
const withPWA = require('next-pwa')({
  disable: process.env.NODE_ENV === 'development',
  dest: 'public',
  runtimeCaching,
});

//module.exports = withPWA({
module.exports = {
  //output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  // Automatically modularize imports (tree-shaking optimization)
  modularizeImports: {
    lodash: { transform: 'lodash/{{member}}' },
    'date-fns': { transform: 'date-fns/{{member}}' },
    'react-icons': { transform: 'react-icons/{{member}}' },
  },
  typescript: {
    ignoreBuildErrors: true, 
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  i18n,
  images: {
    domains: [
      'pickbazarlaravel.s3.ap-southeast-1.amazonaws.com',
      'pixarlaravel.s3.ap-southeast-1.amazonaws.com',
      'lh3.googleusercontent.com',
      'localhost',
      '127.0.0.1',
      'i.pravatar.cc',
      '207.244.67.71',
      'sim2day.com',
      'api.sim2day.com',
      'babasim.com',
      'api.babasim.com',
      '192.168.1.27'
    ],
  },
  ...(process.env.FRAMEWORK_PROVIDER === 'graphql' && {
    webpack(config, options) {
      config.module.rules.push({
        test: /\.graphql$/,
        exclude: /node_modules/,
        use: [options.defaultLoaders.babel, { loader: 'graphql-let/loader' }],
      });

      config.module.rules.push({
        test: /\.ya?ml$/,
        type: 'json',
        use: 'yaml-loader',
      });

      return config;
    },
    experimental: {
    scrollRestoration: true,
    optimizeCss: true,
  },
  }),
  ...(process.env.APPLICATION_MODE === 'production' && {
    typescript: {
      ignoreBuildErrors: true,
    },
    eslint: {
      ignoreDuringBuilds: true,
    },
  }),
  };