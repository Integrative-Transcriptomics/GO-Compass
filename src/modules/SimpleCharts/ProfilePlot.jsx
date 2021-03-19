import React, {useState} from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import Axis from "./Axis";
import LineHighlighter from "./LineHighlighter";
import {inject, observer, useLocalStore} from "mobx-react";
import SignificanceLine from "./SignificanceLine";


const ProfilePlot = inject("dataStore", "visStore")(observer((props) => {
    const store = useLocalStore(() => ({
        get data() {
            const lineData = Object.keys(props.dataStore.dataTable).filter(key => {
                return (props.dataStore.dataTable[key].dispensability < props.dataStore.filterCutoff)
            }).map(key => {
                const values = props.dataStore.conditions.map((cond, i) => props.dataStore.dataTable[key].pvalues[i])
                return ({id: key, name: props.dataStore.dataTable[key].description, values: values})
            })
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
        const isHighlighted = props.visStore.childHighlights.includes(line.id)
        let linestring = "";
        line.values.forEach((value, i) => {
            linestring += xScale(i) + ',' + yScale(value) + ' ';
        });
        return <g key={line.id}>
            <polyline
                onMouseEnter={() => {
                    props.visStore.setChildHighlight(line.id)
                }}
                fill='none'
                opacity={isHighlighted ? 1 : 0.5}
                stroke={props.visStore.termColorScale(props.dataStore.getFilterParent(line.id))} strokeWidth={1}
                points={linestring}/>
            {childHighlightLine}
        </g>
    });
    let sigLine = <SignificanceLine width={width} height={yScale(props.logSigThreshold)}
                                    sigThreshold={props.sigThreshold}/>
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

ProfilePlot.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    sigThreshold: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};
export default ProfilePlot;

