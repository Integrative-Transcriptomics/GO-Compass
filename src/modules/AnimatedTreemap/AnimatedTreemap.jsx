import React, {useCallback, useState} from "react";
import PropTypes from 'prop-types';
import * as d3 from "d3";


/**
 * @return {null}
 */
function AnimatedTreemap(props) {
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

    const treemap = d3.treemap()
        .tile(d3.treemapResquarify)
        .size([width, height])
        .padding(d => d.height === 1 ? 1 : 0)
        .round(true);
    // Compute the structure using the average value.
    const root = treemap(d3.hierarchy(props.data)
        .sum(d => d.values ? d3.sum(d.values) : 0)
        .sort((a, b) => b.value - a.value));

    const max = d3.max(props.data.keys.map((d, i) => d3.hierarchy(props.data).sum(d => d.values ? d.values[i] : 0).value));
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
            .duration(props.duration)
            .ease(d3.easeLinear)
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
            .on("end", () => {
                setIndex(index);
            })
            .call(leaf => leaf.select("rect")
                .attr("width", d => d.x1 - d.x0)
                .attr("height", d => d.y1 - d.y0))
    }, [leafRef, layout, props.duration]);
    React.useEffect(() => {
        startAnimation(props.index);
    }, [props.index, startAnimation]);

    const children = layout(index).children.map((parent, j) =>
        parent.children.map((child, i) => {
            const isHighlighted = (props.parentHighlight === null | props.parentHighlight === parent.data.id)
                & (props.childHighlight === null | props.childHighlight === child.data.id);
            const fill = props.color(parent.data.id);
            const id = j + '-' + i;
            return (
                <g key={child.data.id} transform={'translate(' + child.x0 + ',' + child.y0 + ')'}>
                    <rect onMouseEnter={() => props.setChildHighlight(child.data.id)}
                          onMouseLeave={() => props.setChildHighlight(null)}
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
                    {-Math.log10(props.sigThreshold) < child.value ?
                        <text clipPath={'url(#clip' + id + ')'} fontSize={fontSize} y={child.y1 - child.y0}
                              x={child.x1 - child.x0 - fontSize}>*</text> : null}
                </g>
            );
        })
    );
    return (
        <svg width={props.width} height={props.height}>
            <g transform={"translate(" + margins.left + "," + margins.top + ")"}>
                <g ref={leafRef}>{children}</g>
            </g>
        </svg>
    );
}

AnimatedTreemap.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    data: PropTypes.object.isRequired,
};
AnimatedTreemap.defaultProps = {
    width: 900,
    height: 600,
};
export default AnimatedTreemap;