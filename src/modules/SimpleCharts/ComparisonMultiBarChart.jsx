import React from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import BarChart from "./ComparisonBarChart";

const MultiBarChart = inject("dataStore", "visStore")(observer((props) => {
    const margins = {
        top: 10,
        right: 5,
        bottom: 100,
        left: 60,
    };
    let max = 0;
    let conditions;
    if(props.visStore.selectedConditions.length>0){
        conditions=props.visStore.selectedConditions;
    } else{
        conditions=[...Array(props.dataStore.conditions.length).keys()]
    }
    const filteredData = conditions.map(condIndex => {
        return (props.dataStore.nestedData.map(parent => {
                return (parent.children.map(child => {
                    if(child.values[condIndex]>max){
                        max=child.values[condIndex];
                    }
                    return ({id: child.id, name: child.name, parent:parent.id,value:child.values[condIndex]})
                }))
            }).flat()
        ).flat()
    })
    const width = props.width - margins.left - margins.right;
    const gap=10;
    const height = ((props.height - margins.top - margins.bottom)-(filteredData.length-1)*gap) / filteredData.length;
    const xScale = d3.scaleBand().domain(props.visStore.treeOrder).range([0, width]).padding(0.25);
    const barCharts = conditions.map((condIndex,i)=>{
        const translateY=i===0? 0:i*(height+gap)
        return(<g key={props.dataStore.conditions[condIndex]} transform={'translate(0,' + translateY + ')'}>
            <BarChart width={props.width} height={height}
                      sigThreshold={props.sigThreshold}
                      logSigThreshold={props.logSigThreshold}
                      id={condIndex} values={filteredData[i]} xScale={xScale}
                      fullAxis={i === conditions.length - 1} maxY={max}
                      scaleLocked={props.scaleLocked}/>
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
                    <text transform={"translate(20," + (props.height / 2) + ")rotate(270)"} textAnchor={"middle"}>-log10
                        p-value
                    </text>
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

