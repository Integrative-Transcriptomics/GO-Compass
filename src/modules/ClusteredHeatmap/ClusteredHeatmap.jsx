import React, {useState} from 'react';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import Tree from "./Tree";
import Heatmap from "./Heatmap";
import calculateTreeLayout from "./RFLayout";


const ClusteredHeatmap = inject("dataStore", "visStore")(observer((props) => {
    const [xPos, setXPos] = useState(0);
    const [mouseDown, setMouseDown] = useState(false);

    const margins = {
        top: 40,
        right: 30,
        bottom: 40,
        left: 20,
    };
    const height = props.height - margins.top - margins.bottom;
    let width = props.width - margins.left - margins.right;

    const textWidth = 100;
    const rectWidth = 10;
    const heatmapWidth = textWidth + (props.dataStore.conditions.length + 1) * rectWidth;
    const treeWidth = width - heatmapWidth - rectWidth;
    const descendants = calculateTreeLayout(props.dataStore.filteredTree,height);


    return (
        <svg width={props.width} height={props.height} onMouseMove={(e) => setXPos(e.pageX)}
             onMouseDown={() => setMouseDown(true)} onMouseUp={() => setMouseDown(false)}>
            <g transform={"translate(" + margins.left + "," + margins.top + ")"}>
                <Tree width={treeWidth} height={height} descendants={descendants} xPos={xPos}
                      mouseDown={mouseDown}/>
                <g transform={"translate(" + (treeWidth + rectWidth) + ",0)"}>
                    <Heatmap width={heatmapWidth} textWidth={textWidth} rectWidth={rectWidth} height={height}
                             descendants={descendants}/>
                </g>
            </g>
        </svg>
    );
}));
ClusteredHeatmap.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
};

export default ClusteredHeatmap;