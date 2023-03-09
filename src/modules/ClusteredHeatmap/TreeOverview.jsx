import PropTypes from "prop-types";
import React, {createRef, useCallback, useEffect, useState} from 'react';
import * as d3 from "d3";
import {increase_brightness} from "../../UtilityFunctions";

const ScrollOverview = (props) => {
    const [dragging, setDragging] = useState(false);
    const [y0, setY0] = useState(props.yPos);
    const [y, setY] = useState(0);
    const ref = createRef();
    const scrollRef = createRef();

    const patternScale = d3.scaleLinear().domain([0, d3.sum(props.pattern.map(d => d.count))])
        .range([0, props.length]);
    const inverseY = d3.scaleLinear().domain([0, patternScale.range()[1]]).range(patternScale.domain());
    const mouseDown = useCallback((event) => {
        setDragging(true);
        setY0(event.pageY);
    }, []);
    const rectLength = props.length * (props.outerLength / props.innerLength);
    useEffect(() => {
        if (dragging) {
            const yDiff = y0 - props.yPos;
            let currY = y - yDiff;
            if (currY < 0) {
                currY = 0
            }
            if (currY + rectLength > props.outerLength) {
                currY = props.outerLength - rectLength
            }
            setY(currY);
            setY0(props.yPos);
            props.setCurrentPosition((currY * props.innerLength) / props.length)
        }
    }, [y0, y, dragging, props, inverseY, ref, rectLength]);
    useEffect(() => {
        if (!props.mouseDown) {
            setDragging(false);
        }
    }, [props.mouseDown]);
    const mouseUp = useCallback(() => {
        setDragging(false);
    }, []);
    useEffect(() => {
        const handleWheel = function (e) {
            e.preventDefault();
            let currY = y + e.deltaY;
            if (currY < 0) {
                currY = 0
            }
            if (currY + rectLength > props.outerLength) {
                currY = props.outerLength - rectLength
            }
            setY(currY);
            setY0(props.yPos);
            props.setCurrentPosition((currY * props.innerLength) / props.length)
        }
        const current = scrollRef.current;
        if (scrollRef && scrollRef.current) {
            current.addEventListener('wheel', handleWheel, {passive: false})
            return function cleanup() {
                current.removeEventListener('wheel', handleWheel, {passive: false})
            }
        }
    }, [props, rectLength, scrollRef, y])
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
    const rectPos = props.length * (props.currentPosition / props.innerLength);
    let viewRect = <rect ref={ref}
                         onMouseDown={mouseDown}
                         cursor={"grab"} pointerEvents={"visible"} y={props.breadth * (3 / 8)}
                         height={props.breadth * (1 / 4)}
                         width={rectLength}
                         x={rectPos} fill={"none"}
                         stroke={"gray"} strokeWidth={2}/>
    let polygon = <polygon points={rectPos + "," + props.breadth * (3 / 8) + " 0,0 "
        + props.length + ",0 " + (rectLength + rectPos) + "," + props.breadth * (3 / 8)}
                           fill={increase_brightness(props.colorScale.range()[0], 80)}/>

    return (<svg ref={scrollRef} width={props.orientation === "x" ? props.length : props.breadth}
                 height={props.orientation === "x" ? props.breadth : props.length}>
        <g transform={"rotate(90," + (props.breadth / 2) + "," + (props.breadth / 2) + ")"}
           onMouseUp={mouseUp}>
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