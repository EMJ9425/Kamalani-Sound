import type { Configuration } from 'webpack';

// Preload scripts need a minimal webpack config without asset relocator
const preloadRules = [
  // TypeScript loader
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
      },
    },
  },
];

export const preloadConfig: Configuration = {
  module: {
    rules: preloadRules,
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  // Preload scripts run in Node.js context, not browser
  target: 'electron-preload',
  // Don't provide Node.js polyfills since we're in Node.js context
  node: {
    __dirname: false,
    __filename: false,
  },
  // Disable optimization for debugging
  optimization: {
    minimize: false,
  },
};
