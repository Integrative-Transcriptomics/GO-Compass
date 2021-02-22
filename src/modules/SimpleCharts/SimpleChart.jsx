import React, {createRef, useCallback, useEffect} from 'react';
import PropTypes from "prop-types";
import StackedBarChart from "./StackedBarChart";
import LineChart from "./LineChart";
import StreamGraph from "./StreamGraph";
import Box from "@material-ui/core/Box";
import {inject, observer} from "mobx-react";
import PlayButton from "../PlayButton";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import {useLocalStore} from "mobx-react";
import {action} from "mobx";


const SimpleChart = inject("dataStore", "visStore")(observer((props) => {
    const store = useLocalStore(() => ({
        anchorEl: null,
        chartHeight: 100,
        setAnchorEl: action((el) => {
            store.anchorEl = el;
        }),
        setChartHeight:action((height) => {
            store.chartHeight = height;
        }),
        get mapper() {
            const mapper = new Map();
            props.dataStore.nestedData.forEach(parent => {
                parent.children.forEach(child => {
                    mapper.set(child.id, {parent: parent.id, values: child.values});
                });
            });
            return mapper;
        },
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
    if (!props.isTimeSeries) {
        chart = <StackedBarChart width={props.width}
                                 height={store.chartHeight}
                                 mapper={store.mapper}
                                 sigThreshold={props.sigThreshold}/>
    } else {
        if (props.visStore.tsPlotType === 'lineChart') {
            chart =
                <LineChart width={props.width}
                           height={store.chartHeight}
                           mapper={store.mapper}
                           sigThreshold={props.sigThreshold}/>
        } else {
            chart =
                <StreamGraph width={props.width}
                             height={store.chartHeight}
                             mapper={store.mapper}
                             sigThreshold={props.sigThreshold}/>
        }
    }
    return (
        <Box>
            <div ref={rest}>
                {props.isTimeSeries ?
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
            </div>
            {chart}
        </Box>
    );
}));

SimpleChart.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    sigThreshold: PropTypes.number.isRequired,
};
export default SimpleChart;

