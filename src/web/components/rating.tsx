import React = require("react");
import { TrackInfo } from "../../common/track";
import { playerConn } from "../api";

export interface RatingProps {
    trackInfo: TrackInfo;
}
export const Rating = ({trackInfo}: RatingProps) => {
    const rating = trackInfo.rating || 0;
    let res = [];
    for (let i = 1; i <= 5; ++i) {
        res.push(
            <a key={i} className={(i <= rating) ? "active" : null}
                onClick= {() => {
                    playerConn.setTrackRating({ id: trackInfo.id, rating: i })
                    }}>
                {(i <= rating) ? "\u2605" : "\u2606"}
            </a>
        );
    }
    return (
        <div className="rating-stars">
            {res}
        </div>
    )
}
