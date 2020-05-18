import React, {useCallback, useEffect, useState} from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import Axis from "./Axis";


function LineChart(props) {
    const [index, setIndex] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [x, setX] = useState(0);
    let x0= 0;
    const highlightRef = React.createRef();
    const margins = {
        top: 20,
        right: 20,
        bottom: 40,
        left: 60,
    };
    useEffect(()=>{
        if(dragging){

        }
    },[dragging]);
    const mouseMove = useCallback((event)=>{
        if(dragging){
            const xDiff = x0 - event.pageX;
            console.log(x0, x, event.pageX, xDiff);
            setX(-xDiff);
            x0=event.pageX;

        }
    });
    const mouseDown = useCallback((event)=>{
        setDragging(true);
        x0=event.pageX;
        console.log("mouseDown")
    });
    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    const max = d3.max(props.data.children.map(d => d3.max(d.values)));
    const xScale = d3.scalePoint().domain([...Array(props.data.keys.length).keys()]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, max]).range([height, 0]);
    const lines = props.data.children.map(line => {
        let linestring = "";
        line.values.forEach((value, i) => {
            linestring += xScale(i) + ',' + yScale(value) + ' ';
        });
        return (<polyline fill='none' stroke={props.color(line.name)} key={line.name} points={linestring}/>)
    });
    const highlighter = <line onMouseDown={(e) => mouseDown(e)} ref={highlightRef} x1={x} x2={x} y1={0} y2={height} fill='none'
                              stroke='black' strokeWidth={4}/>;
    const startAnimation = useCallback((index) => {
        let el = d3.select(highlightRef.current);
        el.transition()
            .duration(props.duration)
            .ease(d3.easeLinear)
            .attr("x1", xScale(index))
            .attr("x2", xScale(index))
            .on("end", () =>
                setIndex(index)
            );
    }, [highlightRef, xScale, props.duration]);
    React.useLayoutEffect(() => {
        startAnimation(props.index);
    }, [props.index, startAnimation]);
    const xAxis = d3.axisBottom()
        .scale(xScale)
        .tickFormat(d => props.data.keys[d]);
    const yAxis = d3.axisLeft()
        .scale(yScale);
    return (
        <svg onMouseUp={() => setDragging(false)} onMouseMove={(e)=>mouseMove(e)} width={props.width}
             height={props.height}>
            <g transform={'translate(' + margins.left + ',' + margins.top + ')'}>
                <Axis h={height} w={width} axis={xAxis} axisType={'x'} label={'Condition'}/>
                <Axis h={height} w={width} axis={yAxis} axisType={'y'} label={'-log10pVal'}/>
                {lines}
                {highlighter}
            </g>
        </svg>
    );
}

LineChart.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    data: PropTypes.objectOf(PropTypes.array),
    color: PropTypes.func.isRequired
};
LineChart.defaultProps = {
    width: 900,
    height: 350,
};
export default LineChart;

