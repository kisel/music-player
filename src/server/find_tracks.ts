import {sequelize, Tracks} from './database'
import * as fs from 'fs';
import { TrackInfo } from '../common/track';

async function indexTracks() {
    await Tracks.sync();
    /*
    for (let track of readTracksJson()) {
        console.log(track);
        await Tracks.create(track);
    }
    */
    //return Tracks.bulkCreate(readTracksJson());
    /*
    sequelize.transaction().then(async (t) => {

    for (let track in readTracksJson()) {
        try {
            await Tracks.create(track, {transaction: t});
        } catch(e) {
            console.log(e);
        }
    }
    });
    */
   
    await Tracks.bulkCreate(readTracksJson());
    console.log("Filled db");
}

function readTracksJson(): TrackInfo[] {
    return JSON.parse(fs.readFileSync('data/tracks.json', 'utf8'));
}

export function initializeDatabase() {
    Tracks.sync().then(() => {
        Tracks.count().then((v) => {
            console.log(`Tracks loaded: ${v}`);
            if (1 || v === 0) {
                indexTracks();
            }
        })
    });
}