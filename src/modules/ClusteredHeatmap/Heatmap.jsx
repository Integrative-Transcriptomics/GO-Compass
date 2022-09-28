import React from 'react';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import GradientLegend from "./GradientLegend";


const Heatmap = inject("dataStore", "visStore")(observer((props) => {
    const textHeight = 9;
    const rectHeight = props.height / props.descendants.filter(d => !("children" in d)).length;

    const range = ["white", "red"];
    const max = d3.max(Object.keys(props.dataStore.dataTable).map(key => d3.max(props.dataStore.dataTable[key].pvalues)));
    const domain = [0, max];

    const descendants = props.descendants.filter(d => !("children" in d));
    const heatmapX = d3.scaleBand().domain(props.dataStore.conditions).range([0, props.dataStore.conditions.length * props.rectWidth]);
    const heatmapColor = d3.scaleLinear().domain(domain).range(range);
    let heatmapCells = [];
    let clusterCells = [];
    descendants.forEach(descendant => {
        heatmapCells.push(
            <g key={descendant.data.name}
               onMouseEnter={() => props.visStore.setChildHighlight(descendant.data.name)}
               onMouseLeave={() => props.visStore.setChildHighlight(null)}>{props.dataStore.conditions.map((condition, i) => {
                return (
                    <g key={condition}>
                        <rect y={descendant.y - 0.5 * rectHeight} x={heatmapX(condition)}
                              width={props.rectWidth}
                              height={rectHeight}
                              fill={heatmapColor(props.dataStore.dataTable[descendant.data.name]["pvalues"][i])}/>
                        {props.dataStore.dataTable[descendant.data.name]["pvalues"][i] >= props.logSigThreshold ?
                            <rect width={2} height={2} y={descendant.y - 1}
                                  x={heatmapX(condition) + 0.5 * props.rectWidth - 1} fill={"black"}/>
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
    const conditionLabels = props.dataStore.conditions.map(condition =>
        <text key={condition} fontSize={textHeight}
              transform={"translate(" + (heatmapX(condition) + props.rectWidth) + "," + -0.5 * rectHeight + ")rotate(300)"}>
            {condition}
        </text>);
    return (
        <g>
            <g>
                {clusterCells}
            </g>
            <g transform={"translate(" + 1.5 * props.rectWidth + ",0)"}>
                {heatmapCells}
                {conditionLabels}
            </g>
            <g transform={"translate(0," + (props.height + 5) + ")"}>
                <GradientLegend range={range} domain={domain} label={"-log10(pVal)"}/>
            </g>
        </g>
    );
}));
Heatmap.propTypes = {
    width: PropTypes.number.isRequired,
    gapWidth: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    descendants: PropTypes.arrayOf(PropTypes.object).isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};

export default Heatmap;
