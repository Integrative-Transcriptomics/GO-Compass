import React, {useCallback, useEffect, useState} from "react";
import PropTypes from 'prop-types';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import MobileStepper from "@material-ui/core/MobileStepper";
import Button from "@material-ui/core/Button";
import {KeyboardArrowLeft, KeyboardArrowRight} from "@material-ui/icons";


/**
 * @return {null}
 */
const AnimatedTreemap = inject("dataStore", "visStore")(observer((props) => {
    const [index, setIndex] = useState(0);
    const margins = {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
    };
    const width = props.width - margins.left - margins.right;

    const leafRef = React.createRef();
    const stripedRef = React.createRef();
    const stepperRef = React.createRef();

    useEffect(() => {
        if (stepperRef.current != null) {
            props.visStore.setTreemapHeight(props.height - stepperRef.current.getBoundingClientRect().height)
        }
    }, [stepperRef, props.height, props.visStore]);
    const layout = props.visStore.treemapLayout;

    const startAnimation = useCallback((index) => {
        let leaf = d3.selectAll([...leafRef.current.childNodes]);
        leaf.data(layout(index).leaves()).transition()
            .duration(props.visStore.animationDuration)
            .ease(d3.easeLinear)
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
            .on("end", () => {
                setIndex(index);
            })
            .call(leaf => leaf.select("rect")
                .attr("width", d => d.x1 - d.x0)
                .attr("height", d => d.y1 - d.y0)
                .attr("opacity", d => props.logSigThreshold < d.value ? 1 : 0))
        ;
        let stripe = d3.selectAll([...stripedRef.current.childNodes]);
        stripe.data(layout(index).leaves()).transition()
            .duration(props.visStore.animationDuration)
            .ease(d3.easeLinear)
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
            .on("end", () => {
                setIndex(index);
            })
            .call(stripe => stripe.select("rect")
                .attr("width", d => d.x1 - d.x0)
                .attr("height", d => d.y1 - d.y0));

    }, [leafRef, stripedRef, layout, props.visStore.animationDuration, props.logSigThreshold]);
    React.useEffect(() => {
        if (props.visStore.conditionIndex !== index) {
            startAnimation(props.visStore.conditionIndex);
        }
    }, [props.visStore.conditionIndex, index, startAnimation]);
    const rects = [];
    const stripedRects = [];
    layout(index).children.forEach((parent, j) =>
        parent.children.forEach((child, i) => {
            const isHighlighted = props.visStore.childHighlights.length === 0
                || props.visStore.childHighlights.includes(child.data.id)
            let filledOpacity;
            let stripedOpacity;
            if (props.logSigThreshold < child.value) {
                if (isHighlighted) {
                    filledOpacity = 1;
                } else {
                    filledOpacity = 0.5;
                    stripedOpacity = 0;
                }
            } else {
                filledOpacity = 0;
                if (isHighlighted) {
                    stripedOpacity = 1;
                } else {
                    stripedOpacity = 0.5
                }
            }
            const fill = props.visStore.termColorScale(parent.data.id);
            const id = j + '-' + i;
            rects.push(<g key={child.data.id} transform={'translate(' + child.x0 + ',' + child.y0 + ')'}
                          onMouseEnter={() => props.visStore.setChildHighlight(child.data.id)}
                          onMouseLeave={() => props.visStore.setChildHighlight(null)}>
                <rect id={"rect" + id}
                      width={child.x1 - child.x0} height={child.y1 - child.y0}
                      fill={fill}
                      stroke={props.visStore.childHighlights.includes(child.data.id) ? "black" : "white"}
                      strokeWidth={1}
                      opacity={filledOpacity}/>
                <g>
                    <defs>
                        <clipPath id={"clip" + id}>
                            <use xlinkHref={"#rect" + id}/>
                        </clipPath>
                    </defs>
                    <text clipPath={'url(#clip' + id + ')'} x={2} y={10} fontSize={10}>
                        {child.data.name}
                    </text>
                </g>
                <title>
                    {child.data.name}
                </title>
            </g>)
            stripedRects.push(
                <g key={child.data.id} transform={'translate(' + child.x0 + ',' + child.y0 + ')'}>
                    <defs>
                        <pattern id={id} patternUnits="userSpaceOnUse" width="4.5" height="4.5"
                                 patternTransform="rotate(45)">
                            <line x1="0" y="0" x2="0" y2="4.5" stroke={fill} strokeWidth="5"/>
                        </pattern>
                    </defs>
                    <rect id={"rect" + id}
                          width={child.x1 - child.x0} height={child.y1 - child.y0}
                          fill={"url(#" + id + ")"}
                          stroke={props.visStore.childHighlights.includes(child.data.id) ? "black" : "white"}
                          strokeWidth={1}
                          opacity={stripedOpacity}
                    />
                    <title>
                        {child.data.name}
                    </title>
                </g>
            );
        })
    );
    return (
        <div>
            {/* eslint-disable-next-line react/jsx-no-undef */}
            <MobileStepper
                ref={stepperRef}
                steps={props.dataStore.conditions.length}
                position="static"
                variant="text"
                activeStep={props.visStore.conditionIndex}
                nextButton={
                    <Button size="small"
                            onClick={() => props.visStore.setConditionIndex(props.visStore.conditionIndex + 1)}
                            disabled={props.visStore.conditionIndex === props.dataStore.conditions.length - 1}>
                        Next
                        <KeyboardArrowRight/>
                    </Button>
                }
                backButton={
                    <Button size="small"
                            onClick={() => props.visStore.setConditionIndex(props.visStore.conditionIndex - 1)}
                            disabled={props.visStore.conditionIndex === 0}>
                        <KeyboardArrowLeft/>
                        Back
                    </Button>
                }
            />
            <svg width={props.width} height={props.visStore.treemapHeight}>
                <g transform={"translate(" + margins.left + "," + margins.top + ")scale(" + width / props.width + ")"}>
                    <g ref={stripedRef}>{stripedRects}</g>
                    <g ref={leafRef}>{rects}</g>
                </g>
            </svg>
        </div>
    );
}));

AnimatedTreemap.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    logSigThreshold: PropTypes.number.isRequired,
};
AnimatedTreemap.defaultProps = {
    width: 900,
    height: 600,
};
export default AnimatedTreemap;