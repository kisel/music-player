
var express = require('express');
import * as socketio from 'socket.io';
import { ApiEvents, PlayerAPI, TrackJournalEvtType, SearchExpression, ClientAPI } from '../common/api_calls';
import { Tracks, SearchHistory } from './database';
import { initializeDatabase, trackInfoFromDb, trackDumpFromDb } from './find_tracks';
import { TrackInfo } from '../common/track';
import * as Sequelize from 'sequelize';

const app = express();
const port = parseInt(process.env.PORT || '5555');

app.use(express.static('public'));

const server = require('http').Server(app);
export const io = socketio(server);

server.listen(port);
console.log(`listening on port ${port}`);

initializeDatabase();

async function getTracks(filter={}) {
    return await Tracks.findAll({
        where: { deleted: null, ...filter },
        attributes: ['id', 'artist', 'title', 'rating', 'path', 'duration']
    }).then( tracks => tracks.map(trackInfoFromDb));
}

const api_handlers: PlayerAPI = {

    listTracks: async () => {
        return await getTracks();
    },

    trackJournal: async ({id, evt}) => {
        const track_upd = (key: keyof TrackInfo, extraChanges = {}) => {
            return Tracks.update( {
                [key]: Sequelize.literal(`${key} + 1`), ...extraChanges
                }, { where: {id} }
            );
        };

        if (evt == TrackJournalEvtType.PLAY) {
            await track_upd('playStart');
        }
        if (evt == TrackJournalEvtType.SKIP) {
            await track_upd('playSkip');
        }
        if (evt == TrackJournalEvtType.END) {
            await track_upd('playEnd', {
                lastPlayed: new Date(),
            });
        }
    },

    setTrackRating: async ({id, rating}) => {
        await Tracks.update({rating: rating}, { where: {id: id}});
        clients.tracksUpdated(await getTracks({id: id}));
    },

    getTrackInfoDump: async ({id}) => {
        return trackDumpFromDb(await Tracks.findById(id));
    },

    deleteTrack: async ({id}) => {
        await Tracks.update({deleted: new Date()}, { where: {id: id}});
        clients.tracksRemoved([id]);
    },

    getSearchHistory: async ({id}) => {
        return await SearchHistory.all({ limit: 20});
    },

    addSearchHistory: async (req: SearchExpression) => {
        await SearchHistory.create(req);
    },

}

io.on('connection', function (socket) {
    socket.emit(ApiEvents.HELLO, { hello: '' });

    for (const key in api_handlers) {
        const handler = api_handlers[key];
        socket.on(key, function (request_data, respond) {
            try {
                handler(request_data).then(respond)
            } catch(e) {
                respond({error: 'Internal error'})
            }
        });
    };

});

export const clients: ClientAPI = new Proxy({} as any, {
        get: function(target, name){
            return name in target?
                target[name] :
                (req) => {
                    io.sockets.emit(name as string, req);
                }
        }
    }
);

