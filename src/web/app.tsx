import * as React from 'react'
import {useState} from 'react'

import 'react-virtualized/styles.css'
import "./player.scss"

import {Player} from './components/player'
import { PlayerOptions } from './components/options';

export function App() {
    const [showOptions, setShowOptions] = useState(false)
    return (
        <div className="playerWrapper">
        <div className="playerWrapperInner">
        { showOptions
            ? <PlayerOptions close={()=>setShowOptions(false)}/>
            : <Player showOptions={() => setShowOptions(true)} />
        }
        </div>
        </div>
    );
}

