/* eslint-disable @typescript-eslint/explicit-function-return-type */

import CopyWebpackPlugin from "copy-webpack-plugin";
import HtmlWebpackPlugin from "html-webpack-plugin";
import * as path from "path";
import TerserPlugin from "terser-webpack-plugin";
import {
  DefinePlugin,
  HotModuleReplacementPlugin,
  Configuration
} from "webpack";
import merge from "webpack-merge";
import WorkboxWebpackPlugin from "workbox-webpack-plugin";

if (process.env.NODE_ENV === undefined) {
  process.env.NODE_ENV = "development";
}

const isEnvProduction = process.env.NODE_ENV === "production";

const development: Configuration = {
  devtool: "cheap-module-source-map",
  mode: "development",
  plugins: [new HotModuleReplacementPlugin()]
};

const production: Configuration = {
  bail: true,
  devtool: undefined,
  mode: "production",
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            ecma: 8
          },
          compress: {
            warnings: false,
            comparisons: false,
            inline: 2
          },
          mangle: {
            safari10: true
          },
          // eslint-disable-next-line @typescript-eslint/camelcase
          keep_classnames: false,
          // eslint-disable-next-line @typescript-eslint/camelcase
          keep_fnames: false,
          output: {
            ecma: 5,
            comments: false,
            // eslint-disable-next-line @typescript-eslint/camelcase
            ascii_only: true
          }
        }
      })
    ]
  },
  plugins: [
    new WorkboxWebpackPlugin.GenerateSW({
      clientsClaim: true,
      exclude: [/\.map$/],
      importWorkboxFrom: "cdn",
      navigateFallback: "/index.html",
      navigateFallbackBlacklist: [
        new RegExp("^/_"),
        new RegExp("/[^/?]+\\.[^/]+$")
      ]
    })
  ]
};

export default merge(
  {
    entry: path.resolve(__dirname, "src/index.tsx"),
    module: {
      strictExportPresence: true,
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader"
        },
        {
          test: [/\.jpe?g$/, /\.png$/],
          loader: "file-loader",
          options: {
            name: "[name].[hash:8].[ext]"
          }
        },
        {
          test: /\.svg$/,
          use: [
            "@svgr/webpack",
            {
              loader: "file-loader",
              options: {
                name: "[name].[hash:8].[ext]"
              }
            }
          ]
        }
      ]
    },
    output: {
      path: path.resolve(__dirname, "build"),
      pathinfo: !isEnvProduction,
      filename: isEnvProduction ? "[name].[contenthash:8].js" : "bundle.js",
      futureEmitAssets: true,
      devtoolModuleFilenameTemplate: isEnvProduction
        ? undefined
        : info => path.resolve(info.absoluteResourcePath).replace(/\\/g, "/")
    },
    plugins: [
      new CopyWebpackPlugin([
        {
          context: "public/",
          from: { glob: "**/*" },
          ignore: ["index.html"]
        }
      ]),
      new HtmlWebpackPlugin(
        Object.assign(
          {},
          {
            inject: true,
            template: path.resolve(__dirname, "public/index.html")
          },
          isEnvProduction
            ? {
                minify: {
                  removeComments: true,
                  collapseWhitespace: true,
                  keepClosingSlash: true
                }
              }
            : undefined
        )
      ),
      new DefinePlugin({
        "process.env": JSON.stringify({
          NODE_ENV: process.env.NODE_ENV || "development"
        })
      })
    ],
    resolve: {
      modules: ["node_modules"],
      extensions: [".tsx", ".ts", ".jsx", ".js", ".json"]
    }
  },
  isEnvProduction ? production : development
);

/* eslint-enable @typescript-eslint/explicit-function-return-type */
