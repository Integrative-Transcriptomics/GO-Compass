import React from 'react';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import Axis from "./SimpleCharts/Axis";
import PropTypes from "prop-types";


const Tree = inject("dataStore", "visStore")(observer((props) => {
    const lengths = true;
    const margins = {
        top: 20,
        right: 20,
        bottom: 40,
        left: 20,
    };
    const height = props.height - margins.top - margins.bottom;
    let width = props.width - margins.left - margins.right;

    const root = d3.hierarchy(props.dataStore.filteredTree);
    const rectSize = height / root.descendants().filter(d => !("children" in d)).length;
    const treeWidth = width - props.dataStore.conditions.length * rectSize - 200;

    const dispScale = d3.scaleLinear().domain([0, 1]).range([0, treeWidth]);
    d3.cluster().size([height, treeWidth]).separation(function (a, b) {
        return 1;
    })(root);
    const descendants = root.descendants().filter(d => !("children" in d));
    const nodes = descendants.map(node => {
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
        if (!lengths) {
            y1 = node.y
        }
        return (<g key={node.data.name} onMouseEnter={() => props.visStore.setChildHighlight(node.data.name)}
                   onMouseLeave={() => props.visStore.setChildHighlight(null)}>
            <title>{props.dataStore.dataTable[node.data.name].description}</title>
            <line x1={node.x} x2={node.x} y1={y1} y2={treeWidth} strokeWidth={1} strokeDasharray="4 1"
                  stroke={strokeColor}/>
            <line x1={node.x} x2={node.x} y1={y1} y2={treeWidth} strokeWidth={4} strokeDasharray="4 1"
                  stroke="none"/>
            <circle cx={node.x} cy={y1} r={r} fill={fill} stroke="black"/>
            <circle cx={node.x} cy={y1} r={r+3} fill="none" />
        </g>)
    });
    const links = root.links().map((link, i) => {
        let y1 = dispScale(props.dataStore.dataTable[link.source.data.name].dispensability);
        let y2 = dispScale(props.dataStore.dataTable[link.target.data.name].dispensability);
        let stroke = "black";
        if (!lengths) {
            y1 = link.source.y;
            y2 = link.target.y;
        }
        if (props.dataStore.dataTable[link.target.data.name].dispensability > props.dataStore.clusterCutoff) {
            stroke = props.visStore.termColorScale(props.dataStore.getFilterParent(link.target.data.name))
        }
        return (<g key={i}>
            <line x1={link.source.x} y1={y1}
                  x2={link.target.x} y2={y2}
                  strokeWidth={1} stroke={stroke}/>
        </g>)
    });
    const cutoffLine = <line x1={0} x2={height} y1={dispScale(props.dataStore.filterCutoff)}
                             y2={dispScale(props.dataStore.filterCutoff)}
                             strokeWidth={1} stroke="black"/>;
    const clusterLine = <line x1={0} x2={height} y1={dispScale(props.dataStore.clusterCutoff)}
                              y2={dispScale(props.dataStore.clusterCutoff)}
                              strokeWidth={1} stroke="black"/>;

    const heatmapY = d3.scaleBand().domain(props.dataStore.conditions).range([0, props.dataStore.conditions.length * rectSize]);
    const max = d3.max(Object.keys(props.dataStore.dataTable).map(key => d3.max(props.dataStore.dataTable[key].pvalues)));
    const heatmapColor = d3.scaleLinear().domain([0, max]).range(["white", "red"]);
    const clusterCells = descendants.map(descendant => {
        return <rect key={descendant.data.name} x={descendant.x - 0.5 * rectSize} y={0} height={rectSize / 2}
                     width={rectSize}
                     fill={props.visStore.termColorScale(props.dataStore.getFilterParent(descendant.data.name))}/>
    });
    const heatmapCells = descendants.map(descendant => {
        let fontWeight = "normal";
        if (props.visStore.childHighlight === descendant.data.name) {
            fontWeight = "bold";
        }
        return <g key={descendant.data.name} onMouseEnter={() => props.visStore.setChildHighlight(descendant.data.name)}
                  onMouseLeave={() => props.visStore.setChildHighlight(null)}>{props.dataStore.conditions.map((condition, i) => {
            return (<g key={condition}
            >
                <rect x={descendant.x - 0.5 * rectSize} y={heatmapY(condition)} height={rectSize}
                      width={rectSize}
                      fill={heatmapColor(props.dataStore.dataTable[descendant.data.name]["pvalues"][i])}/>
                <title>{props.dataStore.dataTable[descendant.data.name].description}</title>
            </g>)
        })}
            <text transform={"translate(" + (height - rectSize / 2) + ",0)rotate(90)"} y={height - descendant.x}
                  x={props.dataStore.conditions.length * rectSize}
                  fontSize={10}
                  fontWeight={fontWeight}>{props.dataStore.dataTable[descendant.data.name].description}</text>
        </g>
    });
    const xAxis = d3.axisBottom()
        .scale(dispScale);
    return (
        <svg width={props.width} height={props.height}>
            <g transform={"translate(" + margins.left + "," + margins.top + ")"}>
                <g transform={"translate(" + 0 + "," + (height) + ")rotate(270)"}>
                <g>
                    {links}
                    {nodes}
                    {cutoffLine}
                    {clusterLine}
                </g>
                <g transform={"translate(0," + (treeWidth) + ")"}>
                    {clusterCells}
                </g>
                <g transform={"translate(0," + (treeWidth + rectSize) + ")"}>
                    {heatmapCells}
                </g>
            </g>
            <Axis h={height} w={width} axis={xAxis} axisType={'x'} label={'Dispensability'}/>
            </g>
        </svg>
    );
}));
Tree.propTypes = {
    width: PropTypes.number.isRequired,
    height:PropTypes.number.isRequired,
};

export default Tree;
