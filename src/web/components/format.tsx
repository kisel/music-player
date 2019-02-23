import { TrackInfo } from '../../common/track';

export function getTrackFilename(trackInfo: TrackInfo) {
    const pattern = trackInfo.url;
    if (!pattern) {
        return "";
    }
    return pattern.replace(/.*[\\\/]/, '').replace(/.mp3$/i, '');
}

export function formatDuration(duration: number) {
    const sec = Math.floor(duration);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (s < 10) {
        return `${m}:0${s}`;
    }
    else {
        return `${m}:${s}`;
    }
}

export function getTrackTitle(trackInfo: TrackInfo) {
    const { artist, title, duration, id } = trackInfo;
    return title || getTrackFilename(trackInfo);
}

export function getTrackLineName(trackInfo: TrackInfo) {
    const { artist, title, duration, id } = trackInfo;
    if (artist && title) {
        return `${artist} - ${title}`
    } else {
        return getTrackFilename(trackInfo);
    }
}
