import React, {useState} from 'react';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import Axis from "./../SimpleCharts/Axis";
import PropTypes from "prop-types";
import DraggableLine from "./DraggableLine";


const Tree = inject("dataStore", "visStore")(observer((props) => {
    const dispScale = d3.scaleLinear().domain([0, d3.max(Object.values(props.dataStore.dataTable)
        .map(d => d.dispensability))]).range([0, props.width]);
    const links2 = [];
    const nodes = props.descendants.map(node => {
        const dispensability = props.dataStore.dataTable[node.data.name].dispensability;
        let fill;
        let r = 2;
        let strokeColor = "lightgray";
        if (dispensability < props.dataStore.clusterCutoff) {
            fill = props.visStore.termColorScale(node.data.name);
            strokeColor = fill;
            r = 4;
        } else {
            fill = props.visStore.termColorScale(props.dataStore.getFilterParent(node.data.name))
        }
        if (props.visStore.childHighlight === node.data.name) {
            strokeColor = "black";
        }


        if (node.parent != null) {
            links2.push(<line x1={dispScale(node.x)} y1={node.y}
                              x2={dispScale(node.parent.x)} y2={node.parent.y}
                              strokeWidth={1} stroke={"black"}/>);
        }

        return (<g key={node.data.name} onMouseEnter={() => props.visStore.setChildHighlight(node.data.name)}
                   onMouseLeave={() => props.visStore.setChildHighlight(null)}>
            <title>{props.dataStore.dataTable[node.data.name].description}</title>
            <line x1={dispScale(node.x)} x2={props.width} y1={node.y} y2={node.y} strokeWidth={1} strokeDasharray="4 1"
                  stroke={strokeColor}/>
            <line x1={dispScale(node.x)} x2={props.width} y1={node.y} y2={node.y} strokeWidth={4} strokeDasharray="4 1"
                  stroke="none"/>
            <circle cx={dispScale(node.x)} cy={node.y} r={r} fill={fill} stroke="black"/>
            <circle cx={dispScale(node.x)} cy={node.y} r={r + 3} fill="none"/>
        </g>)
    });
    const cutoffLine = <DraggableLine width={props.width} height={props.height} xPos={props.xPos}
                                      xScale={dispScale} mouseUp={props.dataStore.setClusterCutoff} duration={0}
                                      min={0}
                                      max={dispScale(props.dataStore.filterCutoff)}
                                      x={dispScale(props.dataStore.clusterCutoff)}
                                      mouseDown={props.mouseDown}/>;
    const clusterLine = <DraggableLine width={props.width} height={props.height} xPos={props.xPos}
                                       xScale={dispScale} mouseUp={props.dataStore.setFilterCutoff} duration={0}
                                       min={dispScale(props.dataStore.clusterCutoff)}
                                       max={props.width}
                                       x={dispScale(props.dataStore.filterCutoff)}
                                       mouseDown={props.mouseDown}/>;

    const xAxis = d3.axisBottom()
        .scale(dispScale);
    return (
        <g>
            <g >
                <g>
                    {links2}
                    {nodes}
                </g>
            </g>
            <Axis h={props.height} w={props.width} axis={xAxis} axisType={'x'} label={'Dispensability'}/>
            {cutoffLine}
            {clusterLine}
        </g>
    );
}));
Tree.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    descendants: PropTypes.arrayOf(PropTypes.object).isRequired,
    links: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Tree;
