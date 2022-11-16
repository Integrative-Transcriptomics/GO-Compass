import React, {useEffect, useState} from 'react';
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import Tree from "./Tree";
import Heatmap from "./Heatmap";
import GradientLegend from "./GradientLegend";
import Axis from "../SimpleCharts/Axis";
import * as d3 from "d3";
import DraggableTriangle from "./DraggableTriangle";


const ClusteredHeatmap = inject("dataStore", "visStore")(observer((props) => {
    const [xPos, setXPos] = useState(0);
    const [mouseDown, setMouseDown] = useState(false);

    const margins = {
        top: props.visStore.maxConditionTextSize > 40 ? props.visStore.maxConditionTextSize : 40,
        right: 30,
        bottom: 40,
        left: 20,
    };
    const height = props.height - margins.top - margins.bottom;
    let width = props.width - margins.left - margins.right;


    const gapWidth = 100;
    const rectWidth = 10;
    const textHeight = 9;
    const heatmapWidth = (props.dataStore.conditions.length + 1) * rectWidth + 1.5 * rectWidth;
    const treeWidth = width - heatmapWidth;
    const dispScale = d3.scaleLinear().domain([0, d3.max(Object.values(props.dataStore.dataTable)
        .map(d => d.dispensability))]).range([0, treeWidth-gapWidth]);
    const xAxis = d3.axisBottom()
        .scale(dispScale);
    const heatmapRange = ["white", "red"];
    const maxP = d3.max(Object.keys(props.dataStore.dataTable).map(key => d3.max(props.dataStore.dataTable[key].pvalues)));
    const heatmapDomain = [0, maxP];
    //const stepsize = height / props.dataStore.currentGOterms.length;
    useEffect(() => {
        let stepsize = height / props.dataStore.currentGOterms.length
        if (stepsize < 10) {
            stepsize = 10
        }
        props.visStore.setTreeStepSize(stepsize);
    }, [height, props.dataStore.currentGOterms.length, props.visStore])
    const totalHeight = props.visStore.stepsize * props.dataStore.currentGOterms.length;
    const descendants = props.visStore.treeLayout;
    if (descendants.length > 0) {
        const heatmapX = d3.scaleBand().domain(props.dataStore.conditions).range([0, props.dataStore.conditions.length * rectWidth]);
        const conditionLabels = props.dataStore.conditions.map(condition =>
            <text key={condition} fontSize={textHeight}
                  transform={"translate(" + (heatmapX(condition) + 2.5*rectWidth) + ","+margins.top+")rotate(300)"}>
                {condition}
            </text>);
        return (
            <div onMouseMove={(e) => setXPos(e.pageX)}
                 onMouseDown={() => setMouseDown(true)}
                 onMouseUp={() => setMouseDown(false)}>
                <svg width={props.width} height={margins.top}>
                    <g transform={"translate(" + margins.left + ",0)"}>
                        <DraggableTriangle xPos={xPos}
                                           xScale={dispScale}
                                           mouseUp={props.dataStore.setClusterCutoff} duration={0}
                                           min={0}
                                           height={margins.top}
                                           max={dispScale(props.dataStore.filterCutoff)}
                                           x={dispScale(props.dataStore.clusterCutoff)}
                                           mouseDown={mouseDown}
                                           text={"Cluster"}/>
                        <DraggableTriangle xPos={xPos}
                                           xScale={dispScale}
                                           mouseUp={props.dataStore.setFilterCutoff} duration={0}
                                           min={dispScale(props.dataStore.clusterCutoff)}
                                           height={margins.top}
                                           max={treeWidth}
                                           x={dispScale(props.dataStore.filterCutoff)}
                                           mouseDown={mouseDown}
                                           text={"Filter"}/>
                        <g transform={"translate(" + treeWidth + ",0)"}>
                            {conditionLabels}
                        </g>
                    </g>
                </svg>
                <div style={{overflowY: "scroll", maxHeight: height}}>
                    <svg width={props.width} height={totalHeight}>
                        <g transform={"translate(" + margins.left + ",0)"}>
                            <g transform={"translate(" + treeWidth + ",0)"}>
                                <Heatmap logSigThreshold={props.logSigThreshold}
                                         heatmapX={heatmapX}
                                         range={heatmapRange}
                                         domain={heatmapDomain}
                                         width={heatmapWidth}
                                         rectWidth={rectWidth}
                                         height={totalHeight}
                                         descendants={descendants}/>
                            </g>
                            <Tree width={treeWidth}
                                  stepsize={props.visStore.stepsize}
                                  heatmapWidth={heatmapWidth}
                                  gapWidth={gapWidth}
                                  height={totalHeight}
                                  dispScale={dispScale}
                                  descendants={descendants}
                                  xPos={xPos}
                                  mouseDown={mouseDown}/>
                        </g>
                    </svg>
                </div>
                <svg width={props.width} height={margins.bottom}>
                    <g transform={"translate(" + margins.left + ",0)"}>
                        <Axis h={0} w={treeWidth} axis={xAxis} axisType={'x'} label={'Dispensability'}/>
                        <g transform={"translate(" + treeWidth + ",0)"}>
                            <GradientLegend range={heatmapRange} domain={heatmapDomain} label={"-log10(pVal)"}/>
                        </g>
                    </g>
                </svg>
            </div>
        );
    } else return null;
}));
ClusteredHeatmap.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};

export default ClusteredHeatmap;
