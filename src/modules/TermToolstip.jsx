import React from 'react';
import LineChart from "./SimpleCharts/MiniLineChart";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import BarChart from "./SimpleCharts/MiniBarChart";

const TermTooltip = inject("dataStore", "visStore")(observer((props) => {
    return (<div>
        {props.dataStore.dataTable[props.id].description}
        <div style={{color: "black"}}>
            {props.dataStore.rootStore.isTimeSeries ? <LineChart width={150} height={60} color={props.color}
                                                                 values={props.dataStore.dataTable[props.id].pvalues}
                                                                 sigThreshold={props.dataStore.rootStore.sigThreshold}
                                                                 logSigThreshold={props.logSigThreshold}/> :
                <BarChart width={150} height={60} color={props.color}
                          values={props.dataStore.dataTable[props.id].pvalues}
                          sigThreshold={props.dataStore.rootStore.sigThreshold}
                          logSigThreshold={props.logSigThreshold}/>}

        </div>
        {"Set size: " + props.setSize + (props.total !== undefined ? props.up !== undefined
            ? ", Up: " + (props.up) + " Down: " + (props.total - props.up) :
            " Expressed: " + props.total : "")}
    </div>)
}));
TermTooltip.propTypes = {
    id: PropTypes.string.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};
export default TermTooltip;