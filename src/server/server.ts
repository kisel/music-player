
var express = require('express');
import * as socketio from 'socket.io';
import { ApiCalls } from '../common/api_calls';
import { Tracks } from './database';
import { initializeDatabase, trackInfoFromDb } from './find_tracks';
import { TrackInfo } from '../common/track';

const app = express();
const port = parseInt(process.env.PORT || '5555');

app.use(express.static('public'));

var server = require('http').Server(app);
var io = socketio(server);

server.listen(port);
console.log(`listening on port ${port}`);

initializeDatabase();

io.on('connection', function (socket) {
    socket.emit('hello', { hello: 'some data' });

  socket.on(ApiCalls.listTracks, function (filters, respond) {
    Tracks.all({
      attributes: ['id', 'artist', 'title', 'rating', 'path', 'duration']
    }).then(tracks => tracks.map(trackInfoFromDb)).then(respond);
  });

  socket.on(ApiCalls.getTrackDetails, function ({id}: {id: number}, respond) {
    Tracks.find({ where: {id: id}}).then(track=>{
      respond({url: '/media/' + track.path});
    });
  });

  socket.on(ApiCalls.setTrackRating, function ({id, rating}: Partial<TrackInfo>, respond) {
    Tracks.update({rating: rating}, { where: {id: id}}).then(track=>{
      respond({ok: true});
    });
  });

});
