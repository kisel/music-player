// TODO: replace with pure websocket rpc
import * as io from 'socket.io-client';
import { resolve } from 'url';
import { ApiEvents, PlayerAPI, TrackJournalEvtType, ClientAPI} from '../common/api_calls';
import { TrackInfo } from '../common/track';

const api = io('/', {
    // transports: ['websocket']
});


function callRPC<T>(rpc: string, arg: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
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
    tracksUpdated: async(modifTracks) => {},
    tracksRemoved: async(deletedTrackIds: number[]) => {},
}

// playerEvents references can change
for (const key in clientAPI) {
    api.on(key, (data) => {
        clientAPI[key](data);
        console.log('received event: ' + key, data)
    });
}

