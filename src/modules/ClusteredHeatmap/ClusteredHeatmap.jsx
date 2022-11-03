import React, {useEffect, useState} from 'react';
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import Tree from "./Tree";
import Heatmap from "./Heatmap";


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
    const heatmapWidth = (props.dataStore.conditions.length + 1) * rectWidth + 1.5 * rectWidth;
    const treeWidth = width - heatmapWidth;
    //const stepsize = height / props.dataStore.currentGOterms.length;
    useEffect(()=>{
        props.visStore.setTreeStepSize(height / props.dataStore.currentGOterms.length);
    },[height, props.dataStore.currentGOterms.length, props.visStore])
    const descendants=props.visStore.treeLayout;
    if (descendants.length > 0) {
        return (
            <svg width={props.width} height={props.height} onMouseMove={(e) => setXPos(e.pageX)}
                 onMouseDown={() => setMouseDown(true)} onMouseUp={() => setMouseDown(false)}>
                <g transform={"translate(" + margins.left + "," + margins.top + ")"}>
                    <g transform={"translate(" + treeWidth + ",0)"}>
                        <Heatmap logSigThreshold={props.logSigThreshold}
                                 width={heatmapWidth} gapWidth={gapWidth}
                                 rectWidth={rectWidth} height={height}
                                 descendants={descendants}/>
                    </g>
                    <Tree width={treeWidth} treeWidth={treeWidth - gapWidth} stepsize={props.visStore.stepsize}
                          heatmapWidth={heatmapWidth} height={height}
                          descendants={descendants} xPos={xPos}
                          mouseDown={mouseDown}/>
                </g>
            </svg>
        );
    } else return null;
}));
ClusteredHeatmap.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};

export default ClusteredHeatmap;
