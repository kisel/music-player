import { TrackInfo } from './track';

export const enum ApiEvents {
    HELLO = 'HELLO',
    TRACK_UPDATED = 'TRACK_UPDATED',
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

export interface SearchExpression {
    expression?: string;
}

export interface PlayerData {
    trackId?: number;
    position?: number; // track position
    duration?: number; // track duration
    tracks?: number[]; // loaded tracks
    volume?: number;
    playing?: boolean;
}

export interface PlayerAPI {
    listTracks(): Promise<TrackInfo[]>;
    trackJournal(req: {id: number, evt: TrackJournalEvtType});
    setTrackRating(req: {id: number, rating: number});

    getTrackInfoDump(req: {id: number});
    deleteTrack(req: {id: number});

    rescanLibrary(req: any);

    getSearchHistory(req: any): Promise<SearchExpression[]>;
    addSearchHistory(req: SearchExpression);

    // master functions
    playTracks(req: PlayerData);
    pausePlay();
    setVolume(req: {volume: number});
    seekTrackPos(req: {position: number});

    //
    reportStatus(req: PlayerData);
}

export interface ClientAPI {
    hello();
    tracksUpdated(modifTracks: TrackInfo[]);
    tracksRemoved(deletedTrackIds: number[]);

    // slave functions
    playTracks(req: PlayerData);
    pausePlay();
    setVolume(req: {volume: number});
    seekTrackPos(req: {position: number});

    //
    reportStatus(req: PlayerData);
}

