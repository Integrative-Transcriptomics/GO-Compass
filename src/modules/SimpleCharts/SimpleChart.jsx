import React from 'react';
import PropTypes from "prop-types";
import StackedBarChart from "./StackedBarChart";
import LineChart from "./LineChart";
import StreamGraph from "./StreamGraph";
import * as d3 from "d3";


function SimpleChart(props) {
    const mapper = new Map();
    let chart;
    const data = props.data.children.map(parent => {
        const values = props.data.keys.map((d, i) => {
            let current = 0;
            parent.children.forEach(child => {
                mapper.set(child.name, {parent: parent.name, values: child.values});
                current += child.values[i];
            });
            return current;
        });
        return ({name: parent.name, values: values});
    });
    const keys = new Set();
    const stackedChildren = props.data.keys.map((d, i) => {
        const tpData = {};
        props.data.children.forEach(parent => {
            keys.add(parent.name);
            tpData[parent.name] = d3.sum(parent.children.map(child => child.values[i]));
        });
        return tpData
    });
    if (props.datatype === "conditions") {
        chart = <StackedBarChart width={props.width}
                                 parentHighlight={props.parentHighlight}
                                 childHighlight={props.childHighlight}
                                 setParentHighlight={props.setParentHighlight}
                                 data={{keys: [...keys], timepoints: props.data.keys, values: stackedChildren}}
                                 mapper={mapper}
                                 index={props.index} setIndex={props.setIndex} color={props.color}
                                 duration={props.duration}/>
    } else {
        if (props.plottype === 'lineChart') {
            chart =
                <LineChart width={props.width}
                           parentHighlight={props.parentHighlight}
                           childHighlight={props.childHighlight}
                           setParentHighlight={props.setParentHighlight}
                           data={{keys: props.data.keys, children: data}}
                           mapper={mapper}
                           index={props.index} setIndex={props.setIndex} color={props.color} duration={props.duration}/>
        } else {
            chart =
                <StreamGraph width={props.width}
                             parentHighlight={props.parentHighlight}
                             childHighlight={props.childHighlight}
                             setParentHighlight={props.setParentHighlight}
                             data={{keys: [...keys], timepoints: props.data.keys, values: stackedChildren}}
                             mapper={mapper} index={props.index} setIndex={props.setIndex} color={props.color}
                             duration={props.duration}/>
        }
    }
    return (
        chart
    );
}

SimpleChart.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    data: PropTypes.objectOf(PropTypes.array),
    color: PropTypes.func.isRequired
};
SimpleChart.defaultProps = {
    width: 900,
    height: 350,
};
export default SimpleChart;

