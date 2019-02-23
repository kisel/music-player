import { observer } from "mobx-react-lite";
import { useContext } from "react";
import { PlayerCtx } from "../appstore";
import React = require("react");
import classnames = require("classnames");
import { info_svg, trash_svg } from "../icons";
import { formatDuration, getTrackFilename } from "./format";
import { List, AutoSizer } from "react-virtualized";
import { toJS } from "mobx";
import { Rating } from "./rating";
import { PlayerController } from "./player_controller";

export interface PlaylistProps {
    playlistRef: any;
    playerCtrl: PlayerController;
}
export const Playlist = observer((props: PlaylistProps) => {
    const store = useContext(PlayerCtx);
    let { tracks, displayedTracks, currentTrackId } = store;
    const {playerCtrl} = props;

    const playlist = toJS(displayedTracks || tracks);
    const rowRenderer = ({ index, key, style }: any) => {
        const trackInfo = playlist[index];
        const { artist, title, duration, id } = trackInfo;
        return (
            <div key={key} style={style} className={classnames("playlist-track", { "playing": id == currentTrackId })}>
                <div className="track-info" onClick={() => playerCtrl.playTrackById(id)}>
                    <div className="artist">
                        {artist || "Unknown"}
                    </div>
                    <div className="title">
                        {(artist && title) || getTrackFilename(trackInfo)}
                    </div>
                </div>
                <div className="track-buttons">
                    <img src={info_svg} onClick={() => playerCtrl.showTrackInfo(id)} />
                    <img src={trash_svg} onClick={() => playerCtrl.deleteTrack(id)} />
                </div>
                <div className="track-stats">
                    <Rating trackInfo={trackInfo} />
                    <div className="duration">
                        {formatDuration(duration)}
                    </div>
                </div>
            </div>
        )
    }
    const list = ({ height, width }) => (
        <List ref={props.playlistRef}
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
            <AutoSizer children={list} />
        </div>
    );
})