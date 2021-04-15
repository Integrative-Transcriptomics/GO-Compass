import React from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import BarChart from "./BarChart";


const MultiBarChart = inject("dataStore", "visStore")(observer((props) => {
    const margins = {
        top: 10,
        right: 5,
        bottom: props.visStore.maxConditionTextSize + 10,
        left: 60,
    };
    let max = 0;
    const filteredData = props.dataStore.nestedData.map(parent => {
        const containedChildren = parent.children.filter(child => {
            const maxChild = Math.max(...child.values)
            if (maxChild > max) {
                max = maxChild
            }
            return (props.visStore.childHighlights.length === 0
                || props.visStore.childHighlights.includes(child.id))
        })
        return {children: containedChildren, id: parent.id}
    }).filter(parent => parent.children.length > 0)
    const width = props.width - margins.left - margins.right;
    const height = (props.height - margins.top - margins.bottom) / filteredData.length;
    const xScale = d3.scaleBand().domain(props.dataStore.conditions).range([0, width]).padding(0.25);
    const barCharts = filteredData.map((parent, i) => {
        const dispValues = parent.children.map(d => props.dataStore.dataTable[d.id].dispensability)
        const minChild = parent.children[dispValues.indexOf(Math.min(...dispValues))]
        return (<g transform={'translate(0,' + i * height + ')'}>
            <BarChart width={props.width} height={height}
                      sigThreshold={props.sigThreshold}
                      logSigThreshold={props.logSigThreshold}
                      id={minChild.id}
                      parent={parent.id} name={minChild.name}
                      values={minChild.values} xScale={xScale}
                      fullAxis={i === filteredData.length - 1} maxY={max} scaleLocked={props.scaleLocked}/>
        </g>)
    })

    return (
        <div>
            <svg width={props.width}
                 height={props.height}>
                <g transform={'translate(0,' + margins.top + ')'}>
                    {barCharts}
                </g>
                <g>
                    <text transform={"translate(20,"+(props.height/2)+")rotate(270)"} textAnchor={"middle"}>-log10 p-value</text>
                </g>
            </svg>
        </div>
    );
}));

MultiBarChart.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    sigThreshold: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};
export default MultiBarChart;

