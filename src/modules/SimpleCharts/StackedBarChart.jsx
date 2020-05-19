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

    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    const xScale = d3.scaleBand().domain([...Array(props.data.timepoints.length).keys()]).range([0, width]).padding(0.25);
    const yScale = d3.scaleLinear().domain([0, d3.max(series, function (d) {
        return d3.max(d, function (d) {
            return d[1];
        });
    })]).range([height, 0]);
    const highlighters = props.data.timepoints.map((timepoint, i) => {
        const max = d3.max(series.map(category => category[i][1]));
        return <rect onClick={() => props.setIndex(i)} key={timepoint} opacity={i === index ? 1 : 0}
                     height={height - yScale(max)}
                     width={xScale.bandwidth()}
                     x={xScale(i)} y={yScale(max)} fillOpacity='0' stroke='black' strokeWidth='2px'/>
    });
    const rects = series.map((category) =>
        category.map((timepoint, i) => {
            return <rect key={category.key + i} x={xScale(i)} y={yScale(timepoint[1])} width={xScale.bandwidth()}
                         height={yScale(timepoint[0]) - yScale(timepoint[1])} fill={props.color(category.key)}/>
        })
    );
    const startAnimation = useCallback((index) => {
        let els = d3.selectAll([...highlightRef.current.childNodes]);
        els.transition()
            .duration(props.duration)
            .attr('opacity', (d, i) => i === index ? 1 : 0)
            .on('end', () => setIndex(index));
    }, [highlightRef, props.duration]);
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
                {rects}
                <g ref={highlightRef}>{highlighters}</g>
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

