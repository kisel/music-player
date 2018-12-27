
export interface TrackInfo {
    id?: number;
    index?: number;
    trackNumber?: number;
    name?: string;
    duration?: number;
    title?: string;
    artist?: string;
    url?: string;
    path?: string;
    rating?: number;
    meta?: any;
    playStart?: number; // count of started plays
    playSkip?: number;  // count of skipped plays
    playEnd?: number;   // played till the end
    lastPlayed?: any; // date
    deleted?: any; // date when track was marked as deleted
}

