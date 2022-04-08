import React, {useCallback, useEffect, useMemo, useState} from "react";
import PropTypes from 'prop-types';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import MobileStepper from "@material-ui/core/MobileStepper";
import Button from "@material-ui/core/Button";
import {KeyboardArrowLeft, KeyboardArrowRight} from "@material-ui/icons";
import { v4 as uuidv4 } from 'uuid'


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
    const propRef = React.createRef();
    const stepperRef = React.createRef();

    const fontSize = 10;

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
    const proportions = []
    const stripedRects = [];
    const currentGOterms = useMemo(() => {
        return (layout(index).children
            .map(parent => parent.children
                .map(child => child.data.id)).flat())
    }, [index, layout])
    const setSizeScale = useMemo(() => {
        const setSizes = currentGOterms.map(d => props.dataStore.geneInformation[d][index].setSize);
        return (d3.scaleLinear().domain([d3.min(setSizes), d3.max(setSizes)]).range(["grey", "white"]))
    }, [currentGOterms, index, props.dataStore.geneInformation])
    const upDownScale = d3.scaleLinear().domain([0, 0.5, 1]).range(["blue", "white", "red"])
    layout(index).children.forEach((parent, j) =>
        parent.children.forEach((child, i) => {
            const rectWidth = child.x1 - child.x0;
            const rectHeight = child.y1 - child.y0
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
            if (rectWidth > 0 && rectHeight > 0 && props.dataStore.rootStore.hasGeneInfo) {
                /*
                const up = props.dataStore.geneInformation[child.data.id][index].up;
                const down = props.dataStore.geneInformation[child.data.id][index].down;
                const size = props.dataStore.geneInformation[child.data.id][index].setSize;
                const total = up + down;
                const propHeight = 5;
                const propWidth = 30;
                proportions.push(<g key={child.data.id} transform={'translate(' + child.x0 + ',' + child.y0 + ')'}>
                    <g transform={'translate(' + (rectWidth - 2.5 * propWidth-1) + ',' + (rectHeight - 2.5 * propHeight-1) + ')'}>
                        <g transform={'translate(' + (1.5 * propWidth) + ',0)'}>
                            <rect x={-1} y={-1} width={propWidth+1} height={propHeight*2.5+1} fill={"white"}/>
                            <rect width={propWidth} height={propHeight} fill={setSizeScale(size)}/>
                            <line x1={propWidth / size * total} x2={propWidth / size * total} y1={0}
                                  y2={propHeight} stroke={"white"} strokeWidth={2}/>
                            <g transform={'translate(0,' + (1.5 * propHeight) + ')'}>
                                <rect width={propWidth / total * up} height={propHeight} fill={"red"}/>
                                <rect x={propWidth / total * up} width={propWidth / total * down} height={propHeight}
                                      fill={"blue"}/>
                            </g>
                        </g>
                    </g>
                </g>)
                */
                let proportionFill = "black"
                const size = props.dataStore.geneInformation[child.data.id][index].setSize;
                const total = props.dataStore.geneInformation[child.data.id][index].total;
                let tooltipText = "Size: " + size + ", Expressed: " + total;
                let visText = size + "/" + total;
                if (props.dataStore.rootStore.hasFCs) {
                    const up = props.dataStore.geneInformation[child.data.id][index].up;
                    let proportion = up / total;
                    if (total === 0) {
                        proportion = 0.5
                    }
                    proportionFill = upDownScale(proportion)
                    tooltipText = "Set: " + size + ", up: " + up + ", down: " + (total - up);
                    visText = size + ", " + up + ":" + (total - up);
                }
                const propHeight = 10;
                const propWidth = 30;
                if ((propWidth < rectWidth && propHeight < rectHeight) || (propWidth < rectHeight && propHeight < rectWidth)) {
                    let sigWidth = propWidth / size * total;
                    let rotate = "";
                    if (propWidth > rectWidth) {
                        rotate = "rotate(270, " + (0.5 * propWidth) + ", " + (-0.5 * propHeight) + ")scale(-1,1)translate(" + (-propWidth) + ",0)"
                    }
                    proportions.push(<g key={child.data.id} transform={'translate(' + child.x0 + ',' + child.y0 + ')'}>
                        <g transform={'translate(' + (rectWidth - 2) + ',' + (rectHeight - 2 * propHeight) + ')' + rotate}>
                            <text textAnchor={"end"} fontSize={fontSize}>{visText}</text>
                        </g>
                        <g transform={'translate(' + (rectWidth - propWidth) + ',' + (rectHeight - propHeight) + ')' + rotate}>
                            <rect width={propWidth} height={propHeight}
                                  fill={setSizeScale(size)}/>
                            <rect y={propHeight / 4} width={sigWidth} height={propHeight * 0.5}
                                  fill={proportionFill}/>
                            <line x2={propWidth} stroke={"white"}/>
                            {props.dataStore.rootStore.hasFCs ? <polygon
                                points={sigWidth + ",0 " + sigWidth + "," + (-propHeight / 2) + " " + (sigWidth - propHeight) + "," + (-propHeight / 4)}
                                fill={proportionFill}/> : null}
                            {props.dataStore.rootStore.hasFCs ?
                                <rect x={sigWidth > 2 ? sigWidth - 2 : 0} y={-0.25 * propHeight}
                                      width={sigWidth > 2 ? 2 : sigWidth} height={propHeight}
                                      fill={proportionFill}/> : null}
                            <line y1={-0.5} y2={propHeight} stroke={"white"}/>
                            {/*sigWidth< propHeight/3?<polygon
                            points={"1,"+(propHeight/4)+" "+sigWidth+","+(propHeight/4)+" "+(sigWidth+5)+","+(-propHeight/4)+" "+(-4)+","+(-propHeight/4)}
                            fill={upDownScale(proportion)}/>:null*/}
                            {/*<polygon
                            points={(propWidth / size * total) + "," + ((1 / 4) * propHeight - 1) + " " + (propWidth / size * total + 4) + "," + (-7) + " " + (propWidth / size * total - 4) + "," + (-7)}
                            stroke={"white"}
                            fill={upDownScale(proportion)}/>
                            <polygon
                                points={(sigWidth) + "," + ((1 / 2) * propHeight - 1) + " " + (sigWidth) + "," + (-7) + " " + (sigWidth - 8) + "," + (-7)}
                                stroke={"white"}
                                fill={upDownScale(proportion)}/>
                            <line x1={sigWidth} x2={sigWidth} y1={0} y2={propHeight}
                                  stroke={"white"}/>*/}
                            <title>{tooltipText}</title>
                        </g>
                    </g>)
                }
            }
            const clipID=uuidv4();
            rects.push(<g key={child.data.id} transform={'translate(' + child.x0 + ',' + child.y0 + ')'}
                          onMouseEnter={() => props.visStore.setChildHighlight(child.data.id)}
                          onMouseLeave={() => props.visStore.setChildHighlight(null)}>
                <rect id={"rect" + clipID}
                      width={rectWidth} height={rectHeight}
                      fill={fill}
                      stroke={props.visStore.childHighlights.includes(child.data.id) ? "black" : "white"}
                      strokeWidth={1}
                      opacity={filledOpacity}/>
                <g>
                    <defs>
                        <clipPath id={"clip" + clipID}>
                            <use xlinkHref={"#rect" + clipID}/>
                        </clipPath>
                    </defs>
                    <text clipPath={'url(#clip' +  clipID + ')'} x={2} y={10} fontSize={fontSize}>
                        {rectWidth > 0 && rectHeight > 0 ? child.data.name : null}
                    </text>
                </g>
                <title>
                    {child.data.name}
                </title>
            </g>)
            const stripeID=uuidv4();
            stripedRects.push(
                <g key={child.data.id} transform={'translate(' + child.x0 + ',' + child.y0 + ')'}>
                    <defs>
                        <pattern id={stripeID} patternUnits="userSpaceOnUse" width="4.5" height="4.5"
                                 patternTransform="rotate(45)">
                            <line x1="0" y="0" x2="0" y2="4.5" stroke={fill} strokeWidth="5"/>
                        </pattern>
                    </defs>
                    <rect width={child.x1 - child.x0} height={child.y1 - child.y0}
                          fill={"url(#" + stripeID + ")"}
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
                    <g ref={propRef}>{proportions}</g>
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