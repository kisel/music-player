var webpack = require("webpack");
var WebpackDevServer = require("webpack-dev-server");
var _ = require('lodash')
var path = require('path')

var backend_port = parseInt(process.env.PORT || '5555');
var webpack_port = parseInt(process.env.WEBPACK_PORT || '8080');

var backend_ws_url = 'ws://localhost:' + backend_port + '/';
var backend_http_url = 'http://localhost:' + backend_port;

var config = require("../webpack.config.js");

var frontEndEntry = config[0];
var entry = frontEndEntry.entry;

entry.app = entry.app.map(entry => entry.replace("main.tsx", "main_dev.tsx"));
entry.webpack_client =  "webpack-dev-server/client?/"
entry.webpack_hot = "webpack/hot/dev-server";
//entry.react_hot = "react-hot-loader/patch";

frontEndEntry.plugins.push(new webpack.HotModuleReplacementPlugin());
frontEndEntry.plugins.push(new webpack.NamedModulesPlugin());

// enable CSS source maps for dev server
// see note in a main config file
(frontEndEntry.module.rules || []).forEach(rule => {
    (rule.use || []).forEach(use => {
        if (use.loader in ['sass-loader', 'css-loader']) {
            use.options = use.options || {};
            use.options.sourceMap = true;
        }
    });
});

var compiler = webpack(config);

console.log("Loading WebpackDevServer");

var server = new WebpackDevServer(compiler, {
  // Enable special support for Hot Module Replacement(see 'inline' commend above)
  hot: false, // should be false as we're adding HotModuleReplacementPlugin manually

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

  disableHostCheck: true,
  watchOptions: {
    aggregateTimeout: 300,
    poll: 1000
  },

  stats: { colors: true }
});

server.listen(webpack_port, function() {
    console.log("Available entry routes:");
    console.log("/");
    console.log("/webpack-dev-server/");
});

