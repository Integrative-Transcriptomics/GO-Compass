import React from 'react';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import Axis from "./../SimpleCharts/Axis";
import PropTypes from "prop-types";
import DraggableLine from "./DraggableLine";
import {getTextWidth, increase_brightness} from "../../UtilityFunctions";
import {v4 as uuidv4} from 'uuid'


const Tree = inject("dataStore", "visStore")(observer((props) => {
    const dispScale = d3.scaleLinear().domain([0, d3.max(Object.values(props.dataStore.dataTable)
        .map(d => d.dispensability))]).range([0, props.treeWidth]);
    const links = [];
    const clusterRects = [];
    const heatmapLines = [];
    const nodes = props.descendants.map(node => {
        const dispensability = props.dataStore.dataTable[node.data.name].dispensability;
        let fill;
        let linkColor;
        let fontWeight = "normal";
        if (dispensability < props.dataStore.clusterCutoff) {
            fill = props.visStore.termColorScale(node.data.name);
            clusterRects.push(<rect key={node.data.name} x={dispScale(node.x) - 4} y={node.y - 0.5 * props.stepsize}
                                    height={props.stepsize * props.dataStore.clusterChildren[node.data.name].length}
                                    width={props.width - dispScale(node.x) + 4}
                                    fill={increase_brightness(fill, 80)}/>)
            heatmapLines.push(<line key={node.data.name} x1={props.width}
                                    x2={props.width + props.heatmapWidth}
                                    y1={node.y - 0.5 * props.stepsize}
                                    y2={node.y - 0.5 * props.stepsize}
                                    stroke={"white"} strokeWidth={2}/>)
            if (node.parent !== null) {
                linkColor = props.visStore.termColorScale(node.parent.data.name);
            } else {
                linkColor = fill
            }
            fontWeight = "bold"
        } else {
            fill = props.visStore.termColorScale(props.dataStore.getFilterParent(node.data.name));
            linkColor = fill;
        }
        if (props.visStore.childHighlights.includes(node.data.name)) {
            fontWeight = "bold";
        }
        if (node.parent != null) {
            links.push(<line key={node.data.name + "1"} x1={dispScale(node.x)} y1={node.y}
                             x2={dispScale(node.parent.x)} y2={node.y}
                             strokeWidth={1} stroke={linkColor}/>);
            links.push(<line key={node.data.name + "2"} x1={dispScale(node.parent.x)} y1={node.y}
                             x2={dispScale(node.parent.x)} y2={node.parent.y}
                             strokeWidth={1} stroke={linkColor}/>);
        }

        return (<g key={node.data.name} onMouseEnter={() => props.visStore.setChildHighlight(node.data.name)}
                   onMouseLeave={() => props.visStore.setChildHighlight(null)}>
            <title>{props.dataStore.dataTable[node.data.name].description}</title>
            <line
                x1={dispScale(node.x) + getTextWidth(props.dataStore.dataTable[node.data.name].description, 10, fontWeight)}
                x2={props.width} y1={node.y} y2={node.y} strokeWidth={1} strokeDasharray="4 1"
                stroke={props.visStore.childHighlights.includes(node.data.name) ? "black" : "lightgray"}/>
            <line
                x1={dispScale(node.x) + getTextWidth(props.dataStore.dataTable[node.data.name].description, 10, fontWeight)}
                x2={props.width} y1={node.y} y2={node.y} strokeWidth={4} strokeDasharray="4 1"
                stroke="none"/>
            <text x={dispScale(node.x) + 3} y={node.y + 3} fill={"black"} fontSize={9}
                  fontWeight={fontWeight}>{props.dataStore.dataTable[node.data.name].description}</text>

        </g>)
    });
    const cutoffLine = <DraggableLine width={props.treeWidth} height={props.height} xPos={props.xPos}
                                      xScale={dispScale} mouseUp={props.dataStore.setClusterCutoff} duration={0}
                                      min={0}
                                      max={dispScale(props.dataStore.filterCutoff)}
                                      x={dispScale(props.dataStore.clusterCutoff)}
                                      mouseDown={props.mouseDown}
                                      text={"Cluster"}/>;
    const clusterLine = <DraggableLine width={props.treeWidth} height={props.height} xPos={props.xPos}
                                       xScale={dispScale} mouseUp={props.dataStore.setFilterCutoff} duration={0}
                                       min={dispScale(props.dataStore.clusterCutoff)}
                                       max={props.treeWidth}
                                       x={dispScale(props.dataStore.filterCutoff)}
                                       mouseDown={props.mouseDown}
                                       text={"Filter"}/>;

    const xAxis = d3.axisBottom()
        .scale(dispScale);
    const clipID = uuidv4();
    return (
        <g>
            <defs>
                <clipPath id={clipID}>
                    <rect x={-6} y={-10} width={props.width + 6} height={props.height + 10}/>
                </clipPath>
            </defs>
            <g clipPath={"url(#" + clipID + ")"}>
                <g>
                    {clusterRects}
                    {links}
                    {nodes}
                </g>
            </g>
            <Axis h={props.height} w={props.treeWidth} axis={xAxis} axisType={'x'} label={'Dispensability'}/>
            {cutoffLine}
            {clusterLine}
            {heatmapLines}
        </g>
    );
}));
Tree.propTypes = {
    width: PropTypes.number.isRequired,
    treeWidth: PropTypes.number.isRequired,
    stepsize: PropTypes.number.isRequired,
    heatmapWidth: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    xPos: PropTypes.number.isRequired,
    descendants: PropTypes.arrayOf(PropTypes.object).isRequired,
    mouseDown: PropTypes.bool.isRequired,
};

export default Tree;
