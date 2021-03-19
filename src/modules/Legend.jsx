import React from 'react';
import PropTypes from 'prop-types';
import {inject, observer} from "mobx-react";


const Legend = inject("dataStore", "visStore")(observer((props) => {
    const margins = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    };
    const rowHeight = 15;
    const width = props.width - margins.left - margins.right;
    let height = (props.dataStore.nestedData.length + 1) * rowHeight;


    const legend = props.dataStore.nestedData.map((d, i) => {
        return <g key={d.id} transform={"translate(10," + i * rowHeight + ")"}>
            <rect width={10} height={10} x={0} y={0} fill={props.visStore.termColorScale(d.id)}/>
            <text x={15} y={8} fontSize={12}>
                {d.name}
            </text>
            <title>{d.name}</title>
        </g>
    });
    return (
        <svg width={width} height={height}>
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
