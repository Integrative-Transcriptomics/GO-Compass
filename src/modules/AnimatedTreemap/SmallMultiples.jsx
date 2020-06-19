import React from "react";
import PropTypes from 'prop-types';
import Treemap from "./Treemap";


/**
 * @return {null}
 */
function SmallMultiples(props) {
    let width, height;
    if (props.data.keys.length < 5) {
        width = props.width / 2;
        height = props.height / 2;
    } else if (props.data.keys.length < 10) {
        width = props.width / 3;
        height = props.height / 3;
    } else {
    }
    let x = 0;
    let y = 0;
    const treemaps = [];
    props.data.keys.forEach((key, i) => {
        treemaps.push(<g key={key} transform={"translate(" + x + "," + y + ")"}>
            <Treemap parentHighlight={props.parentHighlight}
                     childHighlight={props.childHighlight}
                     setChildHighlight={props.setChildHighlight}
                     sigThreshold={props.sigThreshold}
                     setIndex={props.setIndex}
                     data={props.data} index={i} duration={props.duration} highlightIndex={props.index}
                     color={props.color}
                     width={width} height={height}/>
        </g>);
        if (Math.round(x + width) >= Math.round(props.width)) {
            y += height;
            x = 0;
        } else {
            x += width;
        }
    });
    return <svg width={props.width} height={props.height}>
        {treemaps}
    </svg>
}

SmallMultiples.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    data: PropTypes.object
};
SmallMultiples.defaultProps = {
    width: 900,
    height: 600,
};
export default SmallMultiples;