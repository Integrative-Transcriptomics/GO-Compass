import React, {useState} from 'react';
import * as d3 from "d3";
import Axis from "./Axis";
import LineHighlighter from "./LineHighlighter";
import {inject, observer} from "mobx-react";

const StreamGraph = inject("dataStore", "visStore")(observer((props) => {
    const [xPos, setXPos] = useState(0);
    const margins = {
        top: 20,
        right: 20,
        bottom: 40,
        left: 60,
    };
    const series = d3.stack()
        .keys(props.data.parents)
        (props.data.values);

    const area = d3.area()
        .x((d, i) => xScale(i))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]));

    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    const xScale = d3.scalePoint().domain([...Array(props.data.conditions.length).keys()]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, d3.max(series, function (d) {
        return d3.max(d, function (d) {
            return d[1];
        });
    })]).range([height, 0]);
    let childHighlightPath = null;
    const paths = series.map((category) => {
        const isHighlighted = ((props.visStore.parentHighlight === null | props.visStore.parentHighlight === category.key) & props.visStore.childHighlight === null) | !props.showOverview;
            if (!props.showOverview && props.visStore.childHighlight !== null && props.mapper.get(props.visStore.childHighlight).parent === category.key) {
                const childD = props.data.conditions.map((tp, i) => {
                    return [category[i][0], category[i][0] + props.mapper.get(props.visStore.childHighlight).values[i]]
                });
                childHighlightPath = <path fill={props.visStore.termColorScale(category.key)}
                                           d={area(childD)}/>
            }
            return <path onMouseEnter={() => props.visStore.setParentHighlight(category.key)}
                         onMouseLeave={() => props.visStore.setParentHighlight(null)}
                         key={category.key} fill={props.visStore.termColorScale(category.key)}
                         opacity={isHighlighted ? 1 : 0.5}
                         d={area(category)}/>
        }
    );
    const xAxis = d3.axisBottom()
        .scale(xScale)
        .tickFormat(d => props.data.conditions[d]);
    const yAxis = d3.axisLeft()
        .scale(yScale);
    return (
        <svg width={props.width}
             height={props.height}
             onMouseMove={(e) => setXPos(e.pageX)}>
            <g transform={'translate(' + margins.left + ',' + margins.top + ')'}>
                <Axis h={height} w={width} axis={xAxis} axisType={'x'} label={'Condition'}/>
                <Axis h={height} w={width} axis={yAxis} axisType={'y'} label={'-log10pVal'}/>
                {paths}
                {childHighlightPath}
                <LineHighlighter width={width} height={height} xScale={xScale} xPos={xPos} duration={props.visStore.animationDuration}/>
            </g>
        </svg>
    );
}));
StreamGraph.defaultProps = {
    width: 900,
    height: 350,
};


export default StreamGraph;

