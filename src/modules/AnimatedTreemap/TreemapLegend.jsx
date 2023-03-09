import React from "react";
import GradientLegend from "../ClusteredHeatmap/GradientLegend";
import PropTypes from "prop-types";

const TreemapLegend = (props) => {
    let foreGroundLabel="Gene values: % positive"
    if(props.glyphEncoding!=="updown"){
        foreGroundLabel="Gene values: median"
    }

    return <svg width={400} height={32}>
        <GradientLegend domain={props.foregroundScale.domain()} range={props.foregroundScale.range()} label={foreGroundLabel}/>
        <g transform={"translate(" + 300 + ",0)"}>
            <GradientLegend domain={props.backgroundScale.domain()} range={props.backgroundScale.range()} label={"Gene set size"}/>
        </g>
    </svg>
}
TreemapLegend.propTypes = {
    foregroundScale: PropTypes.arrayOf(PropTypes.func).isRequired,
    backgroundScale: PropTypes.arrayOf(PropTypes.func).isRequired,
    glyphEncoding: PropTypes.string.isRequired,
};
export default TreemapLegend;