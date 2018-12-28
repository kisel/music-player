import * as React from 'react'
import {Component} from 'react'

import { TrackJournalEvtType } from "../../common/api_calls";
import { playerConn, clientAPI } from "../api";
import { shuffle } from "../utils";
import {TrackInfo} from '../../common/track'
import debounce = require('lodash/debounce');
import { List, AutoSizer } from 'react-virtualized'
//const { Column, Table, List } = require('react-virtualized')
import * as classnames from 'classnames';
import { KeyboardEventHandler } from "react";
import { dumbAttribFilter } from "../../utils/filters";

const trash_svg = require("@fortawesome/fontawesome-free/svgs/solid/trash.svg")
const info_svg = require("@fortawesome/fontawesome-free/svgs/solid/info.svg")

const play_svg = require("@fortawesome/fontawesome-free/svgs/solid/play.svg")
const pause_svg = require("@fortawesome/fontawesome-free/svgs/solid/pause.svg")
const random_svg = require("@fortawesome/fontawesome-free/svgs/solid/random.svg")
const next_svg = require("@fortawesome/fontawesome-free/svgs/solid/step-forward.svg")
const prev_svg = require("@fortawesome/fontawesome-free/svgs/solid/step-backward.svg")

interface PlaylistProps {
    tracks: TrackInfo[];
    playTrack: (TrackInfo)=>void;
}

declare var navigator: any;
declare var MediaMetadata: any;
const THRESHOLD_SKIP = 30;

class Icon extends Component<any, any> {
    render() {
        return <img {...this.props}/>
    }
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
    state = {
        max: 1,
        val: 0,
    }
    onClick = (e: any) => {
        const {max} = this.state;
        const brect = e.target.getBoundingClientRect();
        const value_selected = max * (e.clientX - brect.x) / brect.width;
        if (this.props.onValue) {
            this.props.onValue(value_selected);
        }
    }
    render() {
        const {max, val} = this.state;
        const p = '' + 100 * (val / (max || 1)) + '%'
        return (
            <div className={classnames(this.props.className, "slider")} onClick={this.onClick}>
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
}
export class Player extends Component<any, PlayerState> {
    state = {
        tracks: [],
        displayedTracks: null,
        currentTrackId: null,
    }
    refs: any;
    audio: any = null;
    playing = false;
    progressVol:any = null;
    progressTrack: any = null;
    playlist: any = null;

    fetchTracks = () => {
        playerConn.listTracks().then((tracks) => {
            console.log(tracks);
            this.setState({ tracks: tracks, displayedTracks: null })
        });
    }

    playTrackByIndex = (idx: number) => {
        const {tracks} = this.state;
        const audio = this.audio;
        if (!audio || !tracks || tracks.length == 0 || !tracks[idx]) {
            return;
        }

        // circular
        idx = (idx + tracks.length) % tracks.length;
        if (!tracks[idx]) {
            return;
        }

        if (audio.currentTime > THRESHOLD_SKIP ) {
            this.consumePromise(playerConn.trackJournal({id: this.getCurrentTrackId(), evt: TrackJournalEvtType.SKIP }));
        }
        const trackInfo = tracks[idx];
        audio.src = trackInfo.url;
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

    playTrackById = (id: number) => { this.playTrackByIndex(this.trackIdToIndex(id)); }
;
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

    getCurrentTrackIndex = () => {
        return this.state.tracks.findIndex(t=>t.id == this.state.currentTrackId);
    }

    getVisibleTracklist = () => {
        return this.state.displayedTracks || this.state.tracks;
    }

    getCurrentTrackId = () => {
        return this.state.currentTrackId;
    }

    nextTrack = () => {
        this.playTrackByIndex((this.getCurrentTrackIndex() + 1))
    }

    prevTrack = () => {
        this.playTrackByIndex(this.getCurrentTrackIndex() - 1); // prev
    }

    renderTrackInfo() {
    }

    onTrackSeek = (val: number) => {
        if (this.audio) {
            this.audio.currentTime = val;
        }
    }

    onVolume = (val: number) => {
        if (this.audio) {
            this.audio.volume = val;
        }
    }
 
    onPause = (evt: any) => {
        console.log('onPause');
        this.playing = false;
    }

    onPlay = (evt: any) => {
        console.log('onPlay');
        playerConn.trackJournal({id: this.getCurrentTrackId(), evt: TrackJournalEvtType.PLAY })
        this.playing = true;
    }

    onVolumeChange = (evt: any) => {
        if (this.progressVol) {
            this.progressVol.setState({val: this.audio.volume, max: 1});
        }
    }

    onEnded = (evt: any) => {
        console.log('onEnded');
        playerConn.trackJournal({id: this.getCurrentTrackId(), evt: TrackJournalEvtType.END });
        this.nextTrack();
    }

    onTimeUpdate = (evt: any) => {
        //console.log(evt);
        if (this.progressTrack) {
            const {currentTime, duration} = this.audio;
            this.progressTrack.setState({val: currentTime, max: duration});
        }
    }

    stop() {
        this.audio.pause();
    }

    shuffleAll = () => {
        this.setState({tracks: shuffle(this.state.tracks)}, ()=> {
            this.scrollToCurrentTrack()
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
    }

    playlistRef = (elem: any) => {
        this.playlist = elem;
    }

    audioRef = (audio: any) => {
        if (this.audio) {
            this.audio.pause();
        }
        this.audio = audio;
    }

    progressVolumeRef = (elem: any) => {
        this.progressVol = elem;
        if (this.audio.volume) {
            this.progressVol.setState({val: this.audio.volume, max:1 })
        }
    }

    progressTrackRef = (elem: any) => {
        this.progressTrack = elem;
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

    renderNowPlay() {
        const trackInfo = this.getCurrentTrack();
        return (
            <div className="nowPlay" onClick={()=>this.scrollToCurrentTrack()}>
                {
                    trackInfo
                        ? <span className="npTitle">{this.getTrackLineName(trackInfo)}</span>
                        : <span className="npTitle">-</span>
                }
                {trackInfo ? this.renderRating(trackInfo) : null}

            <div>
            <Slider ref={this.progressTrackRef} onValue={this.onTrackSeek}/>
            </div>
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
            this.nextTrack();
        }
    }

    render() {
        //<a id="btnLoadAll" onClick={this.loadAll}>ALL</a>
        return (
        <div className="player">
                {this.renderPlaylist()}
                <div className="player-footer">
                    {this.renderNowPlay()}
                    <div className="audio0">
                        <audio ref={this.audioRef} preload="metadata" id="audio1" controls={true} 
            onPlay={this.onPlay}
            onPause={this.onPause}
            onVolumeChange={this.onVolumeChange}
            onTimeUpdate={this.onTimeUpdate}
            onEnded={this.onEnded}
            >
                            Your browser does not support HTML5 Audio!
                                </audio>
                    </div>
                    <div className="playControls">
                        <Icon className="btn" src={play_svg} onClick={this.onPlayClick}/>
                        <Icon className="btn" src={pause_svg} onClick={()=>this.audio.pause()}/>
                        <Icon className="btn" src={prev_svg} onClick={this.prevTrack}/>
                        <Icon className="btn" src={next_svg} onClick={this.nextTrack}/>
                        <Icon className="btn" src={random_svg} onClick={this.shuffleAll}/>
                        <div className="filterGroup">
                          <input onInput={this.playlistFilterChange} placeholder="filter..." />
                        </div>
                        <div className="spacer"/>
                        <Slider className="volume_slider" ref={this.progressVolumeRef} onValue={this.onVolume} />
                    </div>
                </div>
        </div>
        );
    }
}
