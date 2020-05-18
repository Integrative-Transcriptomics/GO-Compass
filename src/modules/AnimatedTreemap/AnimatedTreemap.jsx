import React, {useCallback, useState} from "react";
import PropTypes from 'prop-types';
import * as d3 from "d3";


/**
 * @return {null}
 */
function AnimatedTreemap(props) {
    const [index, setIndex] = useState(0);

    const leafRef = React.createRef();
    const parentRef = React.createRef();


    const treemap = d3.treemap()
        .tile(d3.treemapResquarify)
        .size([props.width, props.height])
        .padding(d => d.height === 1 ? 1 : 0)
        .round(true);
    // Compute the structure using the average value.
    const root = treemap(d3.hierarchy(props.data)
        .sum(d => d.values ? d3.sum(d.values) : 0)
        .sort((a, b) => b.value - a.value));
    const children = [];
    const parents = [];
    const max = d3.max(props.data.keys.map((d, i) => d3.hierarchy(props.data).sum(d => d.values ? Math.round(d.values[i]) : 0).value));
    const layout = useCallback((index) => {
        const k = Math.sqrt(root.sum(d => d.values ? d.values[index] : 0).value / max);
        const x = (1 - k) / 2 * props.width;
        const y = (1 - k) / 2 * props.height;
        return treemap.size([props.width * k, props.height * k])(root)
            .each(d => {
                d.x0 += x;
                d.x1 += x;
                d.y0 += y;
                d.y1 += y
            })
    }, [root, max, treemap, props.width, props.height]);

    const startAnimation = useCallback((index) => {
        const formatNumber = d3.format(",d");
        const parseNumber = string => +string.replace(/,/g, "");
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
            .call(leaf => leaf.select("text tspan:last-child")
                .tween("text", function (d) {
                    const i = d3.interpolate(parseNumber(this.textContent), d.value);
                    return function (t) {
                        this.textContent = formatNumber(i(t));
                    };
                }));
        let parent = d3.selectAll([...parentRef.current.childNodes]);
        parent.data(layout(index).children).transition()
            .duration(props.duration)
            .ease(d3.easeLinear)
            .attr("transform", d => `translate(${d.x0 + 2},${(d.y1 + d.y0) / 2})`)
            .on("end", () => {
                setIndex(index);
            })
            .call(leaf => leaf.select("text tspan:last-child")
                .tween("text", function (d) {
                    const i = d3.interpolate(parseNumber(this.textContent), d.value);
                    return function (t) {
                        this.textContent = formatNumber(i(t));
                    };
                }));
    }, [leafRef, parentRef, layout, props.duration]);
    React.useEffect(() => {
        startAnimation(props.index);
    }, [props.index, startAnimation]);

    layout(index).children.forEach((parent, j) => {
        parents.push(
            <text key={parent.data.name}
                  transform={'translate(' + (parent.x0 + 2) + ',' + (parent.y0 + parent.y1) / 2 + ')'} fontSize={20}
                  fontWeight='bold' opacity={0.3}>
                {parent.data.name}
            </text>);
        parent.children.forEach((child, i) => {
            const fill = props.color(parent.data.name);
            const id = j + '-' + i;
            children.push(
                <g key={child.data.name} transform={'translate(' + child.x0 + ',' + child.y0 + ')'}>
                    <rect id={"rect" + id} width={child.x1 - child.x0} height={child.y1 - child.y0}
                          fill={fill}/>
                    <defs>
                        <clipPath id={"clip" + id}>
                            <use xlinkHref={"#rect" + id}/>
                        </clipPath>
                    </defs>

                    <text clipPath={'url(#clip' + id + ')'} x={2} y={10} fontSize={10}>
                        {child.data.name}
                    </text>
                    <title>
                        {child.data.name}
                    </title>
                </g>
            );
        })
    });
    return (
        <svg width={props.width} height={props.height}>
            <g ref={leafRef}>{children}</g>
            <g ref={parentRef}>{parents}</g>
        </svg>
    );
}

AnimatedTreemap.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    data: PropTypes.objectOf(PropTypes.array)
};
AnimatedTreemap.defaultProps = {
    width: 900,
    height: 600,
};
export default AnimatedTreemap;