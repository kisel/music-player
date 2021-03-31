import path = require('path')

// TODO: move to external cfg file or env vars
interface Config {
    media_library: string[];
}

const config: Config = {
    media_library: [
        '/data/media/music'
    ]
}

export const medialib_prefix = '/media/';

export function getConfig() {
    return config;
}

export function getUrlFromPath(filepath: string) {
    return path.join(medialib_prefix, filepath)
}

