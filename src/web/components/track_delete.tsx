import React = require("react");
import { useContext } from "react";
import { PlayerControllerCtx } from "./player_controller";
import { trash_svg } from "../icons";

export function TrackDelete({trackId}: {trackId: number}) {
    const ctrl = useContext(PlayerControllerCtx);
    return (
        <img src={trash_svg} title="Click to delete track"
            onClick={() => ctrl.deleteTrack(trackId)} />
    );
}
