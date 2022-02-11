import React from 'react';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import {cropText} from "../../UtilityFunctions";
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
    let text = [];
    descendants.forEach(descendant => {
        let fontWeight = "normal";
        if (props.visStore.childHighlights.includes(descendant.data.name)) {
            fontWeight = "bold";
        }
        if (props.dataStore.getFilterParent(descendant.data.name) === descendant.data.name) {
            fontWeight = "bold";
        }
        heatmapCells.push(
            <g key={descendant.data.name}
               onMouseEnter={() => props.visStore.setChildHighlight(descendant.data.name)}
               onMouseLeave={() => props.visStore.setChildHighlight(null)}>{props.dataStore.conditions.map((condition, i) => {
                return (
                    <g key={condition}>
                        <rect y={descendant.y - 0.5 * rectHeight} x={heatmapX(condition)}
                              width={props.rectWidth}
                              height={rectHeight}
                              stroke={"white"}
                              fill={heatmapColor(props.dataStore.dataTable[descendant.data.name]["pvalues"][i])}/>
                        <title>{props.dataStore.dataTable[descendant.data.name]["pvalues"][i]}</title>
                    </g>)
            })}
            </g>);
        text.push(
            <g key={descendant.data.name} onMouseEnter={() => props.visStore.setChildHighlight(descendant.data.name)}
               onMouseLeave={() => props.visStore.setChildHighlight(null)}>
                <text y={descendant.y}
                      alignmentBaseline="central"
                      fontSize={textHeight}
                      fontWeight={fontWeight}>
                    {cropText(props.dataStore.dataTable[descendant.data.name].description, textHeight, fontWeight, props.gapWidth)}
                </text>
                <title>{props.dataStore.dataTable[descendant.data.name].description}</title>
            </g>);
        clusterCells.push(
            <rect key={descendant.data.name} onMouseEnter={() => props.visStore.setChildHighlight(descendant.data.name)}
                  onMouseLeave={() => props.visStore.setChildHighlight(null)} y={descendant.y - 0.5 * rectHeight}
                  width={props.rectWidth}
                  height={rectHeight}
                  fill={props.visStore.termColorScale(props.dataStore.getFilterParent(descendant.data.name))}/>);
        /*if (descendant.data.value <= props.dataStore.clusterCutoff) {
            const x1 = props.rectWidth;
            const x2 = x1;
            const x3 = x1 + 0.5 * props.rectWidth;
            const y1 = descendant.y - 0.5 * rectHeight;
            const y2 = y1 + 0.5 * rectHeight;
            clusterCells.push(
                <polygon key={descendant.data.name + "polygon"}
                         points={x1 + "," + y1 + " " + x2 + "," + y2 + " " + x3 + "," + y1}
                         fill={props.visStore.termColorScale(props.dataStore.getFilterParent(descendant.data.name))}/>
            );
        }*/

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
            <g transform={"translate(" + 1.5*props.rectWidth + ",0)"}>
                {heatmapCells}
                {conditionLabels}
            </g>

            {/*<g transform={"translate(" + ((props.dataStore.conditions.length + 1.5) * props.rectWidth + 5) + "," + 0 + ")"}>
                {text}
            </g>*/}
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
};

export default Heatmap;
