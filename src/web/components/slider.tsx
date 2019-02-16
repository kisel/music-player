import * as React from 'react'
import { Component } from "react";
import classnames = require('classnames');

export interface SliderProps {
    onValue?(val: number);
    className?: string;
}
export class Slider extends Component<SliderProps, any> {
    slider: any = null;
    active = false;
    state = {
        max: 1,
        val: 0,
    }
    calcProc = (e)=> {
        const {max} = this.state;
        const brect = this.slider.getBoundingClientRect();
        return max * (e.clientX - brect.x) / brect.width;
    }
    onMove = (e: any) => {
        if (this.active) {
            //this.setState({val: this.calcProc(e)});
            this.props.onValue(this.calcProc(e));
        }
    }
    onMouseDown = (e: any) => {
        this.active = true;
    }
    onMouseUp = (e: any) => {
        if (this.props.onValue) {
            this.props.onValue(this.calcProc(e));
        }
        this.active = false;
    }
    sliderRef = (elem: any) => {
        this.slider = elem;
    }
    render() {
        const {max, val} = this.state;
        const p = '' + 100 * (val / (max || 1)) + '%'
        return (
            <div ref={this.sliderRef} className={classnames(this.props.className, "slider")} onMouseUp={this.onMouseUp} onMouseMove={this.onMove} onMouseDown={this.onMouseDown}>
                <div className="slider_back">
                    <div className="slider_amount" style={{width: p}}/>
                </div>
            </div>
        )
    }
};