import React from 'react';
import LineChart from "./SimpleCharts/MiniLineChart";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import BarChart from "./SimpleCharts/MiniBarChart";
import {Typography} from "@material-ui/core";

const TermTooltip = inject("dataStore", "visStore")(observer((props) => {
    let condLegend = props.dataStore.conditions.map((cond, i) => <span>{i + 1 + ": " + cond}<br/></span>)
    return (<div style={{overflow: "auto"}}>
        <Typography>{props.dataStore.dataTable[props.id].description}</Typography>
        List comparison:
        <div>
            <div style={{color: "black", float: "left"}}>
                {props.isTimeseries ? <LineChart width={150} height={60} color={props.color}
                                                 values={props.dataStore.dataTable[props.id].pvalues}
                                                 sigThreshold={props.dataStore.rootStore.sigThreshold}
                                                 logSigThreshold={props.logSigThreshold}/> :
                    <BarChart width={150} height={60} color={props.color}
                              values={props.dataStore.dataTable[props.id].pvalues}
                              sigThreshold={props.dataStore.rootStore.sigThreshold}
                              logSigThreshold={props.logSigThreshold}/>}
            </div>
            <div style={{float: "left"}}>
                {condLegend}
            </div>
        </div>
        <div style={{float: "left"}}>
            Gene set information: <br/>
            {"Set size: " + props.setSize + (props.total !== undefined ? props.up !== undefined
                ? ", Pos: " + (props.up) + " Neg: " + (props.down)
                + " Median:" + (Math.round(props.median * 100) / 100) :
                " Expressed: " + props.total : "")}
        </div>
    </div>)
}));
TermTooltip.propTypes = {
    id: PropTypes.string.isRequired,
    median: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
    isTimeseries: PropTypes.bool.isRequired,
};
export default TermTooltip;