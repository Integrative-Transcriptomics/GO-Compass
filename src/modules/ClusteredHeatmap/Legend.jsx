import React from 'react';
import PropTypes from "prop-types";

const Legend = (props) => {
    const width = 100;
    const height = 20;
    const fontSize = 12;
    return (
        <g>
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" style={{stopColor: props.range[0], stopOpacity: 1}}/>
                    <stop offset="100%" style={{stopColor: props.range[1], stopOpacity: 1}}/>
                </linearGradient>
            </defs>
            <rect x={0} y={0} width={width} height={height} fill="url(#grad1)"/>
            <text x={0} y={(height + fontSize) / 2} fontSize={fontSize}>{Math.round(props.domain[0] * 100) / 100}</text>
            <text x={width - 25} y={(height + fontSize) / 2}
                  fontSize={fontSize}>{Math.round(props.domain[1] * 100) / 100}</text>
        </g>)
};
Legend.propTypes = {
    range: PropTypes.arrayOf(PropTypes.string).isRequired
};
export default Legend;