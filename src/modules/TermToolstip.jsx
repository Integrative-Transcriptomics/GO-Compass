import React from 'react';
import LineChart from "./SimpleCharts/MiniLineChart";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";

const TermTooltip = inject("dataStore", "visStore")(observer((props) => {
    return (<div>
        {props.dataStore.dataTable[props.id].description}
        <div style={{color:"black"}}>
            <LineChart width={150} height={60} color={props.color}
                       values={props.dataStore.dataTable[props.id].pvalues}
                       sigThreshold={props.dataStore.rootStore.sigThreshold} logSigThreshold={props.logSigThreshold}/>
    </div>
        </div>)
}));
TermTooltip.propTypes = {
    id: PropTypes.string.isRequired,
    sigThreshold: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};
export default TermTooltip;