import React, {useState} from 'react';
import * as d3 from "d3";
import Axis from "./Axis";
import LineHighlighter from "./LineHighlighter";
import {inject, observer, useLocalStore} from "mobx-react";
import PropTypes from "prop-types";
import {action} from "mobx";

const StreamGraph = inject("dataStore", "visStore")(observer((props) => {
    const store = useLocalStore(() => ({
        localHighlight: false,
        setLocalHighlight: action((highlight) => {
            store.localHighlight = highlight;
        }),
        get data() {
            const stackedChildren = props.dataStore.conditions.map((d, i) => {
                const tpData = {};
                props.dataStore.nestedData.forEach(parent => {
                    if (props.visStore.childHighlights.length < 2 || this.localHighlight) {
                        tpData[parent.id] = d3.sum(parent.children.map(child => child.values[i]));
                    } else {
                        tpData[parent.id] = d3.sum(parent.children
                            .filter(child => props.visStore.childHighlights.includes(child.id))
                            .map(child => child.values[i]));
                    }
                });
                return tpData
            });
            return stackedChildren;
        },
    }));
    const [xPos, setXPos] = useState(0);
    const margins = {
        top: 20,
        right: 20,
        bottom: 40,
        left: 60,
    };
    const series = d3.stack()
        .keys(props.dataStore.clusterRepresentatives)
        (store.data);

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
            const isHighlighted = props.visStore.childHighlights.length === 0;
            if (props.visStore.childHighlights.length !== 0
                && props.visStore.childHighlights.map(d => props.mapper.get(d).parent).includes(category.key)) {
                const childD = props.dataStore.conditions.map((tp, i) => {
                    const sum = d3.sum(props.visStore.childHighlights
                        .filter(d => props.mapper.get(d).parent === category.key)
                        .map(d => props.mapper.get(d).values[i]));
                    return [category[i][0], category[i][0] + sum]
                });
                childHighlightPath = <path onMouseLeave={() => {
                    props.visStore.setParentHighlight(null)
                }}
                                           fill={props.visStore.termColorScale(category.key)}
                                           d={area(childD)}/>
            }
            return <g key={category.key}>
                <path onMouseEnter={() => {
                    props.visStore.setParentHighlight(category.key)
                    store.setLocalHighlight(true)
                }}
                      fill={props.visStore.termColorScale(category.key)}
                      opacity={isHighlighted ? 1 : 0.5}
                      d={area(category)}/>
                {childHighlightPath}
            </g>
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
             onMouseMove={(e) => setXPos(e.pageX)}
             onMouseLeave={() => {
                 store.setLocalHighlight(false)
             }}>
            <g transform={'translate(' + margins.left + ',' + margins.top + ')'}>
                <Axis h={height} w={width} axis={xAxis} axisType={'x'} label={'Condition'}/>
                <Axis h={height} w={width} axis={yAxis} axisType={'y'} label={'-log10pVal'}/>
                {paths}
                <LineHighlighter width={width} height={height} xScale={xScale} xPos={xPos}
                                 duration={props.visStore.animationDuration}/>
            </g>
        </svg>
    );
}));
StreamGraph.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    mapper: PropTypes.instanceOf(Map).isRequired,
};


export default StreamGraph;

