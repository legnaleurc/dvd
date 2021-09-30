import path from 'path';
import process from 'process';

import { Configuration } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import ReactRefreshTypeScript from 'react-refresh-typescript';

import CdnWebpackPlugin from './tools/cdn_webpack_plugin';


interface CliConfigOptions {
    config?: string;
    mode?: Configuration["mode"];
    env?: string;
    'config-register'?: string;
    configRegister?: string;
    'config-name'?: string;
    configName?: string;
}


type ConfigurationFactory = ((
    env: string | Record<string, boolean | number | string> | undefined,
    args: CliConfigOptions,
) => Configuration | Promise<Configuration>);


const factory: ConfigurationFactory = (env, argv) => {
  const backendHost = process.env.BACKEND_HOST;
  const backendPort = process.env.BACKEND_PORT;
  const isReleaseMode = process.env.NODE_ENV === 'production';

  const config: Configuration = {
    entry: './src/index.tsx',
    output: {
      filename: isReleaseMode ? '[name].[contenthash].js' : '[name].js',
      publicPath: isReleaseMode ? '/static/' : '/',
    },
    devServer: {
      proxy: {
        '/api': {
          target: `http://${backendHost}:${backendPort}`,
        },
      },
    },
    module: {
      rules: [
        // ts, tsx
        {
          test: /\.tsx?$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'babel-loader',
            },
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                getCustomTransformers () {
                  return {
                    before: isReleaseMode ? [] : [ReactRefreshTypeScript()],
                  };
                },
              },
            },
          ],
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
          test: /\.css$/,
          use: [
            isReleaseMode ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
      ],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
      extensions: ['.js', '.ts', '.tsx'],
    },
    plugins: [
      new HtmlWebpackPlugin(),
      new MiniCssExtractPlugin({
        // Options similar to the same options in webpackOptions.output
        // both options are optional
        filename: isReleaseMode ? '[name].[contenthash].css' : '[name].css',
      }),
      new CdnWebpackPlugin(),
    ],
    devtool: isReleaseMode ? undefined : 'inline-source-map',
    optimization: {
      minimizer: [
        new TerserPlugin({
          parallel: true,
          terserOptions: {
            ecma: 2020,
          },
        }),
        new CssMinimizerPlugin(),
      ],
      runtimeChunk: {
        name: 'manifest',
      },
    },
  };

  if (config.plugins && !isReleaseMode) {
    config.plugins.push(new ForkTsCheckerWebpackPlugin({
      typescript: {
        diagnosticOptions: {
          semantic: true,
          syntactic: true,
        },
      },
    }));
    config.plugins.push(new ReactRefreshWebpackPlugin());
  }

  return config;
}


export default factory;
