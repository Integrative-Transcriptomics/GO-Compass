import React, {createRef, useEffect} from 'react';
import PropTypes from "prop-types";
import Box from "@material-ui/core/Box";
import {inject, observer, useLocalStore} from "mobx-react";
import {action} from "mobx";
import MultiBarChart from "./ComparisonMultiBarChart";
import {Lock, LockOpen} from "@material-ui/icons";
import Button from "@material-ui/core/Button";


const SimpleChart = inject("dataStore", "visStore")(observer((props) => {
    const store = useLocalStore(() => ({
        chartHeight: 150,
        scaleLocked: true,
        setChartHeight: action((height) => {
            store.chartHeight = height;
        }),
        setScaleLocked: action((isLocked) => {
            store.scaleLocked = isLocked
        })
    }));

    const rest = createRef();

    useEffect(() => {
        if (rest.current != null) {
            store.setChartHeight(props.height - rest.current.getBoundingClientRect().height);
        }
    }, [rest, store, props.height]);

    return (
        <Box>
            <div ref={rest}>
                <Button
                    onClick={() => store.setScaleLocked(!store.scaleLocked)} variant="contained"
                    startIcon={store.scaleLocked ? <LockOpen/> : <Lock/>}>
                    {store.scaleLocked ? "Unlock y-Scale" : "Lock y-Scale"}
                </Button>
            </div>
            <MultiBarChart width={props.width}
                           height={store.chartHeight}
                           sigThreshold={props.sigThreshold}
                           logSigThreshold={props.logSigThreshold}
                           scaleLocked={store.scaleLocked}/> </Box>
    );
}));

SimpleChart.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    sigThreshold: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};
export default SimpleChart;

