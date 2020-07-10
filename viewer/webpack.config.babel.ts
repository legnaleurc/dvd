import process from 'process';

import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import OptimizeCSSAssetsPlugin from 'optimize-css-assets-webpack-plugin';

import CdnWebpackPlugin from './tools/cdn_webpack_plugin';


const backendPort = process.env.BACKEND_PORT;


export default function (env: unknown, argv: webpack.Configuration) {
  const isReleaseMode = argv.mode === 'production';
  const config = {
    entry: './src/index.tsx',
    output: {
      publicPath: isReleaseMode ? '/static/' : '/',
    },
    devServer: {
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
        },
      },
    },
    module: {
      rules: [
        // js, jsx, ts, tsx
        {
          test: /\.[jt]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
        // html
        {
          test: /\.html$/,
          use: {
            loader: 'html-loader',
          },
        },
        // css
        {
          test: /\.s?css$/,
          use: [
            isReleaseMode ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader',
            'sass-loader',
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx']
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/html/index.html',
        // this uses the path related to output directory, not source directory
        filename: 'index.html',
      }),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: '[name].css',
        chunkFilename: isReleaseMode ? '[id].[hash].css' : '[id].css',
      }),
      new CdnWebpackPlugin(),
    ],
    devtool: isReleaseMode ? 'source-map' : 'inline-source-map',
    optimization: {
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            ecma: 6,
          },
          sourceMap: true,
        }),
        new OptimizeCSSAssetsPlugin({}),
      ],
    },
  };

  return config;
}
