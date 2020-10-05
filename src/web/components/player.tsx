import * as React from 'react'

import { TrackJournalEvtType } from "../../common/api_calls";
import { playerConn, clientAPI } from "../api";
import { shuffle } from "../utils";
import {TrackInfo} from '../../common/track'
import debounce = require('lodash/debounce');
import throttle = require('lodash/throttle');
import _ = require('lodash');
import {LocalStorage} from "../local_storage";
import { List, AutoSizer } from 'react-virtualized'
//const { Column, Table, List } = require('react-virtualized')
import * as classnames from 'classnames';
import { dumbAttribFilter } from "../../utils/filters";
import { Slider } from './slider';
import { PlayerOptions } from './options';
import { PlayerCtx, Mode, PlayerStore } from '../appstore';
import { formatDuration, getTrackLineName } from './format';
import { trash_svg, Icon, play_svg, pause_svg, prev_svg, next_svg, random_svg, bolt_svg, child_svg, bullhorn_svg, wifi_svg } from '../icons';
import { Observer, observer } from 'mobx-react-lite';
import { Playlist } from './playlist';
import { PlayControls } from './play_controls';
import { runInAction } from 'mobx';
import { initPlayer } from './startup';
import { Rating } from './rating';
import { PlayerController, PlayerControllerCtx } from './player_controller';
import { TrackDelete } from './track_delete';


declare var navigator: any;
declare var MediaMetadata: any;
const THRESHOLD_SKIP = 30;

export interface PlayerProps {
    store: PlayerStore;
}

export const Player = observer(()=>{
    const store = React.useContext(PlayerCtx);
    return <PlayerImpl store={store}/>
})

export const NowPlay = observer(()=>{
    const store = React.useContext(PlayerCtx);
    const ctrl = React.useContext(PlayerControllerCtx);
    const {currentTrack: trackInfo} = store;
    return (
        <div className="nowPlay" onClick={()=>ctrl.scrollToCurrentTrack()}>
            {
                trackInfo
                    ? <span className="npTitle">{getTrackLineName(trackInfo)}</span>
                    : <span className="npTitle">-</span>
            }
            <div className="spacer"/>
            <div className="playnow-buttons">
            {trackInfo ? <TrackDelete trackId={trackInfo.id} /> : null}
            </div>
            {trackInfo ? <Rating trackInfo={trackInfo}/> : null}
        </div>
    );
});

export class PlayerImpl extends React.Component<PlayerProps, {}> {
    state: {};

    audio: HTMLAudioElement = null;
    sliderVol: Slider = null;
    sliderTrack: Slider = null;
    playlist: any = null;
    playTrackByIndex = ({idx, offset}: {idx?: number, offset?: number}) => {
        const tracks = this.props.store.displayedTracks || this.props.store.tracks;
        const audio = this.audio;
        if (!audio || !tracks || tracks.length == 0) {
            return;
        }

        // circular
        idx = idx || tracks.findIndex(t=>t.id == this.props.store.currentTrackId);
        if (idx == -1) {
            // no current track seen in the playlist - just picking 1st
            idx = 0;
            offset = 0;
        }
        idx = (idx + tracks.length + (offset || 0)) % tracks.length;
        const trackInfo = tracks[idx];
        if (!trackInfo) {
            return;
        }
        this.playTrackById(trackInfo.id);
    }

    playTrackById = (trackId: number) => {
        const {tracks} = this.props.store;
        const audio = this.audio;
        if (!audio || !tracks || tracks.length == 0) {
            return;
        }

        const trackInfo = this.getTrackById(trackId);

        if (this.getMode() == Mode.MASTER) {
            playerConn.playTracks({trackId, tracks: this.getVisibleTracklist().map(t=>t.id)});
            return;
        }
        if (audio.currentTime > THRESHOLD_SKIP ) {
            this.consumePromise(playerConn.trackJournal({id: this.getCurrentTrackId(), evt: TrackJournalEvtType.SKIP }));
        }
        audio.src = trackInfo.url;
        LocalStorage.setNumber('currentTrackId', trackInfo.id);

        runInAction(()=>{
            this.props.store.currentTrackId = trackInfo.id;
        });
        this.scrollToCurrentTrack();

        console.log("playing", trackInfo);
        audio.play();
        this.updateMediaSession();
    }

    trackIdToIndex = (id: number) => {
        const idx = this.props.store.tracks.findIndex(track=>track.id == id);
        return idx == -1 ? 0 : idx;
    }

    getTrackById = (id: number) => {
        return this.props.store.tracks.find(track=>track.id == id);
    }

    showTrackInfo = (id: number) => {
        playerConn.getTrackInfoDump({id}).then(info => {
            alert(JSON.stringify(info, undefined, 2));
        });
    }

    deleteTrack = (id: number) => {
        const track = this.getTrackById(id);
        if (!track) {
            return;
        }
        if (track.rating != 1) {
            this.showMessage("Set rating to 1 before removing!");
            return;
        }
        if (this.getCurrentTrackId() == id) {
            this.nextTrack();
        }
        this.consumePromise(playerConn.deleteTrack({id})) 
    }

    consumePromise(p: Promise<any>) {
        p.catch(() => console.log("Unhandled promise"))
    }

    getCurrentTrack = () => {
        return this.props.store.currentTrack;
    }

    getVisibleTracklist = () => {
        return this.props.store.displayedTracks || this.props.store.tracks;
    }

    getCurrentTrackId = () => {
        return this.props.store.currentTrackId;
    }

    nextTrack = () => {
        this.playTrackByIndex({offset: 1});
    }

    prevTrack = () => {
        this.playTrackByIndex({offset: -1}); // prev
    }

    onTrackSeek = (val: number) => {
        if (this.audio) {
            this.audio.currentTime = val;
        }
        if (this.getMode() == Mode.MASTER) {
            playerConn.seekTrackPos({position: val});
        }
    }

    setVolume = (val: number) => {
        if (this.audio) {
            this.audio.volume = val;
            LocalStorage.setNumber('volume', val);
        }
        if (this.getMode() == Mode.MASTER) {
            playerConn.setVolume({volume: val});
        }
        this.sendPlayingStatus();
    }
 
    onAudioPause = (evt: any) => {
        console.log('onPause');
        this.props.store.playing = false;
    }

    onAudioPlay = (evt: any) => {
        console.log('onPlay');
        playerConn.trackJournal({id: this.getCurrentTrackId(), evt: TrackJournalEvtType.PLAY })
        this.props.store.playing = true;
    }

    onAudioVolumeChange = (evt: any) => {
        if (this.sliderVol) {
            this.sliderVol.setState({val: this.audio.volume, max: 1});
        }
    }

    onAudioEnded = (evt: any) => {
        console.log('onEnded');
        playerConn.trackJournal({id: this.getCurrentTrackId(), evt: TrackJournalEvtType.END });
        this.nextTrack();
    }

    onAudioTimeUpdate = (evt: any) => {
        //console.log(evt);
        if (this.sliderTrack) {
            const {currentTime, duration} = this.audio;
            this.sliderTrack.setState({val: currentTime, max: duration});
        }
        this.sendPlayingStatus();
    }

    playPause = () => {
        if (this.props.store.playing) {
            this.pause();
        } else {
            this.play();
        }
    }

    pause = () => {
        if (this.getMode() == Mode.MASTER) {
            playerConn.pausePlay();
        } else {
            this.audio.pause();
        }
    }

    shuffleAll = () => {
        const {store} = this.props;
        store.tracks = shuffle(store.tracks);
        if (!this.props.store.playing) {
            this.playFirstVisibleTrack();
        } else {
            this.scrollToCurrentTrack()
        }
    }

    scrollToCurrentTrack = () => {
        const currentTrackId = this.getCurrentTrackId();
        this.scrollToTrackIndex(this.getVisibleTracklist().findIndex(t=>t.id == currentTrackId));
    }

    scrollToTrackIndex = (idx: number) => {
        if (this.playlist) {
            this.playlist.scrollToRow(idx);
        }
    }

    getMode = () => {
        return this.props.store.mode || Mode.STANDALONE;
    }

    updateMediaSession = () => {
        if (navigator && navigator.mediaSession) {
            const track = this.getCurrentTrack();
            if (track) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: track.title,
                    artist: track.artist,
                });
            }
        }

    }
    componentDidMount()  {
        if (navigator && navigator.mediaSession) {
            navigator.mediaSession.setActionHandler('previoustrack', () => this.prevTrack() );
            navigator.mediaSession.setActionHandler('nexttrack', () => this.nextTrack() );
        }
        initPlayer();
        this.initEvents();
    }

    initEvents() {
        const store = this.props.store;
        clientAPI.tracksUpdated = (modifTracks: TrackInfo[]) => {
            let newTracks = {}
            for (const track of modifTracks) {
                newTracks[track.id] = track;
            }
            const patch = (tracks) => tracks ? tracks.map(t => newTracks[t.id] || t): null;
            runInAction(()=>{
                store.tracks = patch(store.tracks);
                store.displayedTracks = patch(store.displayedTracks);
            })
        }

        clientAPI.tracksRemoved = (deletedTrackIds) => {
            const delSet = new Set(deletedTrackIds)
            const patch = (tracks) => tracks ? tracks.filter(t => !delSet.has(t.id) ): null;
            runInAction(()=>{
                store.tracks = patch(store.tracks);
                store.displayedTracks = patch(store.displayedTracks);
            })
        }

        clientAPI.playTracks = ({trackId, tracks, position}) => {
            if (this.getMode() == Mode.SLAVE) {
                const set_tracks = new Set(tracks);
                store.displayedTracks = store.tracks.filter(t=>set_tracks.has(t.id));
                this.playTrackById(trackId);
                if (this.audio && position) {
                    this.audio.currentTime = position;
                }
            }
        }
        clientAPI.setVolume = ({volume}) => {
            if (this.getMode() == Mode.SLAVE) {
                if (this.audio) {
                    this.audio.volume = volume;
                }
            }
        }

        clientAPI.pausePlay = () => {
            if (this.getMode() == Mode.SLAVE) {
                if (this.audio) {
                    this.audio.pause();
                }
            }
        }

        clientAPI.seekTrackPos = ({position}) => {
            if (this.getMode() == Mode.SLAVE) {
                if (this.audio) {
                    this.audio.currentTime = position;
                }
            }
        }

        clientAPI.reportStatus = ({trackId, position, volume, playing, duration}) => {
            if (this.getMode() == Mode.MASTER) {
                this.sliderTrack.setState({val: position, max: duration})
                this.sliderVol.setState({val: volume})
                runInAction(()=>{
                    store.currentTrackId = trackId;
                    store.playing = playing;
                })
            }
        }

    }

    _sendPlayingStatus = () => {
        if (this.getMode() != Mode.SLAVE) {
            return;
        }
        playerConn.reportStatus({
            trackId: this.props.store.currentTrackId,
            volume: this.audio ? this.audio.volume : null,
            position: this.audio ? this.audio.currentTime : null,
            duration: this.audio ? this.audio.duration : null,
            playing: this.props.store.playing
        })
    }

    sendPlayingStatus = throttle(this._sendPlayingStatus, 1000);

    playlistRef = (elem: any) => {
        this.playlist = elem;
    }

    audioRef = (audio: any) => {
        if (this.audio) {
            this.audio.pause();
        }
        this.audio = audio;
        if (this.audio) {
            this.audio.volume = LocalStorage.getNumber('volume', 1);
        }
    }

    sliderVolumeRef = (elem: any) => {
        this.sliderVol = elem;
        if (this.audio && this.audio.volume) {
            this.sliderVol.setState({val: this.audio.volume, max:1 })
        }
    }

    sliderTrackRef = (elem: any) => {
        this.sliderTrack = elem;
    }

    playFirstVisibleTrack = () => {
        const tracks = this.getVisibleTracklist()
        if (tracks && tracks[0]) {
            this.playTrackById(tracks[0].id);
        }
    }
        
    playlistFilterKeyDown = ({key}) => {
        if (key=='Enter') {
            this.playFirstVisibleTrack();
        }
    }

    filterTracks = (value: string) => {
        let newDisplayedTracks = null;
        const [dumb_search, js_eval_search, sortBy] = value.split('/');

        // multi-stage filtering. first dumb text filter, afterwards
        newDisplayedTracks = this.props.store.tracks; 

        if (dumb_search) {
            // allow searching by multiple attributes
            //const rex = buildFuzzySearch(value);
            //newDisplayedTracks = newDisplayedTracks.filter((track)=>matchInAttributes(track, ['artist', 'title', 'url'], rex));
            newDisplayedTracks = dumbAttribFilter(newDisplayedTracks, dumb_search, ['artist', 'title', 'url']);
        }
        if (js_eval_search) {
            try {
                // extremely safe operation
                const filter_func = eval(`
                        (track) => {
                            const {artist, title, rating} = track;
                            const r = rating;
                            return (eval('${js_eval_search}'));
                        }
                    `)
                newDisplayedTracks = newDisplayedTracks.filter(filter_func);
            } catch(e) {
                console.log('invalid search expr', e);
            }
        }

        if (sortBy) {
            try {
                newDisplayedTracks = _.sortBy(newDisplayedTracks, sortBy);
            } catch(e) {
                console.log('invalid search expr', e);
            }
        }

        runInAction(()=>{this.props.store.displayedTracks = newDisplayedTracks});
    }

    playlistFilterChange = ({target: {value}}: any) => {
        LocalStorage.setString("filterString", value);
        runInAction(()=>{this.props.store.filterString = value; })
        this.filterTracks(value);
    }
    //playlistFilterChange = debounce(this._playlistFilterChange, 500);

    onPlayerKey = (evt) => {
        console.log(evt.code, evt.key, evt);
        const {key, altKey} = evt;
        if (!altKey) {
            return;
        }
        if (key == 'p') {
            this.playPause();
        }
        if (key == 'n') {
            this.nextTrack();
        }
        if (key == 'b') {
            this.prevTrack();
        }
        for (let idx = 1; idx<=5; ++idx) {
            if (key == `${idx}`) {
                const {currentTrackId} = this.props.store;
                if (currentTrackId) {
                    playerConn.setTrackRating({id: currentTrackId, rating: idx});
                }
            }
        }
    }

    showMessage = (msg: string) => {
        alert(msg);
    }

    play = () => {
        const audio = this.audio;
        if (audio && audio.src) {
            audio.play();
        } else {
            const trackId = this.getCurrentTrackId();
            if (trackId) {
                this.playTrackById(trackId);
            } else {
                this.nextTrack();
            }
        }
    }

    render() {
        const player = this;
        const playerCtrl: PlayerController = {
            playTrackById: this.playTrackById,
            showTrackInfo: this.showTrackInfo,
            deleteTrack: this.deleteTrack,
            nextTrack: this.nextTrack,
            prevTrack: this.prevTrack,
            shuffleAll: this.shuffleAll,
            scrollToCurrentTrack: this.scrollToCurrentTrack,
            play: this.play,
            pause: this.pause,
            showOptions: () => {this.props.store.optionsOpened = true},
            setVolume: this.setVolume,
        }
        return (
        <PlayerControllerCtx.Provider value={playerCtrl}>
        <div onKeyDown={this.onPlayerKey} className="player">
                <Observer>
                    {
                        () => {
                            const store = React.useContext(PlayerCtx);
                            return store.optionsOpened
                                ? <PlayerOptions/>
                                : <Playlist 
                                    playlistRef={this.playlistRef}
                                    playerCtrl={playerCtrl}
                                />
                        }
                    }
                </Observer>
                <div className="player-footer">
                    <NowPlay/>
                    <div>
                        <Slider ref={this.sliderTrackRef} onValue={this.onTrackSeek}/>
                    </div>

                    <div className="audio0">
                        <audio ref={this.audioRef} preload="metadata" id="audio1" controls={true} 
                            onPlay={this.onAudioPlay}
                            onPause={this.onAudioPause}
                            onVolumeChange={this.onAudioVolumeChange}
                            onTimeUpdate={this.onAudioTimeUpdate}
                            onEnded={this.onAudioEnded}
                        >
                            Your browser does not support HTML5 Audio!
                        </audio>
                    </div>
                    <PlayControls
                        sliderVolumeRef={this.sliderVolumeRef}
                        playlistFilterChange={this.playlistFilterChange}
                        playlistFilterKeyDown={this.playlistFilterKeyDown}
                        playerCtrl={playerCtrl}
                     />
                </div>
        </div>
        </PlayerControllerCtx.Provider>
        );
    }
}
