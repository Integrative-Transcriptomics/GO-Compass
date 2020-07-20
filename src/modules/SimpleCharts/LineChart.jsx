import React, {useState} from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import Axis from "./Axis";
import LineHighlighter from "./LineHighlighter";
import {inject, observer} from "mobx-react";


const LineChart = inject("dataStore", "visStore")(observer((props) => {
    const [xPos, setXPos] = useState(0);
    const margins = {
        top: 20,
        right: 20,
        bottom: 40,
        left: 60,
    };
    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    const max = d3.max(props.data.children.map(d => d3.max(d.values)));
    const xScale = d3.scalePoint().domain([...Array(props.data.keys.length).keys()]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, max]).range([height, 0]);
    let childHighlightLine = null;
    const lines = props.data.children.map(line => {
        const isHighlighted = ((props.visStore.parentHighlight === null | props.visStore.parentHighlight === line.id) & props.visStore.childHighlight === null) | !props.showOverview;
        if (props.showOverview && props.visStore.childHighlight !== null && props.mapper.get(props.visStore.childHighlight).parent === line.id) {
            let childLineString = '';
            props.mapper.get(props.visStore.childHighlight).values.forEach((value, i) => {
                childLineString += xScale(i) + ',' + yScale(value) + ' ';
            });
            childHighlightLine = <polyline fill='none'
                                           stroke={props.visStore.termColorScale(line.id)} strokeWidth={2}
                                           points={childLineString}/>
        }
        let linestring = "";
        line.values.forEach((value, i) => {
            linestring += xScale(i) + ',' + yScale(value) + ' ';
        });
        return <polyline onMouseEnter={() => props.visStore.setParentHighlight(line.id)}
                         onMouseLeave={() => props.visStore.setParentHighlight(null)}
                         fill='none'
                         opacity={isHighlighted ? 1 : 0.3}
                         stroke={props.visStore.termColorScale(line.id)} strokeWidth={2} key={line.id} points={linestring}/>
    });
    let sigLine = null;
    if (!props.showOverview && props.visStore.childHighlight !== null) {
        sigLine = <line x1={0} x2={width} y1={yScale(-Math.log10(props.visStore.sigThreshold))}
                        y2={yScale(-Math.log10(props.visStore.sigThreshold))}
                        fill="none" stroke="black" strokeDasharray="4"/>
    }
    const xAxis = d3.axisBottom()
        .scale(xScale)
        .tickFormat(d => props.data.keys[d]);
    const yAxis = d3.axisLeft()
        .scale(yScale);
    return (
        <svg onMouseMove={(e) => setXPos(e.pageX)} width={props.width}
             height={props.height}>
            <g transform={'translate(' + margins.left + ',' + margins.top + ')'}>
                <Axis h={height} w={width} axis={xAxis} axisType={'x'} label={'Condition'}/>
                <Axis h={height} w={width} axis={yAxis} axisType={'y'} label={'-log10pVal'}/>
                {lines}
                <LineHighlighter width={width} height={height} xScale={xScale} xPos={xPos} i
                                 duration={props.visStore.animationDuration}/>
                {childHighlightLine}
                {sigLine}
            </g>
        </svg>
    );
}));

LineChart.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    data: PropTypes.objectOf(PropTypes.array),
};
LineChart.defaultProps = {
    width: 900,
    height: 350,
};
export default LineChart;

