// TODO: replace with pure websocket rpc
import * as io from 'socket.io-client';
import { resolve } from 'url';
import { ApiCalls } from '../common/api_calls';

const api = io('/');

api.on('hello', function (data: any) {
    console.log(data);
    api.emit('my other event', { my: 'data' });
  });

export async function getTracks() {
    return new Promise((resolve, reject) => {
        api.emit(ApiCalls.listTracks, null, (data: any) => {
            resolve(data);
        });
    });
}
