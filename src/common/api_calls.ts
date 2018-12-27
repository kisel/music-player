import { TrackInfo } from './track';

export const enum ApiEvents {
    trackUpdated = 'TRACK_UPDATED',
}

export const enum TrackJournalEvtType {
    PLAY = 'PLAY', // play started, sent after playing for some time (~10sec)
    SKIP = 'SKIP', // switched to another track, while previous is playing
    END = 'END', // listen to the end
}

export interface TrackJournalEvt {
    id: string; // track id
    evt: TrackJournalEvtType;
}


export interface PlayerAPI {
    listTracks(): Promise<TrackInfo[]>;
    trackJournal(req: {id: number, evt: TrackJournalEvtType});
    setTrackRating(req: {id: number, rating: number});

    getTrackInfoDump(req: {id: number});
    deleteTrack(req: {id: number});
}

