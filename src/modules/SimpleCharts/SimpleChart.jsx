import React, {useState} from 'react';
import PropTypes from "prop-types";
import StackedBarChart from "./StackedBarChart";
import LineChart from "./LineChart";
import StreamGraph from "./StreamGraph";
import * as d3 from "d3";
import Box from "@material-ui/core/Box";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";


function SimpleChart(props) {
    const [showOverview, setShowOverview] = useState(true);
    const mapper = new Map();
    let chart;
    const data = props.data.children.map(parent => {
        const values = props.data.keys.map((d, i) => {
            let current = 0;
            parent.children.forEach(child => {
                if (showOverview || props.childHighlight === null || props.childHighlight === child.name) {
                    mapper.set(child.name, {parent: parent.name, values: child.values});
                    current += child.values[i];
                }
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
            if (showOverview || props.childHighlight === null) {
                tpData[parent.name] = d3.sum(parent.children.map(child => child.values[i]));
            } else {
                tpData[parent.name] = d3.sum(parent.children
                    .filter(child => props.childHighlight === child.name)
                    .map(child => child.values[i]));
            }
        });
        return tpData
    });
    if (props.datatype === "conditions") {
        chart = <StackedBarChart width={props.width}
                                 showOverview={showOverview}
                                 sigThreshold={props.sigThreshold}
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
                           showOverview={showOverview}
                           sigThreshold={props.sigThreshold}
                           parentHighlight={props.parentHighlight}
                           childHighlight={props.childHighlight}
                           setParentHighlight={props.setParentHighlight}
                           data={{keys: props.data.keys, children: data}}
                           mapper={mapper}
                           index={props.index} setIndex={props.setIndex} color={props.color} duration={props.duration}/>
        } else {
            chart =
                <StreamGraph width={props.width}
                             showOverview={showOverview}
                             sigThreshold={props.sigThreshold}
                             parentHighlight={props.parentHighlight}
                             childHighlight={props.childHighlight}
                             setParentHighlight={props.setParentHighlight}
                             data={{keys: [...keys], timepoints: props.data.keys, values: stackedChildren}}
                             mapper={mapper} index={props.index} setIndex={props.setIndex} color={props.color}
                             duration={props.duration}/>
        }
    }
    return (
        <Box>
            <FormControlLabel
                control={<Switch checked={showOverview} onChange={() => setShowOverview(!showOverview)}
                                 name="checkedA"/>}
                label="Overview"
            />
            {chart}
        </Box>
    );
}

SimpleChart.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number,
    data: PropTypes.object.isRequired,
    color: PropTypes.func.isRequired,
    parentHighlight: PropTypes.string,
    childHighlight: PropTypes.string,
    setParentHighlight: PropTypes.func.isRequired,
    plottype: PropTypes.string.isRequired,
    datatype: PropTypes.string.isRequired,
    index: PropTypes.number.isRequired,
    setIndex: PropTypes.func.isRequired,
    duration: PropTypes.number.isRequired,
};
SimpleChart.defaultProps = {
    height: 350,
    parentHighlight: null,
    childHighlight: null,
};
export default SimpleChart;

