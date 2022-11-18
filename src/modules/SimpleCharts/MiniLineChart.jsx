import React from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import Axis from "./Axis";
import {inject, observer} from "mobx-react";
import SignificanceLine from "./SignificanceLine";


const LineChart = inject("dataStore", "visStore")(observer((props) => {
    const margins = {
        top: 10,
        right: 10,
        bottom: 10,
        left: 20,
    };
    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    const max = d3.max(props.values);
    const xScale = d3.scalePoint().domain([...Array(props.dataStore.conditions.length).keys()]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, max]).range([height, 0]);
    let linestring = "";
    props.values.forEach((value, i) => {
        linestring += xScale(i) + ',' + yScale(value) + ' ';
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
                <polyline
                    fill='none'
                    stroke={props.color} strokeWidth={2}
                    points={linestring}/>
                <Axis h={height} w={width} axis={xAxis} axisType={'x'} label={''}/>
                <Axis h={height} w={width} axis={yAxis} axisType={'y'} label={''}/>
                <SignificanceLine width={width} height={yScale(props.logSigThreshold)}
                                  sigThreshold={props.sigThreshold}/>
            </g>
        </svg>
    );
}));

LineChart.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    id: PropTypes.string.isRequired,
    values: PropTypes.arrayOf(PropTypes.number).isRequired,
    sigThreshold: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};
export default LineChart;

