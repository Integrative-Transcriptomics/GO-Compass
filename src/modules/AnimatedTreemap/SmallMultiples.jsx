import React from "react";
import PropTypes from 'prop-types';
import SmallTreemap from "./SmallTreemap";
import {inject, observer} from "mobx-react";


/**
 * @return {null}
 */
const SmallMultiples = inject("dataStore", "visStore")(observer((props) => {
    let width, height;
    if (props.dataStore.conditions.length < 5) {
        width = props.width / 2;
        height = props.height / 2;
    } else if (props.dataStore.conditions.length < 10) {
        width = props.width / 3;
        height = props.height / 3;
    } else {
    }
    let x = 0;
    let y = 0;
    const treemaps = [];
    props.dataStore.conditions.forEach((key, i) => {
        treemaps.push(<g key={key} transform={"translate(" + x + "," + y + ")"}>
            <SmallTreemap logSigThreshold={props.logSigThreshold}
                          index={i} parentWidth={props.width} width={width} height={height}/>
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
}));

SmallMultiples.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    logSigThreshold: PropTypes.number.isRequired,
};
SmallMultiples.defaultProps = {
    width: 900,
    height: 600,
};
export default SmallMultiples;