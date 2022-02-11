import React, {useEffect, useState} from 'react';
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import Tree from "./Tree";
import Heatmap from "./Heatmap";
import calculateTreeLayout from "./RFLayout";


const ClusteredHeatmap = inject("dataStore", "visStore")(observer((props) => {
    const [xPos, setXPos] = useState(0);
    const [mouseDown, setMouseDown] = useState(false);
    const [descendants, setDescendants] = useState([]);

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
    const heatmapWidth = (props.dataStore.conditions.length + 1) * rectWidth+1.5*rectWidth;
    const treeWidth = width - heatmapWidth;
    useEffect(() => {
        setDescendants(calculateTreeLayout(props.dataStore.filteredTree, height));
    }, [props.dataStore.filteredTree, height]);
    if (descendants.length > 0) {
        return (
            <svg width={props.width} height={props.height} onMouseMove={(e) => setXPos(e.pageX)}
                 onMouseDown={() => setMouseDown(true)} onMouseUp={() => setMouseDown(false)}>
                <g transform={"translate(" + margins.left + "," + margins.top + ")"}>
                    <Tree width={treeWidth} treeWidth={treeWidth-gapWidth} height={height} descendants={descendants} xPos={xPos}
                          mouseDown={mouseDown}/>
                    <g transform={"translate(" + treeWidth + ",0)"}>
                        <Heatmap width={heatmapWidth} gapWidth={gapWidth} rectWidth={rectWidth} height={height}
                                 descendants={descendants}/>
                    </g>
                </g>
            </svg>
        );
    } else return null;
}));
ClusteredHeatmap.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
};

export default ClusteredHeatmap;
