var webpack = require("webpack");
var WebpackDevServer = require("webpack-dev-server");
var _ = require('lodash')

var backend_port = parseInt(process.env.PORT || '5555');
var webpack_port = parseInt(process.env.WEBPACK_PORT || '8080');

var backend_ws_url = 'ws://localhost:' + backend_port + '/';
var backend_http_url = 'http://localhost:' + backend_port;

var config = require("../webpack.config.js");

console.log("Connecting front-end to " + backend_http_url);

// enable inline mode. see https://webpack.github.io/docs/webpack-dev-server.html#inline-mode-with-node-js-api
var frontEndEntry = config[0];
var entry = frontEndEntry.entry;

entry['webpack_client'] =  "webpack-dev-server/client?http://localhost:" + webpack_port + "/";
entry['webpack_hot'] = "webpack/hot/dev-server";
//entry['react_hot'] = "react-hot-loader/patch";

frontEndEntry.plugins.push(new webpack.HotModuleReplacementPlugin());
frontEndEntry.plugins.push(new webpack.NamedModulesPlugin());

// enable CSS source maps for dev server
// see note in a main config file
(frontEndEntry.module.rules || []).forEach(rule => {
    (rule.use || []).forEach(use => {
        if (use.loader in ['css-loader', 'style-loader']) {
            use.options = use.options || {};
            use.options.sourceMap = true;
        }
    });
});

var compiler = webpack(config);

console.log("Loading WebpackDevServer");

var server = new WebpackDevServer(compiler, {
  contentBase: "/public",

  // Enable special support for Hot Module Replacement(see 'inline' commend above)
  hot: true,

  // access dev server from arbitrary url for html5 router
  historyApiFallback: true,

  // Set this if you want to enable gzip compression for assets
  compress: false,

  // route /api calls to the API server (see https://github.com/webpack/webpack-dev-server/pull/127 )
  proxy: {
    "/socket.io/**": {
        target: backend_ws_url,
        changeOrigin: true,
        ws: true
    },
     "/api/**": backend_http_url,
     "/favicon.ico": backend_http_url
  },

  // pass [static options](http://expressjs.com/en/4x/api.html#express.static) to inner express server
  staticOptions: {
  },

  clientLogLevel: "info",
  // Control the console log messages shown in the browser when using inline mode. Can be `error`, `warning`, `info` or `none`.

  // webpack-dev-middleware options
  quiet: false,
  noInfo: false,
  lazy: false,
  filename: "bundle.js",
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  },
  //publicPath: "/",
  headers: { "X-Custom-Header": "yes" },
  stats: { colors: true }
});

var base_url = "http://localhost:" + webpack_port;

server.listen(webpack_port, function() {
    console.log("Available entry routes:");
    console.log(base_url + "/");
    console.log(base_url + "/webpack-dev-server/");
});

