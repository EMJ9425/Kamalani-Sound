import type { Configuration } from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';

import { rendererRules } from './webpack.rules';
import { rendererPlugins } from './webpack.plugins';

// Create a copy of renderer rules and add additional rules
const rules = [...rendererRules];

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

// Add rules for image files
rules.push({
  test: /\.(png|jpg|jpeg|gif|svg)$/,
  type: 'asset/resource',
  generator: {
    filename: 'assets/[name][ext]'
  }
});

// Add the copy plugin to copy audio assets
const copyPlugin = new CopyWebpackPlugin({
  patterns: [
    {
      from: path.resolve(__dirname, 'src/assets'),
      to: 'main_window/assets',
      noErrorOnMissing: true
    },
    {
      from: path.resolve(__dirname, 'assets'),
      to: 'main_window/assets',
      noErrorOnMissing: true
    }
  ]
});

export const rendererConfig: Configuration = {
  module: {
    rules,
  },
  plugins: [...rendererPlugins, copyPlugin],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
  // Provide __dirname for webpack runtime
  node: {
    __dirname: true,
    __filename: true,
  },
  // Fix for asset relocator loader __dirname issue
  target: 'electron-renderer',
  // Define __dirname for webpack runtime
  optimization: {
    minimize: false, // Disable minification in development to help with debugging
  },
};
