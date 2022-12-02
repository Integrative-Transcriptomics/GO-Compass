import React, {useCallback, useMemo, useState} from "react";
import PropTypes from 'prop-types';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";
import {v4 as uuidv4} from 'uuid'
import {Tooltip} from "@material-ui/core";
import TermTooltip from "../TermToolstip";


/**
 * @return {null}
 */
const AnimatedTreemap = inject("dataStore", "visStore")(observer((props) => {
    const [index, setIndex] = useState(0);
    const leafRef = React.createRef();
    const stripedRef = React.createRef();
    const propRef = React.createRef();

    const fontSize = 10;
    const layout = props.visStore.treemapLayout;

    const startAnimation = useCallback((index) => {
        let helperVis = d3.selectAll([...propRef.current.childNodes]);
        let leaf = d3.selectAll([...leafRef.current.childNodes]);
        let stripe = d3.selectAll([...stripedRef.current.childNodes]);
        const animateRects = () => {
            leaf.data(layout(index).leaves()).transition()
                .duration(props.visStore.animationDuration)
                .ease(d3.easeLinear)
                .attr("transform", d => `translate(${d.x0},${d.y0})`)
                .on("end", () => {
                    helperVis.attr('opacity', 1)
                    setIndex(index);
                })
                .call(leaf => leaf.select("rect")
                    .attr("width", d => d.x1 - d.x0)
                    .attr("height", d => d.y1 - d.y0)
                    .attr("opacity", d => props.logSigThreshold < d.value ? 1 : 0));
            stripe.data(layout(index).leaves()).transition()
                .duration(props.visStore.animationDuration)
                .ease(d3.easeLinear)
                .attr("transform", d => `translate(${d.x0},${d.y0})`)
                .on("end", () => {
                    helperVis.attr('opacity', 1)
                    setIndex(index);
                })
                .call(stripe => stripe.select("rect")
                    .attr("width", d => d.x1 - d.x0)
                    .attr("height", d => d.y1 - d.y0));
        }
        if (helperVis.empty()) {
            animateRects(helperVis, index)
        } else {
            helperVis.transition()
                .duration(0)
                .attr('opacity', 0)
                .on('end', () => {
                    animateRects(helperVis, index);
                });
        }
    }, [layout, leafRef, propRef, props.logSigThreshold, props.visStore.animationDuration, stripedRef]);
    React.useEffect(() => {
        if (props.visStore.conditionIndex !== index) {
            startAnimation(props.visStore.conditionIndex);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.visStore.conditionIndex, index]);
    const rects = [];
    const proportions = []
    const stripedRects = [];
    const setSizeScale = useMemo(() => {
        const setSizes = props.visStore.treeOrder.map(d => props.dataStore.geneInformation[d][index].setSize);
        return (d3.scaleLinear().domain([d3.min(setSizes), d3.max(setSizes)]).range(["grey", "white"]))
    }, [index, props.dataStore.geneInformation, props.visStore.treeOrder])
    let glyphColorScale;
    let geneMedians = {}
    if (props.dataStore.rootStore.hasFCs) {
        props.visStore.treeOrder.forEach(go => geneMedians[go] = d3.median(props.dataStore.dataTable[go]["Genes"]
            .map(gene => props.dataStore.rootStore.geneValues[gene][index])
            .filter(val => val !== false)));
        if (props.glyphEncoding === "updown") {
            glyphColorScale = d3.scaleLinear().domain([0, 0.5, 1]).range(["blue", "white", "red"])
        } else {
            let allValues = props.dataStore.conditions.map((cond, i) => Object.keys(props.dataStore.dataTable)
                .map(go => d3.median(props.dataStore.dataTable[go]["Genes"]
                    .map(gene => props.dataStore.rootStore.geneValues[gene][i]).filter(val => val !== false)))).flat()
            let domain;
            const max = d3.max(allValues);
            const min = d3.min(allValues);
            if (Math.abs(max) > Math.abs(min)) {
                domain = Math.abs(max);
            } else {
                domain = Math.abs(min);
            }
            glyphColorScale = d3.scaleLinear().domain([-domain, 0, domain]).range(["blue", "white", "red"])
        }
    }

    layout(index).children.forEach((parent) =>
        parent.children.forEach((child) => {
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
            let size = props.dataStore.geneInformation[child.data.id][index].setSize;
            let up, down, total, median;
            if (props.dataStore.rootStore.hasGeneInfo) {
                total = props.dataStore.geneInformation[child.data.id][index].total;
                if (props.dataStore.rootStore.hasFCs) {
                    median = geneMedians[child.data.id]
                    up = props.dataStore.geneInformation[child.data.id][index].up;
                    down = props.dataStore.geneInformation[child.data.id][index].down;
                }
            }
            if (rectWidth > 0 && rectHeight > 0) {
                let proportionFill = "black"
                let visText = size;
                if (props.dataStore.rootStore.hasGeneInfo) {
                    visText = visText + "/" + total;
                    if (props.dataStore.rootStore.hasFCs) {
                        if (props.glyphEncoding === "updown") {
                            let proportion = up / (up + down);
                            if (total === 0) {
                                proportion = 0.5
                            }
                            proportionFill = glyphColorScale(proportion)
                            visText = size + ", " + up + ":" + down;
                        } else {
                            proportionFill = glyphColorScale(geneMedians[child.data.id])
                            visText = size + ", " + Math.round(geneMedians[child.data.id]*100)/100
                        }
                    }
                }
                const propHeight = 10;
                const propWidth = 30;
                if ((propWidth < rectWidth && propHeight < rectHeight) || (propWidth < rectHeight && propHeight < rectWidth)) {
                    let sigWidth = propWidth / size * total;
                    let rotate = "";
                    if (propWidth > rectWidth) {
                        rotate = "rotate(270, " + (0.5 * propWidth) + ", " + (-0.5 * propHeight) + ")"
                    }
                    let transformNumbers, transformGlyph;
                    if (props.showGenes) {
                        transformGlyph = 'translate(' + (rectWidth - propWidth) + ',' + (rectHeight - propHeight) + ')' + rotate
                        transformNumbers = 'translate(' + (rectWidth - 2) + ',' + (rectHeight - 1.75 * propHeight) + ')' + rotate;
                    } else {
                        if (props.showNumbers) {
                            transformNumbers = 'translate(' + (rectWidth - 2) + ',' + (rectHeight - 2) + ')' + rotate
                        }
                    }
                    proportions.push(<g key={child.data.id} transform={'translate(' + child.x0 + ',' + child.y0 + ')'}>
                        {props.showNumbers ?
                            <g transform={transformNumbers}>
                                <text textAnchor={"end"} fontSize={fontSize}>{visText}</text>
                            </g> : null}
                        {props.showGenes ?
                            <g transform={transformGlyph}>
                                <rect width={propWidth} height={propHeight}
                                      fill={setSizeScale(size)}/>
                                {props.dataStore.rootStore.hasGeneInfo ?
                                    <rect y={propHeight / 4} width={sigWidth} height={propHeight * 0.5}
                                          fill={proportionFill}/> : null}
                                <line x2={propWidth} stroke={"white"}/>
                                {props.dataStore.rootStore.hasFCs ? <polygon
                                    points={sigWidth + ",0 " + sigWidth + "," + (-propHeight / 2) + " " + (sigWidth - propHeight) + "," + (-propHeight / 4)}
                                    fill={proportionFill}/> : null}
                                {props.dataStore.rootStore.hasFCs ?
                                    <rect x={sigWidth > 2 ? sigWidth - 2 : 0} y={-0.25 * propHeight}
                                          width={sigWidth > 2 ? 2 : sigWidth} height={propHeight}
                                          fill={proportionFill}/> : null}
                                <line y1={-0.5} y2={propHeight} stroke={"white"}/>
                            </g> : null}
                    </g>)
                }
            }
            const clipID = uuidv4();
            rects.push(<Tooltip key={child.data.id}
                                title={<TermTooltip color={props.visStore.termColorScale(parent.data.id)}
                                                    isTimeseries={props.isTimeseries}
                                                    id={child.data.id} logSigThreshold={props.logSigThreshold}
                                                    setSize={size} up={up} down={down} total={total} median={median}/>}>
                    <g transform={'translate(' + child.x0 + ',' + child.y0 + ')'}
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
                            <text clipPath={'url(#clip' + clipID + ')'} x={2} y={10} fontSize={fontSize}>
                                {rectWidth > 0 && rectHeight > 0 ? child.data.name : null}
                            </text>
                        </g>
                    </g>
                </Tooltip>
            )
            const stripeID = uuidv4();
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
        <div id={props.id}>
            <svg width={props.visStore.treemapWidth} height={props.visStore.treemapHeight}>
                <rect width={props.visStore.treemapWidth} height={props.visStore.treemapHeight} fill={"none"}
                      stroke={"lightgray"} strokeWidth={"1px"}/>
                <g ref={stripedRef}>{stripedRects}</g>
                <g ref={leafRef}>{rects}</g>
                <g ref={propRef}>{proportions}</g>
            </svg>
        </div>
    );
}));

AnimatedTreemap.propTypes = {
    logSigThreshold: PropTypes.number.isRequired,
    glyphEncoding: PropTypes.string.isRequired,
    isTimeseries: PropTypes.bool.isRequired,
    id: PropTypes.string.isRequired,
};

export default AnimatedTreemap;