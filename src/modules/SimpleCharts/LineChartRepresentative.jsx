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
            setLocalHighlight: action((highlight) => {
                store.localHighlight = highlight;
            }),
            get globalMax() {
                return Math.max(...props.dataStore.nestedData
                    .map(parent => Math.max(...parent.children
                        .map(child => Math.max(...child.values)))))
            },
            get data() {
                const lineData = []
                props.dataStore.nestedData.forEach(parent => {
                    const containedChildren = parent.children.filter(child => props.visStore.childHighlights.length === 0
                        || props.visStore.childHighlights.includes(child.id)
                        || store.localHighlight)
                    if (containedChildren.length > 0) {
                        const dispValues = containedChildren.map(d => props.dataStore.dataTable[d.id].dispensability)
                        const minChild = containedChildren[dispValues.indexOf(Math.min(...dispValues))]
                        lineData.push({id: minChild.id, parent: parent.id, name: minChild.name, values: minChild.values});
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
        let yScale = d3.scaleLinear().domain([0, max]).range([height, 0]);
        if (props.scaleLocked) {
            yScale = d3.scaleLinear().domain([0, store.globalMax]).range([height, 0]);
        }
        const lines = store.data.map(line => {
            const isHighlighted = props.visStore.childHighlights.length === 0 || props.visStore.childHighlights.includes(line.id);
            let linestring = "";
            line.values.forEach((value, i) => {
                linestring += xScale(i) + ',' + yScale(value) + ' ';
            });
            return <g key={line.id}>
                <polyline
                    onMouseEnter={() => {
                        props.visStore.setChildHighlight(line.id)
                        store.setLocalHighlight(true)
                    }}
                    onMouseLeave={() => {
                        props.visStore.setChildHighlight(null)
                        store.setLocalHighlight(false)
                    }}
                    fill='none'
                    opacity={isHighlighted ? 1 : 0.5}
                    stroke={props.visStore.termColorScale(line.parent)} strokeWidth={2}
                    points={linestring}/>
            </g>
        });
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
                    <SignificanceLine width={width} height={yScale(props.logSigThreshold)}
                                      sigThreshold={props.sigThreshold}/>
                </g>
            </svg>
        );
    }))
;

LineChart.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    sigThreshold: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};
export default LineChart;

