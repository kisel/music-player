import * as React from 'react'
import { playerConn } from '../api';
import { ScanOptions, ScanResults } from '../../common/api_calls';
import { useContext, useState } from 'react';

import { observer } from "mobx-react-lite"
import { PlayerCtx } from '../appstore';

export const PlayerOptions = observer( () => {
    const store = useContext(PlayerCtx);
    const [scanState, setScanState] = useState({
        scanning: false,
        scanResults: null as ScanResults,
    });

    const close = () => {
        return store.optionsOpened = false;
    };

    const rescan = (opt: ScanOptions) => {
	setScanState({scanning: true, scanResults: null})
        playerConn.rescanLibrary(opt)
            .then((res) => setScanState({ scanning: false, scanResults: res }))
            .catch(() => setScanState({ scanning: false, scanResults: null }))
    }

    const {scanning, scanResults} = scanState;

    return (
        <div className="player"
            onKeyUp={(e) => { if (e.key == 'Escape') { close(); } }}
            onClick={close}
        >
            <button disabled={scanning} onClick={() => rescan({ dryRun: false })}>
                Rescan library
            </button>
            <button disabled={scanning} onClick={() => rescan({ dryRun: true })}>
                Rescan library(Dry run)
            </button>
            <button onClick={() => close()}>
                Close
            </button>

            {
                (scanning) && (
                    <div>Scanning in progress</div>
                )
            }

            {
                (scanResults && !scanning && scanResults.added) && (
                    <div>
                        <h3>Recently added tracks</h3>
                        <ul>
                            {
                                scanResults.added.map(({ artist, title }, idx) => (
                                    <li key={idx}>{artist} - {title}</li>
                                ))
                            }
                        </ul>
                    </div>
                )

            }
        </div>
    )
});
