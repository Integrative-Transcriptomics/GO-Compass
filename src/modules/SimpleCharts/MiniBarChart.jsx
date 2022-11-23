import React from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import Axis from "./Axis";
import {inject, observer} from "mobx-react";
import SignificanceLine from "./SignificanceLine";


const BarChart = inject("dataStore", "visStore")(observer((props) => {
    const margins = {
        top: 10,
        right: 10,
        bottom: 10,
        left: 20,
    };
    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    const max = d3.max(props.values);
    const xScale = d3.scaleBand().domain([...Array(props.dataStore.conditions.length).keys()]).range([0, width]).padding(0.25);
    const yScale = d3.scaleLinear().domain([0, max]).range([0, height]);
    let bars = props.values.map((value, i) => {
        return (<rect key={i} x={xScale(i)} y={height - yScale(value)} height={yScale(value)} width={xScale.bandwidth()}
                      fill={props.color}/>)
    });
    const xAxis = d3.axisBottom()
        .scale(xScale)
        .tickFormat(() => "");
    const yAxis = d3.axisLeft()
        .scale(yScale)
        .ticks(0);
    return (
        <svg width={props.width}
             height={props.height}>
            <rect width={props.width} height={props.height} fill={"white"}/>
            <g transform={'translate(' + margins.left + ',' + margins.top + ')'}>
                {bars}
                <Axis h={height} w={width} axis={xAxis} axisType={'x'} label={''}/>
                <Axis h={height} w={width} axis={yAxis} axisType={'y'} label={''}/>
                <SignificanceLine width={width} height={yScale(props.logSigThreshold)}
                                  sigThreshold={props.sigThreshold}/>
            </g>
        </svg>
    );
}));

BarChart.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    values: PropTypes.arrayOf(PropTypes.number).isRequired,
    sigThreshold: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};
export default BarChart;

