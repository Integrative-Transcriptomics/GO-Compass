import React from "react";
import GradientLegend from "../ClusteredHeatmap/GradientLegend";
import PropTypes from "prop-types";
import GeneGlyph from "./GeneGlyph";

const TreemapLegend = (props) => {
    let foreGroundLabel = "% positive"
    if (props.glyphEncoding !== "updown") {
        foreGroundLabel = "Median"
    }

    return <svg width={320} height={50}>
        <g transform={"translate(0,10)"}>
            <GradientLegend
                domain={props.glyphEncoding === "updown" ? props.foregroundScale.domain().map(d => d * 100) : props.foregroundScale.domain()}
                range={props.foregroundScale.range()} label={foreGroundLabel}/>
            <g transform={"translate(" + 110 + ",0)"}>
                <text fontSize={12}>0</text>
                <GeneGlyph height={20} width={100} sigWidth={50} backgroundColor={"grey"} foregroundColor={"red"}/>
                <text x={80} fontSize={12}>100</text>
                <text y={32} fontSize={12}>% present</text>
            </g>
            <polygon points={"100,0 110,7 110,13 100,20"} fill={"red"} opacity={0.5}/>
            <polygon points={"210,7 220,0 220,20 210,13"} fill={"grey"} opacity={0.5}/>
            <g transform={"translate(" + 220 + ",0)"}>
                <GradientLegend domain={props.backgroundScale.domain()} range={props.backgroundScale.range()}
                                label={"Set size"}/>
            </g>
        </g>
    </svg>
}
TreemapLegend.propTypes = {
    foregroundScale: PropTypes.arrayOf(PropTypes.func).isRequired,
    backgroundScale: PropTypes.arrayOf(PropTypes.func).isRequired,
    glyphEncoding: PropTypes.string.isRequired,
};
export default TreemapLegend;