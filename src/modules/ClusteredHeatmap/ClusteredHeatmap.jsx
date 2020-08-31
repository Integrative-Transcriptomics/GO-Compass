import React, {useState} from 'react';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import Tree from "./Tree";
import Heatmap from "./Heatmap";


const ClusteredHeatmap = inject("dataStore", "visStore")(observer((props) => {
    const [xPos, setXPos] = useState(0);
    const margins = {
        top: 40,
        right: 30,
        bottom: 40,
        left: 20,
    };
    const height = props.height - margins.top - margins.bottom;
    let width = props.width - margins.left - margins.right;

    const root = d3.hierarchy(props.dataStore.filteredTree);
    const textWidth = 100;
    const rectWidth = 10;
    const heatmapWidth = textWidth + (props.dataStore.conditions.length+1)*rectWidth;
    const treeWidth = width- heatmapWidth;

    d3.cluster().size([height, treeWidth]).separation(function (a, b) {
        return 1;
    })(root);
    const descendants = root.descendants().filter(d => !("children" in d));
    return (
        <svg width={props.width} height={props.height} onMouseMove={(e) => setXPos(e.pageX)}>
            <g transform={"translate(" + margins.left + "," + margins.top + ")"}>
                <Tree width={treeWidth} height={height} descendants={descendants} links={root.links()} xPos={xPos}/>
                <g transform={"translate(" + (treeWidth) + ",0)"}>
                    <Heatmap width={heatmapWidth} textWidth={textWidth} rectWidth={rectWidth} height={height} descendants={descendants} />
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
