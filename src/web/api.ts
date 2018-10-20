// TODO: replace with pure websocket rpc
import * as io from 'socket.io-client';
import { resolve } from 'url';
import { ApiCalls } from '../common/api_calls';
import { TrackInfo } from '../common/track';

const api = io('/');

api.on('hello', function (data: any) {
    console.log(data);
    api.emit('my other event', { my: 'data' });
  });


function callRPC<T>(rpc: ApiCalls, arg: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        api.emit(rpc, arg, (data: any) => {
            resolve(data);
        });
    });
}

export async function getTracks() {
    return callRPC<TrackInfo[]>(ApiCalls.listTracks, null);
}

export async function setTrackRating(track: Partial<TrackInfo>) {
    return callRPC<TrackInfo>(ApiCalls.setTrackRating, track);
}
