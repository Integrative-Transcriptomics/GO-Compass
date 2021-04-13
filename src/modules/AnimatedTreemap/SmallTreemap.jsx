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
    const margins = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    };
    const width = props.width - margins.left - margins.right;
    const highlightRect = createRef();
    const scale = width / props.parentWidth;

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
    const startAnimation = useCallback(() => {
        const willBeHighlighted = props.visStore.conditionIndex === props.index;
        d3.select(highlightRect.current).transition()
            .duration(props.visStore.animationDuration)
            .attr('opacity', willBeHighlighted ? 1 : 0)
            .on('end', () => setIsHighlighted(willBeHighlighted))
    }, [highlightRect, props.visStore.animationDuration, props.index, props.visStore.conditionIndex]);
    React.useEffect(() => {
        startAnimation(props.index);
    }, [props.index, startAnimation]);
    return (
        <g transform={"translate(" + margins.left + "," + margins.top + ")"}>
            <text>{props.dataStore.conditions[props.index]}</text>

            <g transform={"scale(" + scale + ")"}>
                {children}
                <rect ref={highlightRect} x={currentLayout.x0} y={currentLayout.y0}
                      width={currentLayout.x1 - currentLayout.x0}
                      height={currentLayout.y1 - currentLayout.y0} stroke="black" strokeWidth={2 / scale} fill="none"
                      opacity={highlighted ? 1 : 0}/>
            </g>
        </g>
    );
}));

SmallTreemap.propTypes = {
    width: PropTypes.number.isRequired,
    parentWidth: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};
export default SmallTreemap;