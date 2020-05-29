import React, {useState} from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import Axis from "./Axis";
import LineHighlighter from "./LineHighlighter";


function StackedBarChart(props) {
    const [xPos, setXPos] = useState(0);
    const margins = {
        top: 20,
        right: 20,
        bottom: 40,
        left: 60,
    };
    const series = d3.stack()
        .keys(props.data.keys)
        (props.data.values);

    const area = d3.area()
        .x((d, i) => xScale(i))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]));

    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    const xScale = d3.scalePoint().domain([...Array(props.data.timepoints.length).keys()]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, d3.max(series, function (d) {
        return d3.max(d, function (d) {
            return d[1];
        });
    })]).range([height, 0]);
    let childHighlightPath = null;
    const paths = series.map((d) => {
            const isHighlighted = (props.parentHighlight === null | props.parentHighlight === d.key) & props.childHighlight === null;
            if (props.childHighlight !== null && props.mapper.get(props.childHighlight).parent === d.key) {
                const childD = props.data.timepoints.map((tp, i) => {
                    return [d[i][0], d[i][0] + props.mapper.get(props.childHighlight).values[i]]
                });
                childHighlightPath = <path fill={props.color(d.key)}
                                           d={area(childD)}/>
            }
            return <path onMouseEnter={() => props.setParentHighlight(d.key)}
                         onMouseLeave={() => props.setParentHighlight(null)}
                         key={d.key} fill={props.color(d.key)}
                         opacity={isHighlighted ? 1 : 0.5}
                         d={area(d)}/>
        }
    );
    const xAxis = d3.axisBottom()
        .scale(xScale)
        .tickFormat(d => props.data.timepoints[d]);
    const yAxis = d3.axisLeft()
        .scale(yScale);
    return (
        <svg width={props.width}
             height={props.height}
             onMouseMove={(e) => setXPos(e.pageX)}>
            <g transform={'translate(' + margins.left + ',' + margins.top + ')'}>
                <Axis h={height} w={width} axis={xAxis} axisType={'x'} label={'Condition'}/>
                <Axis h={height} w={width} axis={yAxis} axisType={'y'} label={'-log10pVal'}/>
                {paths}
                {childHighlightPath}
                <LineHighlighter width={width} height={height} xScale={xScale} xPos={xPos} index={props.index}
                                 setIndex={props.setIndex} duration={props.duration}/>
            </g>
        </svg>
    );
}

StackedBarChart.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    data: PropTypes.objectOf(PropTypes.array).isRequired,
    duration: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
    color: PropTypes.func.isRequired,
    parentHighlight: PropTypes.string,
    childHighlight: PropTypes.string,
    mapper: PropTypes.instanceOf(Map).isRequired,
    setIndex: PropTypes.func.isRequired,
    setParentHighlight: PropTypes.func.isRequired,
};
StackedBarChart.defaultProps = {
    width: 900,
    height: 350,
};
export default StackedBarChart;

