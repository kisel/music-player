import { io } from 'socket.io-client';
import { resolve } from 'url';
import { ApiEvents, PlayerAPI, TrackJournalEvtType, ClientAPI} from '../common/api_calls';
import { TrackInfo } from '../common/track';

const api = io('/', {
    // transports: ['websocket']
});


function callRPC<T>(rpc: string, arg: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        console.log('sending event ' + rpc, arg);
        api.emit(rpc, arg, (data: any) => {
            resolve(data);
        });
    });
}

export const playerConn = new Proxy({}, {
        get: function(target, name){
            return name in target?
                target[name] :
                (req) => callRPC(name.toString(), req);
        }
    }
) as PlayerAPI;

// dead simple event emitter
export const clientAPI: ClientAPI = {
    hello: async () => { console.log('Connected!'); },
    tracksUpdated: null,
    tracksRemoved: null,

    playTracks: null,
    pausePlay: null,
    setVolume: null,

    seekTrackPos: null,
    reportStatus: null,
}

// playerEvents references can change
for (const key in clientAPI) {
    api.on(key, (data) => {
        const handler = clientAPI[key] 
        if (handler) {
            handler(data);
        }
        console.log('received event: ' + key, data)
    });
}

