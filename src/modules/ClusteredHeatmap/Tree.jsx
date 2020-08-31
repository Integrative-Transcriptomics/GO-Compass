import React, {useState} from 'react';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import Axis from "./../SimpleCharts/Axis";
import PropTypes from "prop-types";
import DraggableLine from "./DraggableLine";


const Tree = inject("dataStore", "visStore")(observer((props) => {
    const dispScale = d3.scaleLinear().domain([0, d3.max(Object.values(props.dataStore.dataTable)
        .map(d => d.dispensability))]).range([0, props.width]);
    const nodes = props.descendants.map(node => {
        const dispensability = props.dataStore.dataTable[node.data.name].dispensability;
        let fill;
        let r = 2;
        if (props.dataStore.dataTable[node.data.name].dispensability < props.dataStore.clusterCutoff) {
            fill = props.visStore.termColorScale(node.data.name);
            r = 4;
        } else {
            fill = props.visStore.termColorScale(props.dataStore.getFilterParent(node.data.name))
        }
        let strokeColor = "lightgray";
        if (props.visStore.childHighlight === node.data.name) {
            strokeColor = "black";
        }
        let y1 = dispScale(dispensability);
        return (<g key={node.data.name} onMouseEnter={() => props.visStore.setChildHighlight(node.data.name)}
                   onMouseLeave={() => props.visStore.setChildHighlight(null)}>
            <title>{props.dataStore.dataTable[node.data.name].description}</title>
            <line x1={node.x} x2={node.x} y1={y1} y2={props.width} strokeWidth={1} strokeDasharray="4 1"
                  stroke={strokeColor}/>
            <line x1={node.x} x2={node.x} y1={y1} y2={props.width} strokeWidth={4} strokeDasharray="4 1"
                  stroke="none"/>
            <circle cx={node.x} cy={y1} r={r} fill={fill} stroke="black"/>
            <circle cx={node.x} cy={y1} r={r + 3} fill="none"/>
        </g>)
    });
    const links = props.links.map((link, i) => {
        let y1 = dispScale(props.dataStore.dataTable[link.source.data.name].dispensability);
        let y2 = dispScale(props.dataStore.dataTable[link.target.data.name].dispensability);
        let stroke = "black";
        if (props.dataStore.dataTable[link.target.data.name].dispensability > props.dataStore.clusterCutoff) {
            stroke = props.visStore.termColorScale(props.dataStore.getFilterParent(link.target.data.name))
        }
        return (<g key={i}>
            <line x1={link.source.x} y1={y1}
                  x2={link.target.x} y2={y2}
                  strokeWidth={1} stroke={stroke}/>
        </g>)
    });
    const cutoffLine = <DraggableLine width={props.width} height={props.height} xPos={props.xPos}
                                      xScale={dispScale} mouseUp={props.dataStore.setClusterCutoff} duration={0}
                                      x={dispScale(props.dataStore.clusterCutoff)}/>;
    const clusterLine = <DraggableLine width={props.width} height={props.height} xPos={props.xPos}
                                       xScale={dispScale} mouseUp={props.dataStore.setFilterCutoff} duration={0}
                                       x={dispScale(props.dataStore.filterCutoff)}/>;

    const xAxis = d3.axisBottom()
        .scale(dispScale);
    return (
        <g>
            <g transform={"translate(" + 0 + "," + (props.height) + ")rotate(270)"}>
                <g>
                    {links}
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
