import React = require("react");
import {observable, computed} from 'mobx';
import { TrackInfo } from "../common/track";

export enum Mode {
    STANDALONE='STANDALONE',
    SLAVE='SLAVE',
    MASTER='MASTER',
}

export const PlayerCtx = React.createContext(null as PlayerStore);
export class PlayerStore {
    @observable optionsOpened = false;
    @observable tracks: TrackInfo[] = [];
    @observable displayedTracks: TrackInfo[] = null; // only set if there is a search, null otherwise
    @observable currentTrackId: number = null;
    @observable mode: Mode = Mode.STANDALONE;
    @observable playing: boolean = false;
    @observable filterString = '';

    @computed get currentTrack() {
        const {currentTrackId} = this;
        return this.tracks.find(t=>t.id == currentTrackId);
    }
}

export const thePlayerStore = new PlayerStore();
