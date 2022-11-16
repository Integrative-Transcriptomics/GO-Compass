import PropTypes from "prop-types";
import React from 'react';
import * as d3 from "d3";
import {increase_brightness} from "../../UtilityFunctions";

const ScrollOverview = (props) => {
    const patternScale = d3.scaleLinear().domain([0, d3.sum(props.pattern.map(d => d.count))])
        .range([0, props.length]);
    let total = 0;
    const patternOverview = [];
    props.pattern.forEach(d => {
        patternOverview.push(<line key={d.id}
                                   x1={patternScale(total)}
                                   x2={patternScale(total + d.count)}
                                   y1={props.breadth / 2}
                                   y2={props.breadth / 2} strokeWidth={props.breadth / 4}
                                   stroke={props.colorScale(d.id)}/>)
        total += d.count;
    })
    const rectLength = props.length * (props.outerLength / props.innerLength);
    const rectPos = props.length * (props.currentPosition / props.innerLength);
    let viewRect = <rect y={props.breadth * (3 / 8)} height={props.breadth * (1 / 4)}
                         width={rectLength}
                         x={rectPos} fill={"none"}
                         stroke={"gray"} strokeWidth={2}/>
    let polygon = <polygon points={rectPos + "," + props.breadth * (3 / 8) + " 0,0 "
        + props.length + ",0 " + (rectLength + rectPos) + "," + props.breadth * (3 / 8)}
                           fill={increase_brightness(props.colorScale.range()[0], 80)}/>

    return (<svg width={props.orientation === "x" ? props.length : props.breadth}
                 height={props.orientation === "x" ? props.breadth : props.length}>
        <g transform={"rotate(90,"+(props.breadth/2)+","+(props.breadth/2)+")"}>
            {patternOverview}
            {polygon}
            {viewRect}
        </g>
    </svg>)
}
ScrollOverview.propTypes = {
    length: PropTypes.number.isRequired,
    breadth: PropTypes.number.isRequired,
    outerLength: PropTypes.number.isRequired,
    innerLength: PropTypes.number.isRequired,
    currentPosition: PropTypes.number.isRequired,
    orientation: PropTypes.oneOf(["x", "y"]).isRequired,
    pattern: PropTypes.arrayOf(PropTypes.object).isRequired,
    colorScale: PropTypes.func.isRequired,

};
export default ScrollOverview;