import React, {useCallback, useState} from "react";
import PropTypes from 'prop-types';
import * as d3 from "d3";
import {inject, observer} from "mobx-react";


/**
 * @return {null}
 */
const AnimatedTreemap = inject("dataStore", "visStore")(observer((props) => {
    const [index, setIndex] = useState(0);
    const margins = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    };
    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    const fontSize = 12;


    const leafRef = React.createRef();
    const starRef = React.createRef();


    const treemap = d3.treemap()
        .tile(d3.treemapResquarify)
        .size([width, height])
        .padding(d => d.height === 1 ? 1 : 0)
        .round(true);
    // Compute the structure using the average value.
    const root = treemap(d3.hierarchy({children: props.dataStore.nestedData, keys: props.dataStore.conditions})
        .sum(d => d.values ? d3.sum(d.values) : 0)
        .sort((a, b) => b.value - a.value));

    const max = d3.max(props.dataStore.conditions
        .map((d, i) => d3.hierarchy({children: props.dataStore.nestedData, keys: props.dataStore.conditions})
            .sum(d => d.values ? d.values[i] : 0).value));
    const layout = useCallback((index) => {
        const k = Math.sqrt(root.sum(d => d.values ? d.values[index] : 0).value / max);
        const x = (1 - k) / 2 * width;
        const y = (1 - k) / 2 * height;
        return treemap.size([width * k, height * k])(root)
            .each(d => {
                d.x0 += x;
                d.x1 += x;
                d.y0 += y;
                d.y1 += y
            })
    }, [root, max, treemap, width, height]);

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
                .attr("height", d => d.y1 - d.y0));
        let star = d3.selectAll([...starRef.current.childNodes]);
        star.data(layout(index).leaves()).transition()
            .duration(props.visStore.animationDuration)
            .ease(d3.easeLinear)
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
            .on("end", () => {
                setIndex(index);
            })
            .call(leaf => leaf.select("text")
                .attr("x", d => d.x1 - d.x0 - fontSize)
                .attr("y", d => d.y1 - d.y0)
                .attr("opacity", d => d.value > (-Math.log10(props.visStore.sigThreshold)) ? 1 : 0));

    }, [leafRef, starRef, layout, props.visStore.animationDuration, props.visStore.sigThreshold]);
    React.useEffect(() => {
        if(props.visStore.conditionIndex !== index) {
            startAnimation(props.visStore.conditionIndex);
        }
    }, [props.visStore.conditionIndex, index, startAnimation]);
    const rects = [];
    const stars = [];
    layout(index).children.forEach((parent, j) =>
        parent.children.forEach((child, i) => {
            const isHighlighted = (props.visStore.parentHighlight === null | props.visStore.parentHighlight === parent.data.id)
                & (props.visStore.childHighlight === null | props.visStore.childHighlight === child.data.id);
            const fill = props.visStore.termColorScale(parent.data.id);
            const id = j + '-' + i;
            rects.push(
                <g key={child.data.id} transform={'translate(' + child.x0 + ',' + child.y0 + ')'}>
                    <rect onMouseEnter={() => props.visStore.setChildHighlight(child.data.id)}
                          onMouseLeave={() => props.visStore.setChildHighlight(null)}
                          id={"rect" + id}
                          width={child.x1 - child.x0} height={child.y1 - child.y0}
                          fill={fill}
                          opacity={isHighlighted ? 1 : 0.5}/>
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
                </g>
            );
            stars.push(<g key={child.data.name} transform={'translate(' + child.x0 + ',' + child.y0 + ')'}>
                <text clipPath={'url(#clip' + id + ')'} opacity={-Math.log10(props.visStore.sigThreshold) < child.value ? 1 : 0}
                      fontSize={fontSize} y={child.y1 - child.y0}
                      x={child.x1 - child.x0 - fontSize}>*
                </text>
            </g>)
        })
    );
    return (
        <svg width={props.width} height={props.height}>
            <g transform={"translate(" + margins.left + "," + margins.top + ")"}>
                <g ref={leafRef}>{rects}</g>
                <g ref={starRef}>{stars}</g>
            </g>
        </svg>
    );
}));

AnimatedTreemap.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
};
AnimatedTreemap.defaultProps = {
    width: 900,
    height: 600,
};
export default AnimatedTreemap;