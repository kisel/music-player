import * as React from 'react'
import {render} from 'react-dom'

import { App } from './app';

render(<App/>, document.getElementById("music-player-app"));

var hot = module ? (module as any).hot: null;
if (hot) {
    console.log("module.hot enabled");
    // hot.check(true);
    //hot.accept()
    hot.accept('./app', ()=>{
         console.log("module.hot.accept -- renedered all");
    });

    // hot.accept('./src/web/app.tsx', () => {
    //     console.log("module.hot.accept -- renedered all");
    // });
    //  hot.accept('./player.scss', () => {
    //      console.log("module.hot.accept -- renedered all");
    //  });
}

