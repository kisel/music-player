import * as React from 'react'

import 'react-virtualized/styles.css'
import "./player.scss"

import {Player} from './components/player'
import { PlayerOptions } from './components/options';
import { observer } from 'mobx-react-lite';
import { thePlayerStore, PlayerCtx} from './appstore';

export const App = observer(() => {
    const store = thePlayerStore;
    return (
        <div className="playerWrapper">
        <div className="playerWrapperInner">
        <PlayerCtx.Provider value={store}>
            <Player/>
        </PlayerCtx.Provider>
        </div>
        </div>
    );
});

