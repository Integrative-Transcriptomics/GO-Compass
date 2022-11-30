import React from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import Axis from "./Axis";
import {inject, observer} from "mobx-react";
import SignificanceLine from "./SignificanceLine";


const BarChart = inject("dataStore", "visStore")(observer((props) => {
    const margins = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    };

    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    let max = d3.max(props.values.map(d => d.value))
    if (props.scaleLocked) {
        max = props.maxY
    }
    const yScale = d3.scaleLinear().domain([0, max]).range([height, 0]);
    const rects = props.values.map((elem, i) => {
        const isHighlighted = props.visStore.childHighlights.length === 0 || props.visStore.childHighlights.includes(elem.id);
        return (<g key={elem.id}
                   onMouseLeave={() => {
                       props.visStore.setChildHighlight(null)
                   }}
                   onMouseEnter={() => {
                       props.visStore.setChildHighlight(elem.id)
                   }}>
            <rect x={props.xScale(elem.id)}
                  y={yScale(elem.value)} width={props.xScale.bandwidth()}
                  height={height - yScale(elem.value)}
                  opacity={isHighlighted ? 1 : 0.4}
                  fill={props.visStore.termColorScale(elem.parent)}/>
        </g>)
    })
    let sigLine = null;
    if (props.logSigThreshold < max) {
        sigLine = <SignificanceLine width={width} height={yScale(props.logSigThreshold)}
                                    sigThreshold={props.sigThreshold}/>
    }
    const xAxis = d3.axisBottom()
        .scale(props.xScale)
        .tickFormat(props.fullAxis ? (d) => props.dataStore.dataTable[d].description : "")
        .tickSize(props.fullAxis ? 4 : 0);
    return (
        <g transform={'translate(' + margins.left + ',' + margins.top + ')'}>
            <Axis h={height} w={width} axis={xAxis} axisType={'x'} label={''} rotate={true}/>
            {rects}
            {/*<g ref={highlightRef}>{highlighters}</g>*/}
            {sigLine}

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

