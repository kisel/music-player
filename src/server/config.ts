// TODO: move to external cfg file or env vars
interface Config {
    media_library: string[];
}

const config: Config = {
    media_library: [
        '/data/media/music'
    ]
}

export function getConfig() {
    return config;
}

export function getUrlFromPath(path: string) {
    return path.replace('/data/media/', '/media/');
}
