import React, {useState} from 'react';
import * as d3 from "d3";
import Axis from "./Axis";
import LineHighlighter from "./LineHighlighter";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";

const StreamGraph = inject("dataStore", "visStore")(observer((props) => {
    const [xPos, setXPos] = useState(0);
    const margins = {
        top: 20,
        right: 20,
        bottom: 40,
        left: 60,
    };
    const series = d3.stack()
        .keys(props.dataStore.clusterRepresentatives)
        (props.data);

    const area = d3.area()
        .x((d, i) => xScale(i))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]));

    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    const xScale = d3.scalePoint().domain([...Array(props.dataStore.conditions.length).keys()]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, d3.max(series, function (d) {
        return d3.max(d, function (d) {
            return d[1];
        });
    })]).range([height, 0]);
    let childHighlightPath = null;
    const paths = series.map((category) => {
            const isHighlighted = props.visStore.childHighlights.length === 0 | !props.visStore.showOverview;
            if (!props.visStore.showOverview && props.visStore.childHighlights.length !== 0
                && props.visStore.childHighlights.map(d => props.mapper.get(d).parent).includes(category.key)) {
                const childD = props.dataStore.conditions.map((tp, i) => {
                    const sum = d3.sum(props.visStore.childHighlights
                        .filter(d => props.mapper.get(d).parent === category.key)
                        .map(d => props.mapper.get(d).values[i]));
                    return [category[i][0], category[i][0] + sum]
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
        .tickFormat(d => props.dataStore.conditions[d]);
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
                <LineHighlighter width={width} height={height} xScale={xScale} xPos={xPos}
                                 duration={props.visStore.animationDuration}/>
            </g>
        </svg>
    );
}));
StreamGraph.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    mapper: PropTypes.instanceOf(Map).isRequired,
};


export default StreamGraph;

