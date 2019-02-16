import { TrackInfo } from './../common/track';
import {sequelize, Tracks} from './database'
import * as fs from 'fs';
import * as mm from 'music-metadata';
import * as readdir from 'recursive-readdir'
import * as util from 'util'
import { IAudioMetadata } from 'music-metadata/lib/type';
import { getConfig, getUrlFromPath } from './config';
const windows1251 = require('windows-1251');

const fs_writeFile = util.promisify(fs.writeFile)
const fs_readFile = util.promisify(fs.readFile)

const RE_MP3 = /.mp3$/i;

function isMp3(path: string) {
    return RE_MP3.test(path);
}

export async function importTracks(file: string) {
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
   
    await Tracks.bulkCreate(await readTracksJson(file));
    console.log("Filled db");
}

export function sanitizeTrackInfo(ti: TrackInfo) {
    // remove null character as it is not handled correctly by sequelize
    for (const key in ti) {
        let val = ti[key];
        if (val && typeof(val) === 'string') {
            ti[key] = val.replace(/\u0000/g, '');
        }
    }
    return ti;
}

export async function readTracksJson(file): Promise<TrackInfo[]> {
    // TODO: proper promise
    let tracks = JSON.parse((await fs_readFile(file, 'utf8')) as any) as TrackInfo[];
    tracks.forEach(sanitizeTrackInfo);
    return Promise.resolve(tracks);
}

export async function initializeDatabase() {
    await Tracks.sync();
    const count = await Tracks.count();
    console.log(`Tracks loaded: ${count}`);
    if (count === 0) {
        importTracks("data/tracks.json");
    }
}

export function mmToTrack(path: string, meta: IAudioMetadata): TrackInfo {
    return {
        artist: meta.common.artist,
        title: meta.common.title,
        duration: meta.format.duration,
        meta: meta,
        path: path,
    }
}

export async function importDirs(paths: string[]) {
    let trackSet = new Set();
    (await Tracks.all()).forEach(t => trackSet.add(t.path));

    for (const path of paths)  {
        console.log(`importing ${path}`)
        const files = (await readdir(path)).filter(isMp3);
        console.log(path, files.length);
        const media_data = [];
        for (const file of files) {

            if (trackSet.has(file)) {
                console.log(`Skipping ${file}`)
                continue;
            } else {
                console.log(`Adding ${file}`)
            }

            const meta = await mm.parseFile(file);
            console.log(`${meta.common.artist} - ${meta.common.title}`);
            media_data.push(mmToTrack(file, meta));
        }
        //await fs_writeFile("data/mm.json", JSON.stringify(media_data), 'utf8');
        await Tracks.bulkCreate(media_data);
    }
}

export let isScanningFlag = false;

export async function rescanLibrary() {
    try {
        if (isScanningFlag) {
            return;
        }
        isScanningFlag = true;
        await Tracks.sync();
        await importDirs(getConfig().media_library);
    } finally {
        isScanningFlag = false;
    }
}

const RE_BAD_UNICODE=/[\u007E-\u00ff]/

export function fixStrEncoding(str: string): string {
    if (RE_BAD_UNICODE.test(str)) {
        return windows1251.decode(str);
    } else {
        return str;
    }
}

export function trackInfoFromDb(dbTrackInfo: TrackInfo): TrackInfo {
    const {id, artist, title, duration, rating} = dbTrackInfo;
    return {
        id, duration, rating,
        artist: fixStrEncoding(artist),
        title: fixStrEncoding(title),
        url: getUrlFromPath(dbTrackInfo.path)
    };
}

export function trackDumpFromDb(dbTrackInfo: TrackInfo): TrackInfo {
    let res = trackInfoFromDb(dbTrackInfo);
    const extras: (keyof TrackInfo)[] = [
        'playStart', 'playSkip', 'playEnd', 'lastPlayed', 'deleted'
    ];
    extras.forEach( e => res[e] = dbTrackInfo[e] );
    return res;
}

