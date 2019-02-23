import { observer } from "mobx-react-lite";
import React = require("react");
import { Icon, play_svg, pause_svg, prev_svg, next_svg, random_svg, bolt_svg, child_svg, bullhorn_svg, wifi_svg } from "../icons";
import { Mode, PlayerCtx } from "../appstore";
import { Slider } from "./slider";
import classnames = require("classnames");
import { PlayerController } from "./player_controller";
import { LocalStorage } from "../local_storage";

interface PlayControlsProps {
    playlistFilterChange: (e: any) => void
    playlistFilterKeyDown: (e: any) => void
    sliderVolumeRef: (e: any) => void
    playerCtrl: PlayerController;
}
export const PlayControls = observer((props: PlayControlsProps)=> {
    const store = React.useContext(PlayerCtx);
    const {mode, playing, filterString} = store;
    const {playerCtrl} = props;

    const changeMode = (m: Mode) => {
        store.mode = m;
        LocalStorage.setString('mode', m);
    }

    const modeBuilder = (m: Mode, icon: any) => {
        return (
            <Icon
                src={icon}
                className={classnames('btn', { active: mode == m })}
                title={m}
                onClick={() => changeMode(m)}
            />
        );
    }
    return (
        <div className="playControls">
            {!playing
                ? <Icon src={play_svg} onClick={playerCtrl.play} />
                : <Icon src={pause_svg} onClick={playerCtrl.pause} />
            }
            <Icon src={prev_svg} onClick={playerCtrl.prevTrack} />
            <Icon src={next_svg} onClick={playerCtrl.nextTrack} />
            <Icon src={random_svg} onClick={playerCtrl.shuffleAll} />
            <Icon src={bolt_svg} onClick={() => {store.optionsOpened = true } } />
            {modeBuilder(Mode.STANDALONE, child_svg)}
            {modeBuilder(Mode.MASTER, bullhorn_svg)}
            {modeBuilder(Mode.SLAVE, wifi_svg)}
            <div className="filterGroup">
                <input
                    onChange={props.playlistFilterChange}
                    onKeyDown={props.playlistFilterKeyDown}
                    placeholder="filter..."
                    value={filterString}
                />
            </div>
            <div className="spacer" />
            <Slider
                className="volume_slider"
                ref={props.sliderVolumeRef}
                onValue={playerCtrl.setVolume}
            />
        </div>
    );
});
