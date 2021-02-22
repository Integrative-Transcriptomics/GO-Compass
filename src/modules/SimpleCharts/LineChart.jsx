import React, {useState} from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import Axis from "./Axis";
import LineHighlighter from "./LineHighlighter";
import {inject, observer, useLocalStore} from "mobx-react";
import SignificanceLine from "./SignificanceLine";
import {action} from "mobx";


const LineChart = inject("dataStore", "visStore")(observer((props) => {
    const store = useLocalStore(() => ({
        localHighlight: false,
        setLocalHighlight: action((highlight)=>{
            store.localHighlight =highlight;
        }),
        get data() {
            const lineData = [];
            props.dataStore.nestedData.forEach(parent => {
                let add = false;
                const values = props.dataStore.conditions.map((d, i) => {
                    let current = 0;
                    parent.children.forEach(child => {
                        if (props.visStore.childHighlights.length === 0
                            || props.visStore.childHighlights.includes(child.id)
                            || store.localHighlight) {
                            add = true;
                            current += child.values[i];
                        }
                    });
                    return current;
                });
                if (add) {
                    lineData.push({id: parent.id, name: parent.name, values: values});
                }
            });
            return lineData;
        },
    }))
    const [xPos, setXPos] = useState(0);
    const margins = {
        top: 20,
        right: 20,
        bottom: 40,
        left: 60,
    };
    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    const max = d3.max(store.data.map(d => d3.max(d.values)));
    const xScale = d3.scalePoint().domain([...Array(props.dataStore.conditions.length).keys()]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, max]).range([height, 0]);
    let childHighlightLine = null;
    const lines = store.data.map(line => {
        const isHighlighted = props.visStore.childHighlights.length === 0;
        if (props.visStore.childHighlights.length !== 0
            && props.visStore.childHighlights.map(d => props.mapper.get(d).parent).includes(line.id)) {
            let childLineString = '';
            const values = props.dataStore.conditions.map((cond, i) => {
                return d3.sum(props.visStore.childHighlights
                    .filter(d => props.mapper.get(d).parent === line.id)
                    .map(d => props.mapper.get(d).values[i]))
            });
            values.forEach((value, i) => {
                childLineString += xScale(i) + ',' + yScale(value) + ' ';
            });
            childHighlightLine = <polyline fill='none'
                                           stroke={props.visStore.termColorScale(line.id)} strokeWidth={2}
                                           points={childLineString}
                                           onMouseLeave={() => {
                                               props.visStore.setParentHighlight(null)
                                               store.setLocalHighlight(false)
                                           }}
            />
        }
        let linestring = "";
        line.values.forEach((value, i) => {
            linestring += xScale(i) + ',' + yScale(value) + ' ';
        });
        return <g key={line.id}>
            <polyline
                onMouseEnter={() => {
                    props.visStore.setParentHighlight(line.id)
                    store.setLocalHighlight(true)
                }}
                fill='none'
                opacity={isHighlighted ? 1 : 0.3}
                stroke={props.visStore.termColorScale(line.id)} strokeWidth={2}
                points={linestring}/>
            {childHighlightLine}
        </g>
    });
    let sigLine = null;
    if (props.visStore.childHighlights.length === 1 && !store.localHighlight) {
        sigLine = <SignificanceLine width={width} height={yScale(-Math.log10(props.sigThreshold))}
                                    sigThreshold={props.sigThreshold}/>
    }
    const xAxis = d3.axisBottom()
        .scale(xScale)
        .tickFormat(d => props.dataStore.conditions[d]);
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
                {sigLine}
            </g>
        </svg>
    );
}));

LineChart.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    sigThreshold: PropTypes.number.isRequired,
};
export default LineChart;

