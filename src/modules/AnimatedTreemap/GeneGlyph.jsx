import React from "react";
import PropTypes from "prop-types";
import {inject, observer} from "mobx-react";

const GeneGlyph = inject("dataStore", "visStore")(observer((props) => {
    return <g>
        <rect width={props.width} height={props.height}
              fill={props.backgroundColor}/>
        {props.dataStore.rootStore.hasGeneInfo ?
            <rect y={props.height / 4} width={props.sigWidth} height={props.height * 0.5}
                  fill={props.foregroundColor}/> : null}
        <line x2={props.width} stroke={"white"}/>
        {props.dataStore.rootStore.hasFCs ? <polygon
            points={props.sigWidth + ",0 " + props.sigWidth + "," + (-props.height / 2) + " " + (props.sigWidth - props.height) + "," + (-props.height / 4)}
            fill={props.foregroundColor}/> : null}
        {props.dataStore.rootStore.hasFCs ?
            <rect x={props.sigWidth > 2 ? props.sigWidth - 2 : 0} y={-0.25 * props.height}
                  width={props.sigWidth > 2 ? 2 : props.sigWidth} height={props.height}
                  fill={props.foregroundColor}/> : null}
        <line y1={-0.5} y2={props.height} stroke={"white"}/>
    </g>
}));
GeneGlyph.propTypes = {
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    sigWidth: PropTypes.number.isRequired,
    backgroundColor: PropTypes.string.isRequired,
    foregroundColor: PropTypes.string.isRequired,
};
export default GeneGlyph;