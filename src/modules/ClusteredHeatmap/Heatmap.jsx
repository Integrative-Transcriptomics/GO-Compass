import React from 'react';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import {cropText} from "../../UtilityFunctions";
import Legend from "./Legend";


const Heatmap = inject("dataStore", "visStore")(observer((props) => {
    const textHeight = 10;
    const rectHeight = props.height / props.descendants.filter(d => !("children" in d)).length;

    const range = ["white", "red"];
    const max = d3.max(Object.keys(props.dataStore.dataTable).map(key => d3.max(props.dataStore.dataTable[key].pvalues)));
    const domain = [0, max];

    const descendants = props.descendants.filter(d => !("children" in d));
    const heatmapX = d3.scaleBand().domain(props.dataStore.conditions).range([0, props.dataStore.conditions.length * props.rectWidth]);
    const heatmapColor = d3.scaleLinear().domain(domain).range(range);
    const clusterCells = descendants.map(descendant => {
        return <rect key={descendant.data.name} y={props.height - descendant.x - 0.5 * rectHeight} x={0}
                     width={props.rectWidth / 2}
                     height={rectHeight}
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
                <rect y={props.height - descendant.x - 0.5 * rectHeight} x={heatmapX(condition)} width={props.rectWidth}
                      height={rectHeight}
                      fill={heatmapColor(props.dataStore.dataTable[descendant.data.name]["pvalues"][i])}/>
                <title>{props.dataStore.dataTable[descendant.data.name]["pvalues"][i]}</title>
            </g>)
        })}
            <g>
                <text y={props.height - descendant.x + 0.5 * rectHeight}
                      x={props.dataStore.conditions.length * props.rectWidth}
                      fontSize={textHeight}
                      fontWeight={fontWeight}>
                    {cropText(props.dataStore.dataTable[descendant.data.name].description, 10, fontWeight, props.textWidth)}
                </text>
                <title>{props.dataStore.dataTable[descendant.data.name].description}</title>
            </g>
        </g>
    });
    const conditionLabels = props.dataStore.conditions.map(condition =>
        <text key={condition} fontSize={textHeight}
              transform={"translate(" + (heatmapX(condition) + props.rectWidth) + ",0)rotate(300)"}>
            {condition}
        </text>);
    return (
        <g>
            <g>
                {clusterCells}
            </g>
            <g transform={"translate(" + props.rectWidth + ",0)"}>
                {heatmapCells}
                {conditionLabels}
            </g>
            <g transform={"translate(" + ((props.dataStore.conditions.length + 1) * props.rectWidth) + "," + (props.height + 5) + ")"}>
                <Legend range={range} domain={domain}/>
            </g>
        </g>
    );
}));
Heatmap.propTypes = {
    width: PropTypes.number.isRequired,
    textWidth: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    descendants: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Heatmap;
