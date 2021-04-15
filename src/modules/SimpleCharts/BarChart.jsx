import React, {useCallback, useState} from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import Axis from "./Axis";
import {inject, observer} from "mobx-react";
import SignificanceLine from "./SignificanceLine";


const BarChart = inject("dataStore", "visStore")(observer((props) => {
    const [index, setIndex] = useState(0);
    const highlightRef = React.createRef();
    const margins = {
        top: 0,
        right: 0,
        bottom: 5,
        left: 60,
    };

    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    let yScale = d3.scaleLinear().domain([0, d3.max(props.values)]).range([height, 0]);
    if (props.scaleLocked) {
        yScale = d3.scaleLinear().domain([0, props.maxY]).range([height, 0]);
    }
    const highlighters = props.dataStore.conditions.map((condition, i) => {
        return <rect key={condition} opacity={i === index ? 1 : 0}
                     x={props.xScale(condition)}
                     y={yScale(props.values[i])} width={props.xScale.bandwidth()}
                     height={height - yScale(props.values[i])} fill='none' stroke='black' strokeWidth='2px'/>
    });
    const rects = props.dataStore.conditions.map((condition, i) => {
        return (<g key={condition}
                   onMouseLeave={() => {
                       props.visStore.setChildHighlight(null)
                   }}
                   onMouseEnter={() => {
                       props.visStore.setChildHighlight(props.id)
                   }}>
            <rect onClick={() => props.visStore.setConditionIndex(i)} x={props.xScale(condition)}
                  y={yScale(props.values[i])} width={props.xScale.bandwidth()}
                  height={height - yScale(props.values[i])}
                  fill={props.visStore.termColorScale(props.parent)}/>
        </g>)
    })
    const sigLine = <SignificanceLine width={width} height={yScale(props.logSigThreshold)}
                                      sigThreshold={props.sigThreshold}/>
    const startAnimation = useCallback((index) => {
        let els = d3.selectAll([...highlightRef.current.childNodes]);
        els.transition()
            .duration(props.visStore.animationDuration)
            .attr('opacity', (d, i) => i === index ? 1 : 0)
            .on('end', () => setIndex(index));
    }, [highlightRef, props.visStore.animationDuration]);
    React.useEffect(() => {
        startAnimation(props.visStore.conditionIndex);
    }, [props.visStore.conditionIndex, startAnimation]);
    const xAxis = d3.axisBottom()
        .scale(props.xScale)
        .tickFormat(props.fullAxis ? (d) => d : "");
    const yAxis = d3.axisLeft()
        .scale(yScale);
    return (
        <g transform={'translate(' + margins.left + ',' + margins.top + ')'}>
            <Axis h={height} w={width} axis={xAxis} axisType={'x'} label={''} rotate={true}/>
            <Axis h={height} w={width} axis={yAxis} axisType={'y'} label={''}/>
            {rects}
            <g ref={highlightRef}>{highlighters}</g>
            {sigLine}
        </g>
    );
}));

BarChart.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    sigThreshold: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
    id: PropTypes.string.isRequired,
    parent: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    values: PropTypes.arrayOf(PropTypes.number).isRequired,
    xScale: PropTypes.func.isRequired,
    fullAxis: PropTypes.bool.isRequired,
};
export default BarChart;

