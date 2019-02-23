import { playerConn } from '../api';
import { LocalStorage } from "../local_storage";
import { thePlayerStore, Mode } from '../appstore';
import { runInAction, autorun } from 'mobx';

export function initPlayer() {
    thePlayerStore.filterString = LocalStorage.getString("filterString", "");

    playerConn.listTracks().then((tracks) => {
        console.log(tracks);
        runInAction(() => {
            thePlayerStore.tracks = tracks;
            thePlayerStore.displayedTracks = null;
        });
    });
}
