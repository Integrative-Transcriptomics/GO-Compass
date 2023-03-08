import React, {useState} from "react";
import PropTypes from 'prop-types';
import SmallTreemap from "./SmallTreemap";
import {inject, observer} from "mobx-react";
import Typography from "@material-ui/core/Typography";


/**
 * @return {null}
 */
const SmallMultiples = inject("dataStore", "visStore")(observer((props) => {
    const [isHovered, setIsHovered] = useState(-1);
    const treemaps = props.dataStore.conditions.map((key, i) => {
        return (<div key={key} style={{float: "right", cursor: "pointer"}}
                     onClick={() => props.visStore.setConditionIndex(i)}
                     onMouseEnter={() => setIsHovered(i)} onMouseLeave={() => setIsHovered(-1)}>
            <Typography style={{fontWeight: isHovered === i ? 600 : 400}}>{key}</Typography>
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