import React from 'react';
import PropTypes from 'prop-types';
import * as d3 from "d3";
import Axis from "./SimpleCharts/Axis";
import {inject, observer} from "mobx-react";
import GradientLegend from "./ClusteredHeatmap/GradientLegend";


const CorrelationHeatmap = inject("dataStore", "visStore")(observer((props) => {
    const margins = {
        top: 20,
        right: 20,
        bottom: props.visStore.maxConditionTextSize + 10,
        left: props.visStore.maxConditionTextSize + 20,
    };
    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;

    const xScale = d3.scaleBand().range([0, width]).domain(props.dataStore.conditions).padding(0.01);
    const yScale = d3.scaleBand().range([0, height]).domain(props.dataStore.conditions).padding(0.01);
    const color = d3.scaleLinear().domain([-1, 0, 1]).range(["blue", "white", "red"]);
    const rects = [];
    props.dataStore.correlation.forEach((row, i) => row.forEach((cor, j) => {
        if (j >= i) {
            rects.push(<g key={props.dataStore.conditions[j] + props.dataStore.conditions[i]}
                          onClick={() => props.visStore.setLockedSelection([j, i])}
                          onMouseEnter={() => {
                              props.visStore.selectConditions([j, i])
                          }}
                          onMouseLeave={() => {
                              props.visStore.selectConditions([])
                          }}
                          transform={"translate(" + xScale(props.dataStore.conditions[i]) + "," + yScale(props.dataStore.conditions[j]) + ")"}>
                <rect fill={color(cor)} width={xScale.bandwidth()} height={yScale.bandwidth()}/>
                {props.visStore.selectionLocked && props.visStore.selectedConditions.toString() === [...new Set([j, i])].toString() ?
                    <path
                        d={"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"}/> : null}
                <title>{cor}</title>
            </g>)
        }
    }));
    const xAxis = d3.axisBottom()
        .scale(xScale);
    const yAxis = d3.axisLeft()
        .scale(yScale);

    return (<div id={props.id}>
        <svg height={props.height} width={props.width}>
            <g transform={"translate(" + margins.left + "," + margins.top + ")"}>
                <Axis h={height} w={width} axis={xAxis} axisType={'x'} label={''} rotate={true}/>
                <Axis h={height} w={width} axis={yAxis} axisType={'y'} label={''}/>
                {rects}
            </g>
            <g transform={"translate(" + (props.width - margins.right - 100) + "," + margins.top + ")"}>
                <GradientLegend range={color.domain().map(d => color(d))} domain={color.domain()}
                                label={"P-value correlation"}/>
            </g>
        </svg>
    </div>);
}));

CorrelationHeatmap.propTypes = {
    width: PropTypes.number.isRequired, height: PropTypes.number.isRequired,
    id: PropTypes.string.isRequired,
};
export default CorrelationHeatmap;
