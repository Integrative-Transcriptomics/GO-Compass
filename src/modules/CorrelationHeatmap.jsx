import React from 'react';
import PropTypes from 'prop-types';
import * as d3 from "d3";
import Axis from "./SimpleCharts/Axis";
import {inject, observer} from "mobx-react";


const CorrelationHeatmap = inject("dataStore", "visStore")(observer((props) => {
    const margins = {
        top: 20,
        right: 20,
        bottom: 60,
        left: 60,
    };
    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;

    const xScale = d3.scaleBand().range([0, width]).domain(props.dataStore.conditions).padding(0.01);
    const yScale = d3.scaleBand().range([0, height]).domain(props.dataStore.conditions).padding(0.01);
    const color = d3.scaleDiverging().domain([1, 0, -1]).interpolator(d3.interpolateRdBu);
    const rects = [];
    props.dataStore.correlation.forEach((row, i) =>
        row.forEach((cor, j) => {
            if(j>=i) {
                rects.push(<g key={props.dataStore.conditions[j] + props.dataStore.conditions[i]}>
                    <rect fill={color(cor)} x={xScale(props.dataStore.conditions[i])} y={yScale(props.dataStore.conditions[j])}
                          width={xScale.bandwidth()} height={yScale.bandwidth()}/>
                    <title>{cor}</title>
                </g>)
            }
        })
    );
    const xAxis = d3.axisBottom()
        .scale(xScale);
    const yAxis = d3.axisLeft()
        .scale(yScale);

    return (
        <svg height={props.height} width={props.width}>
            <g transform={"translate(" + margins.left + "," + margins.top + ")"}>
                <Axis h={height} w={width} axis={xAxis} axisType={'x'} label={'Condition'}/>
                <Axis h={height} w={width} axis={yAxis} axisType={'y'} label={'Condition'}/>
                {rects}
            </g>
        </svg>
    );
}));

CorrelationHeatmap.propTypes = {
    width: PropTypes.number.isRequired,
    height:PropTypes.number.isRequired,
};
export default CorrelationHeatmap;
