import * as React from 'react'

import 'react-virtualized/styles.css'
import "./player.scss"

import {Player} from './components/player'

export function App() {
    return (
        <div className="playerWrapper">
        <div className="playerWrapperInner">
        <Player/>
        </div>
        </div>
    );
}

