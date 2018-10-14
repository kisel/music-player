import {h, Component } from "preact";
import { getTracks } from "../api";
import "../player.scss"
import { shuffle } from "../utils";
import {TrackInfo} from '../../common/track'

interface PlaylistProps {
    tracks: TrackInfo[];
    playTrack: (TrackInfo)=>void;
}

declare var navigator: any;
declare var MediaMetadata: any;

function matchTrack(pattern: string, track: TrackInfo) {

}
export class Player extends Component {
    state = {
        tracks: [] as TrackInfo[],
        currentTrack: 0,
        trackInfo: {} as TrackInfo,
        playlistFilter: "",
    }
    audio: any = null;

    constructor() {
        super();
        getTracks().then((tracks) => {
            console.log(tracks);
            this.setState({ tracks })
        });
    }

    playTrack = (idx: number) => {
        const {tracks} = this.state;
        const audio = this.audio;
        if (!audio || !tracks || tracks.length == 0 || !tracks[idx]) {
            return;
        }
        const trackInfo = tracks[idx];
        audio.src = trackInfo.url;
        this.setState({currentTrack: idx, trackInfo});
        audio.play();
        this.updateMediaSession();
    }

    renderPlaylist() {
        const {tracks, playlistFilter} = this.state;
        return (
            <table class="playlist">
                {tracks.map((trackInfo, index) => {
                    const {artist, name, duration} = trackInfo;
                    const {currentTrack} = this.state;
                    if (!playlistFilter || (artist && artist.search(playlistFilter) >= 0) || (name && name.search(playlistFilter) >= 0)) {
                        return (
                            <tr key={index} class={(currentTrack == index) ? "plSel" : undefined} onClick={() => this.playTrack(index)}>
                                <td>{index + 1} </td>
                                <td>{name}</td>
                                <td>{duration}</td>
                            </tr>
                        );
                    } else {
                        return null;
                    }
                } )}
            </table>
        );
    }

    getCurrentTrack = () => {
        return this.state.tracks[this.state.currentTrack];
    }

    nextTrack = () => {
        const {tracks, currentTrack} = this.state;
        if (!tracks) {
            return;
        }
        this.playTrack((currentTrack + 1) % tracks.length);
    }

    prevTrack = () => {
        const {tracks, currentTrack} = this.state;
        if (!tracks) {
            return;
        }
        if (currentTrack === 0) {
            this.playTrack(tracks.length - 1); // last
        } else {
            this.playTrack(currentTrack - 1); // prev
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
        this.setState({playlistFilter: value})
    }

    render() {
        //<a id="btnLoadAll" onClick={this.loadAll}>ALL</a>
        const {trackInfo, playlistFilter} = this.state;
        return (
        <div class="container">
                {this.renderPlaylist()}
                <div id="player">
                    <div class="wrapper">
                        <div id="nowPlay">
                        {
                            trackInfo
                            ? <span id="npTitle">{trackInfo.index + 1} {trackInfo.artist}-{trackInfo.title}</span>
                            : <span id="npTitle">-</span>
                        }

                        </div>
                        <div id="audiowrap">
                            <div id="audio0">
                                <audio ref={this.audioRef} preload="metadata" id="audio1" controls={true} onPlay={this.onPlay} onPause={this.onPause}>
                                    Your browser does not support HTML5 Audio!
                                </audio>
                            </div>
                            <div id="playControls">
                                <a id="btnPrev" onClick={this.prevTrack}>&larr;</a>
                                <a id="btnNext" onClick={this.nextTrack}>&rarr;</a>
                                <a id="btnShuffle" onClick={this.shuffleAll}>Shuffle</a>
                                <input class="playlist-filter" onInput={this.playlistFilterChange} title="filter...">{playlistFilter}</input>
                                <input type="range" id="vol_slider" name="volume" min="0" max="1" step="0.01" onInput={this.onVolume}/>
                                <label for="volume">Volume</label>
                            </div>
                        </div>
                    </div>
                </div>
        </div>
        );
    }
}
