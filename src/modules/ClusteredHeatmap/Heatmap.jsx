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
    // cells showing cluster association
    let clusterCells = [];
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
        clusterCells.push(
            <rect key={descendant.data.name} onMouseEnter={() => props.visStore.setChildHighlight(descendant.data.name)}
                  onMouseLeave={() => props.visStore.setChildHighlight(null)} y={descendant.y - 0.5 * rectHeight}
                  width={props.rectWidth}
                  height={rectHeight}
                  fill={props.visStore.termColorScale(props.dataStore.getFilterParent(descendant.data.name))}/>);

    });
    return (
        <g>
            <g>
                {clusterCells}
            </g>
            <g transform={"translate(" + 1.5 * props.rectWidth + ",0)"}>
                {heatmapCells}
            </g>
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
