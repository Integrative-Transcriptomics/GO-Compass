import React from "react";
import PropTypes from 'prop-types';
import SmallTreemap from "./SmallTreemap";
import {inject, observer} from "mobx-react";
import Typography from "@material-ui/core/Typography";


/**
 * @return {null}
 */
const SmallMultiples = inject("dataStore", "visStore")(observer((props) => {
    const treemaps = props.dataStore.conditions.map((key, i) => {
        return (<div key={key} style={{float: "right"}}>
            <Typography>{key}</Typography>
            <SmallTreemap logSigThreshold={props.logSigThreshold}
                          index={i} scalingFactor={props.scalingFactor}/>
        </div>);
    });
    return <div> {treemaps}</div>
}));

SmallMultiples.propTypes = {
    scalingFactor: PropTypes.number.isRequired,
    logSigThreshold: PropTypes.number.isRequired,
};
export default SmallMultiples;