import type { Configuration } from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import path from 'path';

import { rules } from './webpack.rules';
import { plugins } from './webpack.plugins';

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

// Add rules for audio files
rules.push({
  test: /\.(mp3|wav|ogg|m4a)$/,
  type: 'asset/resource',
  generator: {
    filename: 'assets/[name][ext]'
  }
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
  plugins: [...plugins, copyPlugin],
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
  },
};
