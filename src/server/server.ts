
var express = require('express');
import * as socketio from 'socket.io';
import { ApiCalls } from '../common/api_calls';
import { Tracks } from './database';
import { initializeDatabase } from './find_tracks';

const app = express();
const port = 5555;

app.use(express.static('public'));

var server = require('http').Server(app);
var io = socketio(server);

server.listen(port);
console.log(`listening on port ${port}`);

initializeDatabase();

io.on('connection', function (socket) {
    socket.emit('hello', { hello: 'some data' });

  socket.on(ApiCalls.listTracks, function (filters, fn) {
    Tracks.all().then(fn);
  });
});
