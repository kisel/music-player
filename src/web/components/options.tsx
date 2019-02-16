import * as React from 'react'

export interface PlayerOptionsProps {
    close: ()=>void;
}

export function PlayerOptions({close}: PlayerOptionsProps) {
    return (
        <div className="player"
            onKeyUp={(e) => { if (e.key == 'Escape') { close(); } } }
            onClick={close}
        >
        <button>
            Rescan library
        </button>
        </div>
    )
}
