import React from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import Axis from "./Axis";
import {inject, observer} from "mobx-react";
import SignificanceLine from "./SignificanceLine";
import {getTextWidth} from "../../UtilityFunctions";


const BarChart = inject("dataStore", "visStore")(observer((props) => {
    const margins = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 60,
    };

    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    let yScale = d3.scaleLinear().domain([0, d3.max(props.values.map(d => d.value))]).range([height, 0]);
    if (props.scaleLocked) {
        yScale = d3.scaleLinear().domain([0, props.maxY]).range([height, 0]);
    }
    /*const highlighters = props.dataStore.conditions.map((condition, i) => {
        return <rect key={condition} opacity={i === index ? 1 : 0}
                     x={props.xScale(condition)}
                     y={yScale(props.values[i])} width={props.xScale.bandwidth()}
                     height={height - yScale(props.values[i])} fill='none' stroke='black' strokeWidth='2px'/>
    });*/
    const rects = props.values.map((elem, i) => {
        const isHighlighted = props.visStore.childHighlights.length === 0 || props.visStore.childHighlights.includes(elem.id);
        return (<g key={elem.id}
                   onMouseLeave={() => {
                       props.visStore.setChildHighlight(null)
                   }}
                   onMouseEnter={() => {
                       props.visStore.setChildHighlight(elem.id)
                   }}>
            <rect onClick={() => props.visStore.setConditionIndex(i)} x={props.xScale(elem.id)}
                  y={yScale(elem.value)} width={props.xScale.bandwidth()}
                  height={height - yScale(elem.value)}
                  opacity={isHighlighted ? 1 : 0.4}
                  fill={props.visStore.termColorScale(elem.parent)}/>
        </g>)
    })
    const sigLine = <SignificanceLine width={width} height={yScale(props.logSigThreshold)}
                                      sigThreshold={props.sigThreshold}/>
    /*const startAnimation = useCallback((index) => {
        let els = d3.selectAll([...highlightRef.current.childNodes]);
        els.transition()
            .duration(props.visStore.animationDuration)
            .attr('opacity', (d, i) => i === index ? 1 : 0)
            .on('end', () => setIndex(index));
    }, [highlightRef, props.visStore.animationDuration]);
    React.useEffect(() => {
        startAnimation(props.visStore.conditionIndex);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.visStore.conditionIndex]);*/
    const xAxis = d3.axisBottom()
        .scale(props.xScale)
        .tickFormat(props.fullAxis ? (d) => props.dataStore.dataTable[d].description : "")
        .tickSize(props.fullAxis ? 4 : 0);
    const yAxis = d3.axisLeft()
        .scale(yScale);
    return (
        <g transform={'translate(' + margins.left + ',' + margins.top + ')'}>
            <Axis h={height} w={width} axis={xAxis} axisType={'x'} label={''} rotate={true}/>
            <Axis h={height} w={width} axis={yAxis} axisType={'y'} label={''}/>
            {rects}
            {/*<g ref={highlightRef}>{highlighters}</g>*/}
            {sigLine}
            <g transform={'translate(' + (width
                - getTextWidth(props.dataStore.conditions[props.id], 17, "normal"))
                + ",15)"}>
                <text>{props.dataStore.conditions[props.id]}</text>
            </g>
        </g>
    );
}));

BarChart.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    sigThreshold: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
    id: PropTypes.number.isRequired,
    values: PropTypes.arrayOf(PropTypes.object).isRequired,
    xScale: PropTypes.func.isRequired,
    fullAxis: PropTypes.bool.isRequired,
};
export default BarChart;

