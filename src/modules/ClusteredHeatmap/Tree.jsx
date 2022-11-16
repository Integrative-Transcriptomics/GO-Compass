import React from 'react';
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import {getTextWidth, increase_brightness} from "../../UtilityFunctions";
import {v4 as uuidv4} from 'uuid'

const Tree = inject("dataStore", "visStore")(observer((props) => {
    // tree branches
    const links = [];
    // tree background rects
    const clusterRects = [];
    const nodes = props.descendants.map(node => {
        const dispensability = props.dataStore.dataTable[node.data.name].dispensability;
        let fill;
        let linkColor;
        let fontWeight = "normal";
        if (dispensability < props.dataStore.clusterCutoff) {
            fill = props.visStore.termColorScale(node.data.name);
            clusterRects.push(<rect key={node.data.name} x={props.dispScale(node.x) - 4}
                                    y={node.y - 0.5 * props.stepsize}
                                    height={props.stepsize * props.dataStore.clusterChildren[node.data.name].length}
                                    width={props.width - props.dispScale(node.x) + 4}
                                    fill={increase_brightness(fill, 80)}/>)
            if (node.parent !== null) {
                linkColor = props.visStore.termColorScale(node.parent.data.name);
            } else {
                linkColor = fill
            }
            fontWeight = "bold"
        } else {
            fill = props.visStore.termColorScale(props.dataStore.getFilterParent(node.data.name));
            linkColor = fill;
        }
        if (props.visStore.childHighlights.includes(node.data.name)) {
            fontWeight = "bold";
        }
        // dashed lines connecting heatmap and tree
        if (node.parent != null) {
            links.push(<line key={node.data.name + "1"} x1={props.dispScale(node.x)} y1={node.y}
                             x2={props.dispScale(node.parent.x)} y2={node.y}
                             strokeWidth={1} stroke={linkColor}/>);
            links.push(<line key={node.data.name + "2"} x1={props.dispScale(node.parent.x)} y1={node.y}
                             x2={props.dispScale(node.parent.x)} y2={node.parent.y}
                             strokeWidth={1} stroke={linkColor}/>);
        }
        // number of children that are below a term and filtered out
        let numchild = props.dataStore.filterHierarchy[node.data.name].length;
        return (<g key={node.data.name} onMouseEnter={() => props.visStore.setChildHighlight(node.data.name)}
                   onMouseLeave={() => props.visStore.setChildHighlight(null)}>
            <title>{props.dataStore.dataTable[node.data.name].description}</title>
            <line
                x1={props.dispScale(node.x) + getTextWidth(props.dataStore.dataTable[node.data.name].description, 10, fontWeight)}
                x2={props.width} y1={node.y} y2={node.y} strokeWidth={1} strokeDasharray="4 1"
                stroke={props.visStore.childHighlights.includes(node.data.name) ? "black" : "lightgray"}/>
            <line
                x1={props.dispScale(node.x) + getTextWidth(props.dataStore.dataTable[node.data.name].description, 10, fontWeight)}
                x2={props.width} y1={node.y} y2={node.y} strokeWidth={4} strokeDasharray="4 1"
                stroke="none"/>
            <text x={props.dispScale(node.x) + 3} y={node.y + 3} fill={"black"} fontSize={9}
                  fontWeight={fontWeight}>{props.dataStore.dataTable[node.data.name].description + (numchild !== 0 ? " (" + numchild + ")" : "")}</text>
        </g>)
    });


    const clipID = uuidv4();
    return (
        <g>
            <defs>
                <clipPath id={clipID}>
                    <rect x={-6} y={-10} width={props.width + 6} height={props.height + 10}/>
                </clipPath>
            </defs>
            <g clipPath={"url(#" + clipID + ")"}>
                <g>
                    {clusterRects}
                    {links}
                    {nodes}
                </g>
            </g>
            <line x1={props.dispScale(props.dataStore.clusterCutoff)}
                  x2={props.dispScale(props.dataStore.clusterCutoff)}
                  y1={0} y2={props.height} fill='none'
                  stroke='black' strokeWidth={1}/>
            <line x1={props.dispScale(props.dataStore.filterCutoff)}
                  x2={props.dispScale(props.dataStore.filterCutoff)}
                  y1={0} y2={props.height} fill='none'
                  stroke='black' strokeWidth={1}/>
        </g>
    );
}));
Tree.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    dispScale: PropTypes.func.isRequired,
    stepsize: PropTypes.number.isRequired,
    descendants: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Tree;
