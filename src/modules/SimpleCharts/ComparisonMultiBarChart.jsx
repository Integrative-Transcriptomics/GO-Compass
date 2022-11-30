import React, {createRef, useState} from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import BarChart from "./ComparisonBarChart";
import Axis from "./Axis";

const MultiBarChart = inject("dataStore", "visStore")(observer((props) => {
    const [offset, setOffset] = useState(0)
    const margins = {
        top: 10,
        right: 40,
        bottom: 100,
        left: 60,
    };
    const condtitionsWidth = props.visStore.maxConditionTextSize*1.5;
    const scrollableSVG = createRef();
    const scrollContainer = createRef();
    let max = 0;
    let conditions;
    if (props.visStore.selectedConditions.length > 0) {
        conditions = props.visStore.selectedConditions;
    } else {
        conditions = [...Array(props.dataStore.conditions.length).keys()]
    }
    const filteredData = conditions.map(condIndex => {
        return (props.dataStore.nestedData.map(parent => {
                return (parent.children.map(child => {
                    if (child.values[condIndex] > max) {
                        max = child.values[condIndex];
                    }
                    return ({id: child.id, name: child.name, parent: parent.id, value: child.values[condIndex]})
                }))
            }).flat()
        ).flat()
    })

    let width = props.width - margins.left - margins.right;
    let innerWidth = width - props.visStore.scrollBarWidth - condtitionsWidth;
    const gap = 10;
    const height = ((props.height - margins.top - margins.bottom) - (filteredData.length - 1) * gap) / filteredData.length;
    let xScale = d3.scaleBand().domain(props.visStore.treeOrder).range([0, innerWidth]).padding(0.25);
    if (innerWidth / props.visStore.treeOrder.length < 10) {
        innerWidth = 10 * props.visStore.treeOrder.length;
        xScale = d3.scaleBand().domain(props.visStore.treeOrder).range([0, innerWidth]).padding(0.25);
    }
    let yScales = filteredData.map(cond => {
        return d3.scaleLinear().domain([0, props.scaleLocked ? max : d3.max(cond.map(d => d.value))]).range([height, 0]);
    })
    let barCharts = [];
    let labels = []
    let yAxes = []
    conditions.forEach((condIndex, i) => {
        const translateY = i === 0 ? 0 : i * (height + gap)
        const yAxis = d3.axisLeft()
            .scale(yScales[i]);
        yAxes.push(<g key={props.dataStore.conditions[condIndex]} transform={'translate(0,' + translateY + ')'}>
            <Axis h={height} w={0} axis={yAxis} axisType={'y'} label={''}/>
        </g>)
        barCharts.push(<g key={props.dataStore.conditions[condIndex]} transform={'translate(0,' + translateY + ')'}>
            <BarChart width={innerWidth + margins.right} height={height}
                      offset={offset}
                      sigThreshold={props.sigThreshold}
                      logSigThreshold={props.logSigThreshold}
                      id={condIndex} values={filteredData[i]} xScale={xScale}
                      fullAxis={i === conditions.length - 1} maxY={max}
                      scaleLocked={props.scaleLocked}/>
        </g>)
        labels.push(<g key={props.dataStore.conditions[condIndex]} transform={'translate(0,' + (translateY + 15) + ')'}>
            <text>{props.dataStore.conditions[condIndex]}</text>
        </g>)
    })

    return (
        <div id={props.id} style={{height: props.height}}>
            <svg width={margins.left} height={props.height} style={{float: "left"}}>
                <text transform={"translate(20," + ((props.height - margins.bottom) / 2) + ")rotate(270)"}
                      textAnchor={"middle"}>-log(pVal)
                </text>
                <g transform={"translate(" + margins.left + "," + margins.top + ")"}>
                    {yAxes}
                </g>
            </svg>
            <div style={{
                overflowX: "scroll",
                maxWidth: props.width - margins.left - props.visStore.scrollBarWidth - condtitionsWidth,
                float: "left"
            }}
                 ref={scrollContainer}
                 onScroll={() => setOffset(scrollContainer.current.getBoundingClientRect().left
                     - scrollableSVG.current.getBoundingClientRect().left)}>
                <svg width={innerWidth + margins.right}
                     height={props.height} ref={scrollableSVG}>
                    <g transform={'translate(0,' + margins.top + ')'}>
                        {barCharts}
                    </g>
                </svg>
            </div>
            <svg width={condtitionsWidth} height={props.height} style={{float: "left"}}>
                <g transform={"translate(0," + margins.top + ")"}>
                    {labels}
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
    id: PropTypes.string.isRequired,
};
export default MultiBarChart;

