import React, {createRef, useCallback, useState} from "react";
import PropTypes from 'prop-types';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import {v4 as uuidv4} from 'uuid';


/**
 * @return {null}
 */
const SmallTreemap = inject("dataStore", "visStore")(observer((props) => {
    const [highlighted, setIsHighlighted] = useState(false);
    const highlightRect = createRef();
    const width = props.visStore.treemapWidth * props.scalingFactor;
    const height = props.visStore.treemapHeight * props.scalingFactor;
    const currentLayout = props.visStore.treemapLayout(props.index);
    const children = [];
    const mapId = uuidv4();
    currentLayout.children.forEach((parent, j) =>
        parent.children.forEach((child, i) => {
            const id = mapId + '-' + j + '-' + i;
            const isHighlighted = props.visStore.childHighlights.length === 0 || props.visStore.childHighlights.includes(child.data.id);
            const fill = props.visStore.termColorScale(parent.data.id);
            children.push(
                <g key={child.data.id} transform={'translate(' + child.x0 + ',' + child.y0 + ')'}>
                    <defs>
                        <pattern id={id} patternUnits="userSpaceOnUse" width="4.5" height="4.5"
                                 patternTransform="rotate(45)">
                            <line x1="0" y="0" x2="0" y2="4.5" stroke={fill} strokeWidth="5"/>
                        </pattern>
                    </defs>
                    <rect onMouseEnter={() => props.visStore.setChildHighlight(child.data.id)}
                          onMouseLeave={() => props.visStore.setChildHighlight(null)}
                          onClick={() => props.visStore.setConditionIndex(props.index)}
                          id={"rectSmall" + id}
                          width={child.x1 - child.x0} height={child.y1 - child.y0}
                          fill={props.logSigThreshold < child.value ? fill : "url(#" + id + ")"}
                          stroke={props.visStore.childHighlights.includes(child.data.id) ? "black" : "white"}
                          strokeWidth={1}
                          opacity={isHighlighted ? 1 : 0.5}/>
                    <title>
                        {child.data.name}
                    </title>
                </g>
            );
        })
    );
    const startAnimation = useCallback((highlightIndex) => {
        const willBeHighlighted = highlightIndex === props.index;
            d3.select(highlightRect.current).transition()
                .duration(props.visStore.animationDuration)
                .attr('opacity', willBeHighlighted ? 1 : 0.2)
                .on('end', () => {
                    setIsHighlighted(willBeHighlighted)
                })
    }, [highlightRect, props.index, props.visStore.animationDuration]);
    React.useLayoutEffect(() => {
        startAnimation(props.visStore.conditionIndex);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.visStore.conditionIndex]);
    return (
        <svg width={width} height={height}>
            <rect width={width} height={height} fill="white"/>
            <g transform={"scale(" + props.scalingFactor + ")"}>
                {children}
            </g>
            <rect ref={highlightRect} width={width} height={height} fill={"none"} strokeWidth={2} stroke={"black"}
                  opacity={highlighted ? 1 : 0.2}/>

        </svg>
    );
}));

SmallTreemap.propTypes = {
    scalingFactor: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};
export default SmallTreemap;