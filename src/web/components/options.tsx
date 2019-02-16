import * as React from 'react'
import { playerConn } from '../api';
import { ScanOptions, ScanResults } from '../../common/api_calls';

export interface PlayerOptionsProps {
    close: ()=>void;
}


export function PlayerOptions({close}: PlayerOptionsProps) {
    const [rescanning, setRescanning] = React.useState(false);
    const [rescanResult, setRescanResult] = React.useState<ScanResults>(null);

    const rescan = (opt: ScanOptions) => {
        setRescanning(true);
        playerConn.rescanLibrary(opt)
            .then((res) => { setRescanResult(res); setRescanning(false); })
            .catch(() => { setRescanResult(null); setRescanning(false); } )
    }

    return (
        <div className="player"
            onKeyUp={(e) => { if (e.key == 'Escape') { close(); } } }
            onClick={close}
        >
        <button disabled={rescanning} onClick={() => rescan({dryRun: false})}>
            Rescan library
        </button>
        <button disabled={rescanning} onClick={() => rescan({dryRun: true})}>
            Rescan library(Dry run)
        </button>

        {
                (rescanResult && rescanResult.added) && (
                    <div>
                    <h3>Recently added tracks</h3>
                    <ul>
                        {
                            rescanResult.added.map(({ artist, title }, idx) => (
                                <li key={idx}>{artist} - {title}</li>
                            ))
                        }
                    </ul>
                    </div>
                )

        }
        </div>
    )
}
