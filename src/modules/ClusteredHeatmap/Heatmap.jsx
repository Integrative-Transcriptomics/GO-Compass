import React from 'react';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";


const Heatmap = inject("dataStore", "visStore")(observer((props) => {
    const rectHeight = props.height / props.descendants.filter(d => !("children" in d)).length;
    const descendants = props.descendants.filter(d => !("children" in d));
    const heatmapColor = d3.scaleLinear().domain(props.domain).range(props.range);
    // cells shwówing p values
    let heatmapCells = [];
    descendants.forEach(descendant => {
        heatmapCells.push(
            <g key={descendant.data.name}
               onMouseEnter={() => props.visStore.setChildHighlight(descendant.data.name)}
               onMouseLeave={() => props.visStore.setChildHighlight(null)}>{props.dataStore.conditions.map((condition, i) => {
                return (
                    <g key={condition}>
                        <rect y={descendant.y - 0.5 * rectHeight} x={props.heatmapX(condition)}
                              width={props.rectWidth}
                              height={rectHeight}
                              fill={heatmapColor(props.dataStore.dataTable[descendant.data.name]["pvalues"][i])}/>
                        {props.dataStore.dataTable[descendant.data.name]["pvalues"][i] >= props.logSigThreshold ?
                            <rect width={2} height={2} y={descendant.y - 1}
                                  x={props.heatmapX(condition) + 0.5 * props.rectWidth - 1} fill={"black"}/>
                            : null}
                        <title>{props.dataStore.dataTable[descendant.data.name]["pvalues"][i]}</title>
                    </g>)
            })}
            </g>);
    });
    let total = 0
    // lines highlighting cluster borderd
    const clusterLines = []
    // rects showing ckuster association
    const clusterRects = []
    props.visStore.parentSizes.forEach(parent => {
        clusterRects.push(<rect key={parent.id} y={rectHeight * total} width={props.rectWidth} height={rectHeight * parent.count}
                                fill={props.visStore.termColorScale(parent.id)}/>)
        total += parent.count;
        clusterLines.push(<line key={parent.id} x1={0} x2={props.width}
                                y1={rectHeight * total} y2={rectHeight * total}
                                stroke={"white"} strokeWidth={2}/>)
    })
    return (
        <g>
            <g transform={"translate(" + 1.5 * props.rectWidth + ",0)"}>
                {heatmapCells}
            </g>
            {clusterRects}
            {clusterLines}
        </g>
    );
}));
Heatmap.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    range: PropTypes.arrayOf(PropTypes.string).isRequired,
    domain: PropTypes.arrayOf(PropTypes.number).isRequired,
    rectWidth: PropTypes.number.isRequired,
    heatmapX: PropTypes.func.isRequired,
    descendants: PropTypes.arrayOf(PropTypes.object).isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};

export default Heatmap;
