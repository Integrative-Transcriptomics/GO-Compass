import React from 'react';
import PropTypes from 'prop-types';
import {inject, observer} from "mobx-react";
import {getTextWidth} from "../UtilityFunctions";


const Legend = inject("dataStore", "visStore")(observer((props) => {
    const margins = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    };
    const rowHeight = 15;
    const width = props.width - margins.left - margins.right;

    let currX = 0;
    let currY = 0;
    const legend = props.dataStore.nestedData.map((d, i) => {
        const element = <g key={d.id} transform={"translate(" + currX + "," + currY + ")"}>
            <rect width={10} height={10} x={0} y={0} fill={props.visStore.termColorScale(d.id)}/>
            <text x={15} y={8} fontSize={12}>
                {d.name}
            </text>
            <title>{d.name}</title>
        </g>;
        currX += getTextWidth(d.name, 14, "normal") + 10;
        if (currX > width) {
            currX = 0;
            currY += rowHeight
        }
        return (element);
    });
    return (
        <svg width={width} height={currY + rowHeight * 2}>
            <g transform={"translate(" + margins.left + "," + margins.top + ")"}>
                {legend}
            </g>
        </svg>
    );
}));

Legend.propTypes = {
    width: PropTypes.number.isRequired,
};
export default Legend;
