import React, {useCallback, useEffect, useRef, useState} from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";


function LineHighlighter(props) {
    const [dragging, setDragging] = useState(false);
    const [x, setX] = useState(0);
    const [x0, setX0] = useState(0);
    const [hoverIndex, setHoverIndex] = useState(-1);
    const highlightRef = useRef();
    const xScale = props.xScale;
    const setIndex = props.setIndex;


    const mouseDown = useCallback((event) => {
        setDragging(true);
        setX0(event.pageX);
    }, []);

    const inverseX = d3.scaleQuantize().domain([0, props.width]).range(xScale.domain());

    const highlighter = <g ref={highlightRef}>
        <line x1={x} x2={x} y1={0} y2={props.height}
              fill='none'
              stroke='black' strokeWidth={1}/>
        <line onMouseDown={(e) => mouseDown(e)} x1={x} x2={x} y1={0} y2={props.height}
              fill='none' stroke='black' opacity={0} strokeWidth={5}/>
    </g>;
    const highlighters = xScale.domain().map((d, i) => {
        return <g key={d}>
            <line x1={xScale(i)} x2={xScale(i)} y1={0}
                  y2={props.height}
                  fill='none'
                  stroke='black' opacity={hoverIndex === i ? 0.5 : 0} strokeWidth={1}/>
            <line onClick={() => props.setIndex(i)} onMouseEnter={() => setHoverIndex(i)}
                  onMouseLeave={() => setHoverIndex(-1)} x1={xScale(i)} x2={xScale(i)} y1={0}
                  y2={props.height}
                  fill='none'
                  stroke="black"
                  opacity={0}
                  strokeWidth={5}/>
        </g>
    });
    useEffect(() => {
        if (!dragging) {
            let els = d3.selectAll([...highlightRef.current.childNodes]);
            els.transition()
                .duration(props.duration)
                .ease(d3.easeLinear)
                .attr("x1", xScale(props.index))
                .attr("x2", xScale(props.index))
                .on('end', () => {
                    setX(xScale(props.index))
                });
        }
    }, [highlightRef, props.duration, props.index, props.index, dragging]);
    useEffect(() => {
        if (dragging) {
            const xDiff = x0 - props.xPos;
            setX(x - xDiff);
            setX0(props.xPos);
        }
    }, [x0, x, dragging, props.xPos]);
    const mouseUp = useCallback(() => {
        setDragging(false);
        setIndex(inverseX(x))
    }, [x, inverseX, setIndex]);
    return (
        <g onMouseUp={() => mouseUp()}>
            {highlighters}
            {highlighter}
        </g>
    );
}

LineHighlighter.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
    xScale: PropTypes.func.isRequired,
    setIndex: PropTypes.func.isRequired,
    duration: PropTypes.number.isRequired,
};
export default LineHighlighter;

