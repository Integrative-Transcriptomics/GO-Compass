import React, {createRef, useEffect} from 'react';
import PropTypes from "prop-types";
import LineChart from "./LineChartRepresentative";
import StreamGraph from "./StreamGraph";
import Box from "@material-ui/core/Box";
import {inject, observer, useLocalStore} from "mobx-react";
import PlayButton from "../PlayButton";
import {action} from "mobx";
import MultiBarChart from "./MultiBarChart";
import {Lock, LockOpen} from "@material-ui/icons";
import Button from "@material-ui/core/Button";


const SimpleChart = inject("dataStore", "visStore")(observer((props) => {
    const store = useLocalStore(() => ({
        anchorEl: null,
        chartHeight: 100,
        scaleLocked: false,
        setAnchorEl: action((el) => {
            store.anchorEl = el;
        }),
        setChartHeight: action((height) => {
            store.chartHeight = height;
        }),
        setScaleLocked: action((isLocked) => {
            store.scaleLocked = isLocked
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

    /*const selectPlottype = useCallback((plotType) => {
        store.setAnchorEl(null);
        props.visStore.setTsPlotType(plotType);
    }, [props.visStore, store]);*/

    let chart;
    if (!props.isTimeSeries) {
        chart = <MultiBarChart width={props.width}
                               height={store.chartHeight}
                               sigThreshold={props.sigThreshold}
                               logSigThreshold={props.logSigThreshold}
                               scaleLocked={store.scaleLocked}/>
    } else {
        if (props.visStore.tsPlotType === 'lineChart') {
            chart =
                <LineChart width={props.width}
                           height={store.chartHeight}
                           mapper={store.mapper}
                           sigThreshold={props.sigThreshold}
                           logSigThreshold={props.logSigThreshold}
                           scaleLocked={store.scaleLocked}/>
        } else {
            chart =
                <StreamGraph width={props.width}
                             height={store.chartHeight}
                             mapper={store.mapper}/>
        }
    }
    return (
        <Box>
            <div ref={rest}>
                {props.isTimeSeries ?
                    <PlayButton/> : null}

                {/**
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
                 </Menu>                         **/}
                <Button
                    onClick={() => store.setScaleLocked(!store.scaleLocked)} variant="contained"
                    startIcon={store.scaleLocked ? <LockOpen/> : <Lock/>}>
                    {store.scaleLocked ? "Unlock y-Scale" : "Lock y-Scale"}
                </Button>
            </div>
            {chart}
        </Box>
    );
}));

SimpleChart.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    sigThreshold: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};
export default SimpleChart;

