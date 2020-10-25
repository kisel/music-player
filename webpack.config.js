const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const devMode = process.env.NODE_ENV !== 'production' // TODO: proper mode check

const frontend = {
  entry: {
      app: ['./src/web/main.tsx'],
  },
  output: {
    path: path.resolve(__dirname, './public'),
    publicPath: '/',
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          devMode ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          //'postcss-loader',
          'sass-loader',
        ],
      },
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
        }
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'file-loader',
        options: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".jsx"],

    alias: {
    }
  },
  performance: {
    hints: false
  },

  mode: devMode ? 'development' : 'production',
  devtool: 'source-map',

  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all"
        }
      }
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/web/index.html',
      favicon: 'assets/favicon.png',
    }),
  ]
}

if (!devMode) {
  frontend.plugins.push(
    new webpack.LoaderOptionsPlugin({
      minimize: true
    }),
    new MiniCssExtractPlugin({
      // Options similar to the same options in webpackOptions.output
      // both options are optional
      filename: "[name].css",
      chunkFilename: "[id].css"
    })
  );
}

function skipProdNodeModules() {
     let res = JSON.parse(require('fs').readFileSync('package.json')).dependencies;
     Object.keys(res).map(k => {
         res[k] = `commonjs2 ${k}`
     });
     return res;
}

const backend = {
     entry: [
         './src/server/server.ts'
     ],
     output: {
        filename: 'app/server.js'
     },
     module: {
         rules: [
             {
                 test: /\.ts$/,
                 loader: 'ts-loader',
                 exclude: /node_modules/,
             },
         ]
     },
     resolve: {
         extensions: [".js", ".ts"],
     },

     target: 'node',
     externals: skipProdNodeModules()
};


module.exports = [
  frontend,
  backend,
]

