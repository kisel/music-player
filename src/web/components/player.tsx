import * as React from 'react'
import {Component} from 'react'

import { getTracks, setTrackRating } from "../api";
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

interface PlaylistProps {
    tracks: TrackInfo[];
    playTrack: (TrackInfo)=>void;
}

declare var navigator: any;
declare var MediaMetadata: any;

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

interface PlayerState {
    tracks: TrackInfo[];
    displayedTracks: TrackInfo[]; // only set if there is a search, null otherwise
    currentTrack: number; // index of tracks array
}
export class Player extends Component<any, PlayerState> {
    state = {
        tracks: [],
        displayedTracks: null,
        currentTrack: 0,
    }
    refs: any;
    audio: any = null;

    fetchTracks = () => {
        getTracks().then((tracks) => {
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
        const trackInfo = tracks[idx];
        audio.src = trackInfo.url;
        this.setState({currentTrack: idx});
        console.log("playing", trackInfo);
        audio.play();
        this.updateMediaSession();
    }

    trackIdToIndex = (id: number) => {
        const idx = this.state.tracks.findIndex(track=>track.id == id);
        return idx == -1 ? 0 : idx;
    }

    playTrackById = (id: number) => { this.playTrackByIndex(this.trackIdToIndex(id)); }

    getTrackById = (id: number) => {
        return this.state.tracks.find(track=>track.id == id);
    }

    setRating = (trackInfo: TrackInfo, newRating: number) => {
        const newTracks = this.state.tracks.map(track => {
            if (trackInfo.id === track.id) {
                return {...track, rating: newRating};
            } else {
                return track;
            }
        });
        this.setState({tracks: newTracks});
        setTrackRating({...trackInfo, rating: newRating}).then((res)=>{
            console.log("Rating changed", res);
        });
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
        alert(JSON.stringify(this.getTrackById(id), undefined, 2));
    }

    deleteTrack = (id: number) => {
        alert("Not implemented yet");
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
            <List
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
        return this.state.tracks[this.state.currentTrack];
    }

    getCurrentTrackId = () => {
        const currentTrackInfo = this.state.tracks[this.state.currentTrack];
        return currentTrackInfo ? currentTrackInfo.id : null;
    }

    nextTrack = () => {
        const {tracks, currentTrack} = this.state;
        if (!tracks) {
            return;
        }
        this.playTrackByIndex((currentTrack + 1) % tracks.length);
    }

    prevTrack = () => {
        const {tracks, currentTrack} = this.state;
        if (!tracks) {
            return;
        }
        if (currentTrack === 0) {
            this.playTrackByIndex(tracks.length - 1); // last
        } else {
            this.playTrackByIndex(currentTrack - 1); // prev
        }
    }

    renderTrackInfo() {
    }

    onVolume = (val: any) => {
        if (this.audio) {
            this.audio.volume = val.target.value;
        }
    }
 
    onPause = (evt: any) => {
        console.log(evt);
    }

    onPlay = (evt: any) => {
        console.log(evt);
        /*
        .on('play', function () {
            playing = true;
        }).on('error', function () {
            if (playing == true) {
                audio.play();
            }
        }).on('pause', function () {
            playing = false;
        }).on('ended', function () {
            if ((index + 1) < tracks.length) {
                index++;
                loadTrack(index);
                audio.play();
            } else {
                audio.pause();
                index = 0;
                loadTrack(index);
            }
        }).get(0);*/
    }

    stop() {
        this.audio.pause();
    }

    shuffleAll = () => {
        this.stop();
        this.setState({currentTrack: 0, tracks: shuffle(this.state.tracks)});
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
    }
    audioRef = (audio: any) => {
        if (this.audio) {
            this.audio.pause();
        }
        this.audio = audio;
    }

    playlistFilterChange = ({target: {value}}: any) => {
        let newDisplayedTracks = this.state.tracks;
        if (value) {
            // TODO: move to redux
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
            <div className="nowPlay">
                {
                    trackInfo
                        ? <span className="npTitle">{this.getTrackLineName(trackInfo)}</span>
                        : <span className="npTitle">-</span>
                }
                {trackInfo ? this.renderRating(trackInfo) : null}
            </div>
        );
    }

    onKeyDown = (evt: KeyboardEvent) => {
        console.log(evt.code, evt.key);
    }

    render() {
        //<a id="btnLoadAll" onClick={this.loadAll}>ALL</a>
        return (
        <div className="player">
                {this.renderPlaylist()}
                <div className="player-footer">
                    {this.renderNowPlay()}
                    <div className="audio0">
                        <audio ref={this.audioRef} preload="metadata" id="audio1" controls={true} onPlay={this.onPlay} onPause={this.onPause}>
                            Your browser does not support HTML5 Audio!
                                </audio>
                    </div>
                    <div className="playControls">
                        <a className="btn" onClick={this.prevTrack}>&larr;</a>
                        <a className="btn" onClick={this.nextTrack}>&rarr;</a>
                        <a className="btn" onClick={this.shuffleAll}>Shuffle</a>
                        <input className="playlist-filter" onInput={this.playlistFilterChange} placeholder="filter..." />
                        <input type="range" className="vol_slider" name="volume" min="0" max="1" step="0.01" onInput={this.onVolume} />
                    </div>
                </div>
        </div>
        );
    }
}
