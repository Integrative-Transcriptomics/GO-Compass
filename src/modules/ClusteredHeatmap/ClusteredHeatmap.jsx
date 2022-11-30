import React, {createRef, useEffect, useState} from 'react';
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import Tree from "./Tree";
import Heatmap from "./Heatmap";
import GradientLegend from "./GradientLegend";
import Axis from "../SimpleCharts/Axis";
import * as d3 from "d3";
import DraggableTriangle from "./DraggableTriangle";
import ScrollOverview from "./TreeOverview";
import {makeStyles} from "@material-ui/core";

const useStyles = makeStyles({
    scroll: {
        /* Hide scrollbar for Chrome, Safari and Opera */
        '&::-webkit-scrollbar': {
            display: "none",
        },
        /* Hide scrollbar for IE, Edge and Firefox */
        '-ms-overflow-style': "none", /* IE and Edge */
        'scrollbar-width': "none",  /* Firefox */
        paddingRight: 0,

    }
})
const ClusteredHeatmap = inject("dataStore", "visStore")(observer((props) => {
    const classes = useStyles();
    const [xPos, setXPos] = useState(0);
    const [mouseDown, setMouseDown] = useState(false);
    const [offset, setOffset] = useState(0);
    //const [innerWidth, setInnerWidth] = useState(props.width);

    const margins = {
        top: props.visStore.maxConditionTextSize*0.8 > 40 ? props.visStore.maxConditionTextSize*0.8 : 40,
        right: props.visStore.maxConditionTextSize*0.25,
        bottom: 40,
        left: 0,
    };
    const scrollableSVG = createRef();
    const scrollContainer = createRef();
    const innerWidth = props.width - props.visStore.scrollBarWidth;
    const height = props.height - margins.top - margins.bottom;
    let width = innerWidth - margins.left - margins.right;


    const overviewWidth = 40;
    const gapWidth = 100;
    const rectWidth = 10;
    const textHeight = 9;
    const heatmapWidth = (props.dataStore.conditions.length + 1) * rectWidth + 1.5 * rectWidth;
    const treeWidth = width - heatmapWidth - overviewWidth;
    const dispScale = d3.scaleLinear().domain([0, d3.max(Object.values(props.dataStore.dataTable)
        .map(d => d.dispensability))]).range([0, treeWidth - gapWidth]);
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
                  transform={"translate(" + (heatmapX(condition) + 2.5 * rectWidth) + "," + margins.top + ")rotate(300)"}>
                {condition}
            </text>);
        return (
            <div onMouseMove={(e) => setXPos(e.pageX)}
                 onMouseDown={() => setMouseDown(true)}
                 onMouseUp={() => setMouseDown(false)} id={props.id}>
                <svg width={innerWidth} height={margins.top}>
                    <g transform={"translate(" + (margins.left + overviewWidth) + ",0)"}>
                        <DraggableTriangle xPos={xPos}
                                           xScale={dispScale}
                                           mouseUp={props.dataStore.setClusterCutoff} duration={0}
                                           min={0}
                                           height={margins.top}
                                           max={dispScale(props.dataStore.filterCutoff)}
                                           x={dispScale(props.dataStore.clusterCutoff)}
                                           mouseDown={mouseDown}
                                           text={"Cluster (" + Object.keys(props.dataStore.clusterHierarchy).length + ")"}/>
                        <DraggableTriangle xPos={xPos}
                                           xScale={dispScale}
                                           mouseUp={props.dataStore.setFilterCutoff} duration={0}
                                           min={dispScale(props.dataStore.clusterCutoff)}
                                           height={margins.top}
                                           max={treeWidth - gapWidth}
                                           x={dispScale(props.dataStore.filterCutoff)}
                                           mouseDown={mouseDown}
                                           text={"Filter (" + props.dataStore.currentGOterms.length + ")"}/>
                        <g transform={"translate(" + treeWidth + ",0)"}>
                            {conditionLabels}
                        </g>
                    </g>
                </svg>
                <div>
                    <div style={{float: "left"}}>
                        <ScrollOverview length={height}
                                        breadth={overviewWidth}
                                        outerLength={height} innerLength={totalHeight}
                                        currentPosition={offset}
                                        orientation={"y"}
                                        pattern={props.visStore.parentSizes}
                                        colorScale={props.visStore.termColorScale}/>
                    </div>
                    <div className={classes.scroll} id={props.id + "_scroll"} style={{
                        overflowY: "scroll",
                        maxHeight: height, float: "left"
                    }} ref={scrollContainer}
                         onScroll={() => setOffset(scrollContainer.current.getBoundingClientRect().top
                             - scrollableSVG.current.getBoundingClientRect().top)}>
                        <svg width={innerWidth - overviewWidth} height={totalHeight} ref={scrollableSVG}>
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
                </div>
                <svg width={innerWidth} height={margins.bottom}>
                    <g transform={"translate(" + (margins.left + overviewWidth) + ",0)"}>
                        <Axis h={0} w={treeWidth} axis={xAxis} axisType={'x'} label={'Dispensability'}/>
                    </g>
                    <g transform={"translate(" + (innerWidth) + ",0)"}>
                        <GradientLegend range={heatmapRange} domain={heatmapDomain} label={"-log(pVal)"}
                                        align={"right"}/>
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
    id: PropTypes.string.isRequired,
};

export default ClusteredHeatmap;
