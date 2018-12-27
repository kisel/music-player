// TODO: replace with pure websocket rpc
import * as io from 'socket.io-client';
import { resolve } from 'url';
import { PlayerAPI, TrackJournalEvtType} from '../common/api_calls';
import { TrackInfo } from '../common/track';

const api = io('/', {
    // transports: ['websocket']
});

api.on('hello', function (data: any) {
    console.log(data);
    api.emit('my other event', { my: 'data' });
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



