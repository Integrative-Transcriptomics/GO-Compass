import React, {createRef, useCallback, useState} from "react";
import PropTypes from 'prop-types';
import * as d3 from "d3";


/**
 * @return {null}
 */
function Treemap(props) {
    const [highlighted, setIsHighlighted] = useState(false);
    const margins = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    };
    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    const highlightRect = createRef();


    const treemap = d3.treemap()
        .tile(d3.treemapResquarify)
        .size([width, height])
        .padding(d => d.height === 1 ? 1 : 0)
        .round(true);

    const root = treemap(d3.hierarchy(props.data)
        .sum(d => d.values ? d3.sum(d.values) : 0)
        .sort((a, b) => b.value - a.value));

    const max = d3.max(props.data.keys.map((d, i) => d3.hierarchy(props.data).sum(d => d.values ? Math.round(d.values[i]) : 0).value));
    const layout = useCallback((index) => {
        const k = Math.sqrt(root.sum(d => d.values ? d.values[index] : 0).value / max);
        const x = (1 - k) / 2 * width;
        const y = (1 - k) / 2 * height;
        return treemap.size([width * k, height * k])(root)
            .each(d => {
                d.x0 += x;
                d.x1 += x;
                d.y0 += y;
                d.y1 += y;
            })
    }, [root, max, treemap, width, height]);


    const currentLayout = layout(props.index);
    const children = currentLayout.children.map((parent, j) =>
        parent.children.map((child, i) => {
            const isHighlighted = (props.parentHighlight === null | props.parentHighlight === parent.data.name)
                & (props.childHighlight === null | props.childHighlight === child.data.name);
            const fill = props.color(parent.data.name);
            const id = j + '-' + i;
            return (
                <g key={child.data.name} transform={'translate(' + child.x0 + ',' + child.y0 + ')'}>
                    <rect onMouseEnter={() => props.setChildHighlight(child.data.name)}
                          onMouseLeave={() => props.setChildHighlight(null)}
                          onClick={() => props.setIndex(props.index)}
                          id={"rect" + id}
                          width={child.x1 - child.x0} height={child.y1 - child.y0}
                          fill={fill}
                          opacity={isHighlighted ? 1 : 0.5}/>
                    <title>
                        {child.data.name}
                    </title>
                </g>
            );
        })
    );
    const startAnimation = useCallback(() => {
        const willBeHighlighted = props.highlightIndex === props.index;
        d3.select(highlightRect.current).transition()
            .duration(props.duration)
            .attr('opacity', willBeHighlighted ? 1 : 0)
            .on('end',()=>setIsHighlighted(willBeHighlighted))
    }, [highlightRect, layout, props.duration]);
    React.useEffect(() => {
        startAnimation(props.index);
    }, [props.index, startAnimation]);
    return (
        <g transform={"translate(" + margins.left + "," + margins.top + ")"}>
            <text>{props.data.keys[props.index]}</text>
            <rect ref={highlightRect} x={currentLayout.x0} y={currentLayout.y0}
                  width={currentLayout.x1 - currentLayout.x0}
                  height={currentLayout.y1 - currentLayout.y0} stroke="black" strokeWidth={2} fill="none"
                  opacity={highlighted? 1 : 0}/>
            {children}
        </g>
    );
}

Treemap.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    data: PropTypes.objectOf(PropTypes.array)
};
Treemap.defaultProps = {
    width: 900,
    height: 600,
};
export default Treemap;