import React, {createRef, useCallback, useEffect, useState} from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import {inject, observer} from "mobx-react";


const DraggableLine = inject("visStore")(observer((props) => {
    const [dragging, setDragging] = useState(false);
    const [x0, setX0] = useState(0);
    const [x, setX] = useState(0);
    const xScale = props.xScale;
    const ref = createRef();


    const mouseDown = useCallback((event) => {
        setDragging(true);
        setX0(event.pageX);
    }, []);

    const inverseX = d3.scaleLinear().domain([0, props.width]).range(xScale.domain());

    const sliderX0 = x - 5;
    const sliderY0 = -10;
    const sliderX1 = x + 5;
    const sliderY1 = -10;
    const sliderX2 = x;
    const sliderY2 = 0;
    const highlighter = <g onMouseDown={(e) => mouseDown(e)} ref={ref} cursor={dragging ? "grabbing" : "grab"}>
        <line x1={x} x2={x} y1={0} y2={props.height}
              fill='none'
              stroke='black' strokeWidth={1}/>
        <line x1={x} x2={x} y1={0} y2={props.height}
              fill='none' stroke='black' opacity={0} strokeWidth={5}/>
        <polygon points={sliderX0 + "," + sliderY0 + " " +
        sliderX1 + "," + sliderY1 + " " +
        sliderX2 + "," + sliderY2}/>
    </g>;
    useEffect(() => {
        if (dragging) {
            const xDiff = x0 - props.xPos;
            let currX = x - xDiff;
            if (currX < props.min) {
                currX = props.min;
            }
            if (currX > props.max) {
                currX = props.max
            }
            setX(currX);
            setX0(props.xPos);
            props.mouseUp(inverseX(currX));
        } else {
            let els = d3.selectAll([...ref.current.childNodes]);
            els.transition()
                .duration(props.duration)
                .ease(d3.easeLinear)
                .attr("x1", props.x)
                .attr("x2", props.x)
                .on('end', () => {
                    setX(props.x)
                });
        }
    }, [x0, x, dragging, props, inverseX,  ref]);
    useEffect(() => {
        if (!props.mouseDown) {
            setDragging(false);
        }
    }, [props.mouseDown]);
    const mouseUp = useCallback(() => {
        setDragging(false);
    }, []);
    return (
        <g onMouseUp={() => mouseUp()}>
            {highlighter}
        </g>
    );
}));

DraggableLine.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    xPos: PropTypes.number.isRequired,
    xScale: PropTypes.func.isRequired,
    mouseUp: PropTypes.func.isRequired,
    duration: PropTypes.number.isRequired,
    x: PropTypes.number.isRequired,
};
export default DraggableLine;

