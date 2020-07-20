import React, {useState} from 'react';
import PropTypes from "prop-types";
import StackedBarChart from "./StackedBarChart";
import LineChart from "./LineChart";
import StreamGraph from "./StreamGraph";
import * as d3 from "d3";
import Box from "@material-ui/core/Box";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import {inject, observer} from "mobx-react";


const SimpleChart = inject("dataStore", "visStore")(observer((props) => {
    const [showOverview, setShowOverview] = useState(true);
    const mapper = new Map();
    let chart;
    const lineData = [];
    props.dataStore.nestedData.forEach(parent => {
        let add = false;
        const values = props.dataStore.conditions.map((d, i) => {
            let current = 0;
            parent.children.forEach(child => {
                if (showOverview || props.visStore.childHighlight === null || props.visStore.childHighlight === child.id) {
                    add = true;
                    mapper.set(child.id, {parent: parent.id, values: child.values});
                    current += child.values[i];
                }
            });
            return current;
        });
        if (add) {
            lineData.push({id: parent.id, name: parent.name, values: values});
        }
    });
    const parents = new Set();
    const stackedChildren = props.dataStore.conditions.map((d, i) => {
        const tpData = {};
        props.dataStore.nestedData.forEach(parent => {
            parents.add(parent.id);
            if (showOverview || props.visStore.childHighlight === null) {
                tpData[parent.id] = d3.sum(parent.children.map(child => child.values[i]));
            } else {
                tpData[parent.id] = d3.sum(parent.children
                    .filter(child => props.visStore.childHighlight === child.id)
                    .map(child => child.values[i]));
            }
        });
        return tpData
    });
    if (!props.visStore.isTimeSeries) {
        chart = <StackedBarChart width={props.width}
                                 showOverview={showOverview}
                                 data={{
                                     parents: [...parents],
                                     conditions: props.dataStore.conditions,
                                     values: stackedChildren
                                 }}
                                 mapper={mapper}/>
    } else {
        if (props.visStore.tsPlotType === 'lineChart') {
            chart =
                <LineChart width={props.width}
                           showOverview={showOverview}
                           data={{keys: props.dataStore.conditions, children: lineData}}
                           mapper={mapper}/>
        } else {
            chart =
                <StreamGraph width={props.width}
                             showOverview={showOverview}
                             data={{parents: [...parents], conditions: props.dataStore.conditions, values: stackedChildren}}
                             mapper={mapper}/>
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
}));

SimpleChart.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number,
};
SimpleChart.defaultProps = {
    height: 350,
};
export default SimpleChart;

