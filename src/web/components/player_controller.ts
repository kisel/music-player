import React = require("react");

export interface PlayerController {
    nextTrack(): void;
    prevTrack(): void;
    shuffleAll(): void;
    play(): void;
    pause(): void;
    showOptions(): void;
    setVolume(vol: number): void;
    playTrackById(trackId: number): void;
    showTrackInfo(id: number): void;
    deleteTrack(id: number): void;
    scrollToCurrentTrack(): void;
}

export const PlayerControllerCtx = React.createContext(null as PlayerController);
