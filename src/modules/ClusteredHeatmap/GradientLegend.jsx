import React from 'react';
import PropTypes from "prop-types";
import {v4 as uuidv4} from 'uuid';
import {getTextWidth} from "../../UtilityFunctions";

const GradientLegend = (props) => {
    const width = 100;
    const height = 20;
    const fontSize = 12;
    let gradient = null;
    const labels = []
    const id = uuidv4()
    if (props.range.length === 2) {
        gradient = <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor: props.range[0], stopOpacity: 1}}/>
            <stop offset="100%" style={{stopColor: props.range[1], stopOpacity: 1}}/>
        </linearGradient>
        labels.push(<text x={0} y={(height + fontSize) / 2}
                          fontSize={fontSize}>{Math.round(props.domain[0] * 100) / 100}</text>)
        const label2 = Math.round(props.domain[1] * 100) / 100;
        labels.push(<text x={width - getTextWidth(label2, 12, "normal")}
                          y={(height + fontSize) / 2}
                          fontSize={fontSize}>{label2}</text>)
    } else {
        gradient = <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor: props.range[0], stopOpacity: 1}}/>
            <stop offset="50%" style={{stopColor: props.range[1], stopOpacity: 1}}/>
            <stop offset="100%" style={{stopColor: props.range[2], stopOpacity: 1}}/>
        </linearGradient>
        labels.push(<text x={0} y={(height + fontSize) / 2}
                          fontSize={fontSize}>{Math.round(props.domain[0] * 100) / 100}</text>)
        const label2 = Math.round(props.domain[1] * 100) / 100;
        labels.push(<text x={(width - getTextWidth(label2, 12, "normal")) / 2}
                          y={(height + fontSize) / 2}
                          fontSize={fontSize}>{label2}</text>)
        const label3 = Math.round(props.domain[2] * 100) / 100;
        labels.push(<text x={width - getTextWidth(label3, 12, "normal")}
                          y={(height + fontSize) / 2}
                          fontSize={fontSize}>{label3}</text>)
    }

    return (
        <g>
            <defs>
                {gradient}
            </defs>
            <rect x={0} y={0} width={width} height={height} fill={"url(#" + id + ")"}/>
            {labels}
            <text x={width + 5} y={(height + fontSize) / 2}
                  fontSize={fontSize}>{props.label}</text>
        </g>)
};
GradientLegend.propTypes = {
    range: PropTypes.arrayOf(PropTypes.string).isRequired,
    domain: PropTypes.arrayOf(PropTypes.number).isRequired,
    label: PropTypes.string.isRequired,
};
export default GradientLegend;