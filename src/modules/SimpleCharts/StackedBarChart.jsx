import React, {useCallback, useState} from 'react';
import PropTypes from "prop-types";
import * as d3 from "d3";
import Axis from "./Axis";
import {inject, observer} from "mobx-react";
import SignificanceLine from "./SignificanceLine";


const StackedBarChart = inject("dataStore", "visStore")(observer((props) => {
    const [index, setIndex] = useState(0);
    const highlightRef = React.createRef();
    const margins = {
        top: 20,
        right: 20,
        bottom: 40,
        left: 60,
    };
    const series = d3.stack()
        .keys(props.dataStore.clusterRepresentatives)
        (props.data);

    const width = props.width - margins.left - margins.right;
    const height = props.height - margins.top - margins.bottom;
    const xScale = d3.scaleBand().domain([...Array(props.dataStore.conditions.length).keys()]).range([0, width]).padding(0.25);
    const yScale = d3.scaleLinear().domain([0, d3.max(series, function (d) {
        return d3.max(d, function (d) {
            return d[1];
        });
    })]).range([height, 0]);
    const highlighters = props.dataStore.conditions.map((timepoint, i) => {
        const max = d3.max(series.map(category => category[i][1]));
        return <rect key={timepoint} opacity={i === index ? 1 : 0}
                     height={height - yScale(max)}
                     width={xScale.bandwidth()}
                     x={xScale(i)} y={yScale(max)} fill='none' stroke='black' strokeWidth='2px'/>
    });
    const rects = series.map((category) => {
        const isHighlighted = props.visStore.childHighlights.length === 0 | !props.visStore.showOverview;
        return category.map((timepoint, i) => {
            let childHighlightRect = null;
            if (props.visStore.showOverview && props.visStore.childHighlights.length !== 0
                && props.visStore.childHighlights.map(d => props.mapper.get(d).parent).includes(category.key)) {
                const sum = d3.sum(props.visStore.childHighlights
                    .filter(d => props.mapper.get(d).parent === category.key)
                    .map(d => props.mapper.get(d).values[i]));
                const childHeight = height - yScale(sum);
                childHighlightRect = <rect x={xScale(i)}
                                           y={yScale(timepoint[0]) - childHeight}
                                           fill={props.visStore.termColorScale(category.key)}
                                           width={xScale.bandwidth()}
                                           height={childHeight}/>
            }
            return <g key={category.key + i}>
                <rect onMouseEnter={() => props.visStore.setParentHighlight(category.key)}
                      onMouseLeave={() => props.visStore.setParentHighlight(null)}
                      onClick={() => props.visStore.setConditionIndex(i)} x={xScale(i)}
                      y={yScale(timepoint[1])} width={xScale.bandwidth()}
                      height={yScale(timepoint[0]) - yScale(timepoint[1])}
                      opacity={isHighlighted ? 1 : 0.5}
                      fill={props.visStore.termColorScale(category.key)}/>
                {childHighlightRect}
            </g>
        })
    });
    let sigLine = null;
    if (props.visStore.childHighlights.length === 1) {
        sigLine = <SignificanceLine width={width} height={yScale(-Math.log10(props.sigThreshold))}
                                    sigThreshold={props.sigThreshold}/>
    }
    const startAnimation = useCallback((index) => {
        let els = d3.selectAll([...highlightRef.current.childNodes]);
        els.transition()
            .duration(props.visStore.animationDuration)
            .attr('opacity', (d, i) => i === index ? 1 : 0)
            .on('end', () => setIndex(index));
    }, [highlightRef, props.visStore.animationDuration]);
    React.useEffect(() => {
        startAnimation(props.visStore.conditionIndex);
    }, [props.visStore.conditionIndex, startAnimation]);
    const xAxis = d3.axisBottom()
        .scale(xScale)
        .tickFormat(d => props.dataStore.conditions[d]);
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
                {sigLine}
            </g>
        </svg>
    );
}));

StackedBarChart.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    mapper: PropTypes.instanceOf(Map).isRequired,
    sigThreshold: PropTypes.number.isRequired,
};
export default StackedBarChart;

