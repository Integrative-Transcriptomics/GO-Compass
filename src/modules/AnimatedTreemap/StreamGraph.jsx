import React, {useCallback, useState} from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import Axis from "./Axis";


function StackedBarChart(props) {
    const [index, setIndex] = useState(0);
    const highlightRef = React.createRef();
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
        .x((d,i) => xScale(i))
        .y0(d => yScale(d[0]))
        .y1(d => yScale(d[1]));

    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    //const max = d3.max(props.data.timepoints.map((d, i) => d3.sum(props.data.values.map(child => child.values[i]))));
    const xScale = d3.scalePoint().domain([...Array(props.data.timepoints.length).keys()]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0, d3.max(series, function (d) {
        return d3.max(d, function (d) {
            return d[1];
        });
    })]).range([height, 0]);
    const paths = series.map((d) =>
        <path key={d.key } fill={props.color(d.key)} d={area(d)}/>
    );
    const highlighter = <line ref={highlightRef} x1={xScale(index)} x2={xScale(index)} y1={0} y2={height} fill='none'
                              stroke='black' strokeWidth={1}/>;
    const startAnimation = useCallback((index) => {
        let el = d3.select(highlightRef.current);
        el.transition()
            .duration(props.duration)
            .ease(d3.easeLinear)
            .attr("x1", xScale(index))
            .attr("x2", xScale(index))
            .on("end", () =>
                setIndex(index)
            );
    }, [highlightRef, xScale, props.duration]);
    React.useEffect(() => {
        startAnimation(props.index);
    }, [props.index, startAnimation]);
    const xAxis = d3.axisBottom()
        .scale(xScale)
        .tickFormat(d => props.data.timepoints[d]);
    const yAxis = d3.axisLeft()
        .scale(yScale);
    return (
        <svg width={props.width}
             height={props.height}>
            <g transform={'translate(' + margins.left + ',' + margins.top + ')'}>
                <Axis h={height} w={width} axis={xAxis} axisType={'x'} label={'Condition'}/>
                <Axis h={height} w={width} axis={yAxis} axisType={'y'} label={'-log10pVal'}/>
                {paths}
                {highlighter}
            </g>
        </svg>
    );
}

StackedBarChart.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    data: PropTypes.objectOf(PropTypes.array).isRequired,
    color: PropTypes.func.isRequired
};
StackedBarChart.defaultProps = {
    width: 900,
    height: 350,
};
export default StackedBarChart;

