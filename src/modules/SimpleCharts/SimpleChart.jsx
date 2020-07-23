import React, {createRef, useCallback, useEffect} from 'react';
import PropTypes from "prop-types";
import StackedBarChart from "./StackedBarChart";
import LineChart from "./LineChart";
import StreamGraph from "./StreamGraph";
import * as d3 from "d3";
import Box from "@material-ui/core/Box";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import {inject, observer} from "mobx-react";
import Legend from "../Legend";
import PlayButton from "../PlayButton";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import {useLocalStore} from "mobx-react";


const SimpleChart = inject("dataStore", "visStore")(observer((props) => {
    const store = useLocalStore(() => ({
        anchorEl: null,
        chartHeight: 100,
        setAnchorEl(el) {
            this.anchorEl = el;
        },
        setChartHeight(height) {
            this.chartHeight = height;
        },
        get mapper() {
            const mapper = new Map();
            props.dataStore.nestedData.forEach(parent => {
                parent.children.forEach(child => {
                    mapper.set(child.id, {parent: parent.id, values: child.values});
                });
            });
            return mapper;
        },
        get stackedData() {
            const stackedChildren = props.dataStore.conditions.map((d, i) => {
                const tpData = {};
                props.dataStore.nestedData.forEach(parent => {
                    if (props.visStore.showOverview || props.visStore.childHighlight === null) {
                        tpData[parent.id] = d3.sum(parent.children.map(child => child.values[i]));
                    } else {
                        tpData[parent.id] = d3.sum(parent.children
                            .filter(child => props.visStore.childHighlight === child.id)
                            .map(child => child.values[i]));
                    }
                });
                return tpData
            });
            return stackedChildren;
        },
        get lineData(){
            const lineData = [];
            props.dataStore.nestedData.forEach(parent => {
                let add = false;
                const values = props.dataStore.conditions.map((d, i) => {
                    let current = 0;
                    parent.children.forEach(child => {
                        if (props.visStore.showOverview || props.visStore.childHighlight === null || props.visStore.childHighlight === child.id) {
                            add = true;
                            current += child.values[i];
                        }
                    });
                    return current;
                });
                if (add) {
                    lineData.push({id: parent.id, name: parent.name, values: values});
                }
            });
            return lineData;
        }
    }));

    const rest = createRef();

    useEffect(() => {
        if (rest.current != null) {
            store.setChartHeight(props.height - rest.current.getBoundingClientRect().height);
        }
    }, [rest, store, props.height]);

    const selectPlottype = useCallback((plotType) => {
        store.setAnchorEl(null);
        props.visStore.setTsPlotType(plotType);
    }, [props.visStore, store]);

    let chart;
    if (!props.visStore.isTimeSeries) {
        chart = <StackedBarChart width={props.width}
                                 height={store.chartHeight}
                                 data={store.stackedData}
                                 mapper={store.mapper}/>
    } else {
        if (props.visStore.tsPlotType === 'lineChart') {
            chart =
                <LineChart width={props.width}
                           height={store.chartHeight}
                           data={store.lineData}
                           mapper={store.mapper}/>
        } else {
            chart =
                <StreamGraph width={props.width}
                             height={store.chartHeight}
                             data= {store.stackedData}
                             mapper={store.mapper}/>
        }
    }
    return (
        <Box>
            <div ref={rest}>
                <Legend width={props.width}/>
                {props.visStore.isTimeSeries ?
                    <div>
                        <PlayButton/>
                        <Button aria-controls="simple-menu" aria-haspopup="true"
                                onClick={(event) => store.setAnchorEl(event.currentTarget)}>
                            Plot Type
                        </Button>
                        <Menu
                            id="simple-menu"
                            anchorEl={store.anchorEl}
                            keepMounted
                            open={Boolean(store.anchorEl)}
                            onClose={() => store.setAnchorEl(null)}
                        >
                            <MenuItem onClick={() => selectPlottype('lineChart')}>Line Chart</MenuItem>
                            <MenuItem onClick={() => selectPlottype('streamGraph')}>Streamgraph</MenuItem>
                        </Menu></div> : null
                }
                <FormControlLabel
                    control={<Switch checked={props.visStore.showOverview}
                                     onChange={() => props.visStore.toggleShowOverview()}/>}
                    label="Overview"
                />
            </div>
            {chart}
        </Box>
    );
}));

SimpleChart.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
};
export default SimpleChart;

