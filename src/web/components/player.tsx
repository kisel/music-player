import * as React from 'react'
import {Component} from 'react'

import { TrackJournalEvtType } from "../../common/api_calls";
import { playerConn, clientAPI } from "../api";
import { shuffle } from "../utils";
import {TrackInfo} from '../../common/track'
import debounce = require('lodash/debounce');
import throttle = require('lodash/throttle');
import {LocalStorage} from "../local_storage";
import { List, AutoSizer } from 'react-virtualized'
//const { Column, Table, List } = require('react-virtualized')
import * as classnames from 'classnames';
import { KeyboardEventHandler } from "react";
import { dumbAttribFilter } from "../../utils/filters";

const trash_svg = require("@fortawesome/fontawesome-free/svgs/solid/trash.svg")
const info_svg = require("@fortawesome/fontawesome-free/svgs/solid/info.svg")
const sync_svg = require("@fortawesome/fontawesome-free/svgs/solid/sync.svg")

const play_svg = require("@fortawesome/fontawesome-free/svgs/solid/play.svg")
const pause_svg = require("@fortawesome/fontawesome-free/svgs/solid/pause.svg")
const random_svg = require("@fortawesome/fontawesome-free/svgs/solid/random.svg")
const next_svg = require("@fortawesome/fontawesome-free/svgs/solid/step-forward.svg")
const prev_svg = require("@fortawesome/fontawesome-free/svgs/solid/step-backward.svg")
const bullhorn_svg = require("@fortawesome/fontawesome-free/svgs/solid/bullhorn.svg")
const wifi_svg = require("@fortawesome/fontawesome-free/svgs/solid/wifi.svg")
const child_svg = require("@fortawesome/fontawesome-free/svgs/solid/child.svg")

interface PlaylistProps {
    tracks: TrackInfo[];
    playTrack: (TrackInfo)=>void;
}

declare var navigator: any;
declare var MediaMetadata: any;
const THRESHOLD_SKIP = 30;

class Icon extends Component<any, any> {
    render() {
        return <img className="btn" {...this.props}/>
    }
}

enum Mode {
    STANDALONE='STANDALONE',
    SLAVE='SLAVE',
    MASTER='MASTER',
}


function getTrackFilename(trackInfo: TrackInfo) {
    const pattern = trackInfo.url;
    if (!pattern) {
        return "";
    }
    return pattern.replace(/.*[\\\/]/, '').replace(/.mp3$/i, '');
}

function formatDuration(duration: number) {
    const sec = Math.floor(duration);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (s < 10) {
        return `${m}:0${s}`;
    } else {
        return `${m}:${s}`;
    }
}


interface SliderProps {
    onValue?(val: number);
    className?: string;
}
class Slider extends Component<SliderProps, any> {
    slider: any = null;
    active = false;
    state = {
        max: 1,
        val: 0,
    }
    calcProc = (e)=> {
        const {max} = this.state;
        const brect = this.slider.getBoundingClientRect();
        return max * (e.clientX - brect.x) / brect.width;
    }
    onMove = (e: any) => {
        if (this.active) {
            //this.setState({val: this.calcProc(e)});
            this.props.onValue(this.calcProc(e));
        }
    }
    onMouseDown = (e: any) => {
        this.active = true;
    }
    onMouseUp = (e: any) => {
        if (this.props.onValue) {
            this.props.onValue(this.calcProc(e));
        }
        this.active = false;
    }
    sliderRef = (elem: any) => {
        this.slider = elem;
    }
    render() {
        const {max, val} = this.state;
        const p = '' + 100 * (val / (max || 1)) + '%'
        return (
            <div ref={this.sliderRef} className={classnames(this.props.className, "slider")} onMouseUp={this.onMouseUp} onMouseMove={this.onMove} onMouseDown={this.onMouseDown}>
                <div className="slider_back">
                    <div className="slider_amount" style={{width: p}}/>
                </div>
            </div>
        )
    }
};

interface PlayerState {
    tracks: TrackInfo[];
    displayedTracks: TrackInfo[]; // only set if there is a search, null otherwise
    currentTrackId: number;
    mode: Mode;
    playing: boolean;
}
export class Player extends Component<any, PlayerState> {
    state = {
        tracks: [],
        displayedTracks: null,
        currentTrackId: null,
        mode: Mode.STANDALONE,
        playing: false,
    }
    refs: any;
    audio: HTMLAudioElement = null;
    sliderVol: Slider = null;
    sliderTrack: Slider = null;
    playlist: any = null;

    fetchTracks = () => {
        playerConn.listTracks().then((tracks) => {
            console.log(tracks);
            this.setState({ tracks: tracks, displayedTracks: null })
        });
    }

    playTrackByIndex = ({idx, offset}: {idx?: number, offset?: number}) => {
        const tracks = this.state.displayedTracks || this.state.tracks;
        const audio = this.audio;
        if (!audio || !tracks || tracks.length == 0) {
            return;
        }

        // circular
        idx = idx || tracks.findIndex(t=>t.id == this.state.currentTrackId);
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
        const {tracks} = this.state;
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
        this.setState({currentTrackId: trackInfo.id}, ()=>{
            this.scrollToCurrentTrack();
        });
        console.log("playing", trackInfo);
        audio.play();
        this.updateMediaSession();
    }

    trackIdToIndex = (id: number) => {
        const idx = this.state.tracks.findIndex(track=>track.id == id);
        return idx == -1 ? 0 : idx;
    }

    getTrackById = (id: number) => {
        return this.state.tracks.find(track=>track.id == id);
    }

    setRating = (trackInfo: TrackInfo, newRating: number) => {
        playerConn.setTrackRating({id: trackInfo.id, rating: newRating});
    }

    renderRating(trackInfo: TrackInfo) {
        const rating = trackInfo.rating || 0;
        let res = [];
        for (let i=1; i<=5; ++i) {
            res.push(<a key={i} onClick={() => this.setRating(trackInfo, i)}>{(i <= rating) ? "\u2605" : "\u2606"}</a>);
        }
        return (
            <div className="rating-stars">
                {res}
            </div>
        )
    }

    getTrackTitle(trackInfo: TrackInfo) {
        const {artist, title, duration, id} = trackInfo;
        return title || getTrackFilename(trackInfo);
    }

    getTrackLineName(trackInfo: TrackInfo) {
        const {artist, title, duration, id} = trackInfo;
        if (artist && title) {
            return `${artist} - ${title}`
        } else {
            return getTrackFilename(trackInfo);
        }
    }

    showTrackInfo = (id: number) => {
        playerConn.getTrackInfoDump({id}).then(info => {
            alert(JSON.stringify(info, undefined, 2));
        });
    }

    deleteTrack = (id: number) => {
        if (this.getCurrentTrackId() == id) {
            this.nextTrack();
        }
        this.consumePromise(playerConn.deleteTrack({id})) 
    }

    consumePromise(p: Promise<any>) {
        p.catch(() => console.log("Unhandled promise"))
    }

    renderPlaylist() {
        let {tracks, displayedTracks} = this.state;
        const currentTrackId = this.getCurrentTrackId();
        const playlist = displayedTracks || tracks;
        const rowRenderer = ({index, key, style}: any) => {
            const trackInfo = playlist[index];
            const {artist, title, duration, id} = trackInfo;
            return (
                <div key={key} style={style} className={classnames("playlist-track", {"playing": id == currentTrackId})}>
                    <div className="track-info" onClick={() => this.playTrackById(id)}>
                        <div className="artist">
                        {artist || "Unknown"}
                        </div>
                        <div className="title">
                        {(artist && title) || getTrackFilename(trackInfo)}
                        </div>
                    </div>
                    <div className="track-buttons">
                    <img src={info_svg} onClick={() => this.showTrackInfo(id) }/>
                    <img src={trash_svg} onClick={()=> this.deleteTrack(id) }/>
                    </div>
                    <div className="track-stats">
                    {this.renderRating(trackInfo)}
                    <div className="duration">
                        {formatDuration(duration)}
                    </div>
                    </div>
                </div>
            )
        }
        const list = ({ height, width }) => (
            <List ref={this.playlistRef}
                className="playlist"
                autoHeight={false}
                width={width}
                height={height}
                rowHeight={40}
                rowCount={playlist.length}
                rowRenderer={rowRenderer}
            />
        );

        return (
            <div className="playlist-container">
              <AutoSizer children={list}/>
            </div>
        );
    }

    getCurrentTrack = () => {
        return this.state.tracks.find(t=>t.id == this.state.currentTrackId);
    }

    getVisibleTracklist = () => {
        return this.state.displayedTracks || this.state.tracks;
    }

    getCurrentTrackId = () => {
        return this.state.currentTrackId;
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

    onVolume = (val: number) => {
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
        this.setState({playing: false});
    }

    onAudioPlay = (evt: any) => {
        console.log('onPlay');
        playerConn.trackJournal({id: this.getCurrentTrackId(), evt: TrackJournalEvtType.PLAY })
        this.setState({playing: true});
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

    onPause = () => {
        if (this.getMode() == Mode.MASTER) {
            playerConn.pausePlay();
        } else {
            this.audio.pause();
        }
    }

    shuffleAll = () => {
        this.setState({tracks: shuffle(this.state.tracks)}, ()=> {
            if (!this.state.playing) {
                this.playFirstVisibleTrack();
            } else {
                this.scrollToCurrentTrack()
            }
        });
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
        return this.state.mode || Mode.STANDALONE;
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
        this.fetchTracks();
        if (navigator && navigator.mediaSession) {
            navigator.mediaSession.setActionHandler('previoustrack', () => this.prevTrack() );
            navigator.mediaSession.setActionHandler('nexttrack', () => this.nextTrack() );
        }

        this.setState({
            currentTrackId: LocalStorage.getNumber('currentTrackId', null),
            mode: LocalStorage.getString('mode', null) as Mode,
        });
        this.initEvents();
    }

    initEvents() {
        clientAPI.tracksUpdated = (modifTracks: TrackInfo[]) => {
            let newTracks = {}
            for (const track of modifTracks) {
                newTracks[track.id] = track;
            }
            const patch = (tracks) => tracks ? tracks.map(t => newTracks[t.id] || t): null;
            this.setState({
                tracks: patch(this.state.tracks),
                displayedTracks: patch(this.state.displayedTracks),
            });
        }

        clientAPI.tracksRemoved = (deletedTrackIds) => {
            const delSet = new Set(deletedTrackIds)
            const patch = (tracks) => tracks ? tracks.filter(t => !delSet.has(t.id) ): null;
            this.setState({
                tracks: patch(this.state.tracks),
                displayedTracks: patch(this.state.displayedTracks),
            });
        }

        clientAPI.playTracks = ({trackId, tracks, position}) => {
            if (this.getMode() == Mode.SLAVE) {
                const set_tracks = new Set(tracks);
                this.setState({displayedTracks: this.state.tracks.filter(t=>set_tracks.has(t.id))})
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
                this.setState({playing, currentTrackId: trackId})
            }
        }

    }

    _sendPlayingStatus = () => {
        if (this.getMode() != Mode.SLAVE) {
            return;
        }
        playerConn.reportStatus({
            trackId: this.state.currentTrackId,
            volume: this.audio ? this.audio.volume : null,
            position: this.audio ? this.audio.currentTime : null,
            duration: this.audio ? this.audio.duration : null,
            playing: this.state.playing
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
        this.audio.volume = LocalStorage.getNumber('volume', 1);
    }

    sliderVolumeRef = (elem: any) => {
        this.sliderVol = elem;
        if (this.audio.volume) {
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

    playlistFilterChange = ({target: {value}}: any) => {
        let newDisplayedTracks = this.state.tracks;
        if (value) {
            // allow searching by multiple attributes
            //const rex = buildFuzzySearch(value);
            //newDisplayedTracks = newDisplayedTracks.filter((track)=>matchInAttributes(track, ['artist', 'title', 'url'], rex));
            newDisplayedTracks = dumbAttribFilter(newDisplayedTracks, value, ['artist', 'title', 'url']);
        } else {
            newDisplayedTracks = null;
        }
        this.setState({displayedTracks: newDisplayedTracks})
    }
    //playlistFilterChange = debounce(this._playlistFilterChange, 500);

    renderDeleteTrackIcon(trackInfo: TrackInfo) {
        return (
            <img src={trash_svg} title="Dbl-click to delete track" onDoubleClick={ ()=> this.deleteTrack(trackInfo.id) }/>
        );
    }

    renderNowPlay() {
        const trackInfo = this.getCurrentTrack();
        return (
            <div className="nowPlay" onClick={()=>this.scrollToCurrentTrack()}>
                {
                    trackInfo
                        ? <span className="npTitle">{this.getTrackLineName(trackInfo)}</span>
                        : <span className="npTitle">-</span>
                }
                <div className="spacer"/>
                <div className="playnow-buttons">
                {trackInfo ? this.renderDeleteTrackIcon(trackInfo) : null}
                </div>
                {trackInfo ? this.renderRating(trackInfo) : null}
            </div>
        );
    }

    onKeyDown = (evt: KeyboardEvent) => {
        console.log(evt.code, evt.key);
    }

    onPlayClick = (e: any) => {
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

    changeMode(m: Mode) {
        this.setState({mode: m});
        LocalStorage.setString('mode', m);
    }

    render() {
        const {playing} = this.state;
        const mode = this.getMode();
        const modeBuilder = (m: Mode, icon: any) => {
            return (
                <Icon src={icon} className={classnames('btn', {active: mode == m}) } title={m} onClick={() =>this.changeMode(m) }/>
            );
        }
        return (
        <div className="player">
                {this.renderPlaylist()}
                <div className="player-footer">
                    {this.renderNowPlay()}
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
                    <div className="playControls">
                        { !playing
                            ?  <Icon src={play_svg} onClick={this.onPlayClick}/>
                            : <Icon src={pause_svg} onClick={this.onPause}/>
                        }
                        <Icon src={prev_svg} onClick={this.prevTrack}/>
                        <Icon src={next_svg} onClick={this.nextTrack}/>
                        <Icon src={random_svg} onClick={this.shuffleAll}/>
                        <Icon src={sync_svg} onClick={this.fetchTracks}/>
                        {modeBuilder(Mode.STANDALONE, child_svg)}
                        {modeBuilder(Mode.MASTER, bullhorn_svg)}
                        {modeBuilder(Mode.SLAVE, wifi_svg)}
                        <div className="filterGroup">
                          <input onInput={this.playlistFilterChange} onKeyDown={this.playlistFilterKeyDown} placeholder="filter..." />
                        </div>
                        <div className="spacer"/>
                        <Slider className="volume_slider" ref={this.sliderVolumeRef} onValue={this.onVolume} />
                    </div>
                </div>
        </div>
        );
    }
}
