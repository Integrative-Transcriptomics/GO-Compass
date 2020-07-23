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
    const rowHeight=15;
    const width = props.width - margins.left - margins.right;
    let height = (props.visStore.termColorScale.domain().length + 1) * rowHeight;

    const names = props.dataStore.nestedData.map(d => d.name);

    const legend = props.visStore.termColorScale.domain().map((key, i) => {
        return <g key={key} transform={"translate(10," + i * rowHeight + ")"}>
            <rect width={10} height={10} x={0} y={0} fill={props.visStore.termColorScale(key)}/>
            <text x={15} y={8} fontSize={12}>
                {names[i]}
            </text>
            <title>{key}</title>
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
