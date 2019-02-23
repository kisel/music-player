import React = require("react");

export const trash_svg = require("@fortawesome/fontawesome-free/svgs/solid/trash.svg")
export const info_svg = require("@fortawesome/fontawesome-free/svgs/solid/info.svg")
export const bolt_svg = require("@fortawesome/fontawesome-free/svgs/solid/bolt.svg")

export const play_svg = require("@fortawesome/fontawesome-free/svgs/solid/play.svg")
export const pause_svg = require("@fortawesome/fontawesome-free/svgs/solid/pause.svg")
export const random_svg = require("@fortawesome/fontawesome-free/svgs/solid/random.svg")
export const next_svg = require("@fortawesome/fontawesome-free/svgs/solid/step-forward.svg")
export const prev_svg = require("@fortawesome/fontawesome-free/svgs/solid/step-backward.svg")
export const bullhorn_svg = require("@fortawesome/fontawesome-free/svgs/solid/bullhorn.svg")
export const wifi_svg = require("@fortawesome/fontawesome-free/svgs/solid/wifi.svg")
export const child_svg = require("@fortawesome/fontawesome-free/svgs/solid/child.svg")

export function Icon(props: any) {
    return <img className="btn" {...props} />
}
