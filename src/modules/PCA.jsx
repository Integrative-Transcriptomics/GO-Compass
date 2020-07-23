import React from 'react';
import PropTypes from 'prop-types';
import * as d3 from "d3";
import Axis from "./SimpleCharts/Axis";
import {inject, observer} from "mobx-react";


const PCA = inject("dataStore", "visStore")(observer((props) => {
    const margins = {
        top: 20,
        right: 60,
        bottom: 60,
        left: 60,
    };
    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;


    const xScale = d3.scaleLinear().range([0, width]).domain([Math.floor(d3.min(props.dataStore.pca.coords.map(d => d.PC1)))
        , Math.ceil(d3.max(props.dataStore.pca.coords.map(d => d.PC1)))]);
    const yScale = d3.scaleLinear().range([0, height]).domain([Math.floor(d3.min(props.dataStore.pca.coords.map(d => d.PC2)))
        , Math.ceil(d3.max(props.dataStore.pca.coords.map(d => d.PC2)))]);

    const points = props.dataStore.pca.coords.map((d, i) => <g key={props.dataStore.conditions[i]}
                                                               transform={"translate(" + xScale(d.PC1) + "," + yScale(d.PC2) + ")"}>
        <circle r={2}/>
        <text x={2}>{props.dataStore.conditions[i]}</text>
    </g>);
    const xAxis = d3.axisBottom()
        .scale(xScale);
    const yAxis = d3.axisLeft()
        .scale(yScale);

    return (
        <svg height={props.height} width={props.width}>
            <g transform={"translate(" + margins.left + "," + margins.top + ")"}>
                <Axis h={height} w={width} axis={xAxis} axisType={'x'}
                      label={'PC1 (' + props.dataStore.pca.percentage[0] + "%)"}/>
                <Axis h={height} w={width} axis={yAxis} axisType={'y'}
                      label={'PC2( ' + props.dataStore.pca.percentage[1] + "%)"}/>
                {points}
            </g>
        </svg>
    );
}));

PCA.propTypes = {
    width: PropTypes.number.isRequired,
    height:PropTypes.number.isRequired,
};
export default PCA;
