import React from "react";
import {observer} from "mobx-react";
import PropTypes from "prop-types";

const SignificanceLine = observer((props) => {
    return (<g transform={"translate(0," + props.height + ")"}>
        <line x1={0} x2={props.width} y1={0}
              y2={0} fill="none" stroke="black" strokeDasharray="4"/>
        <text x={2} y={-3}>{"p=" + props.sigThreshold}</text>
    </g>)

});
SignificanceLine.propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    sigThreshold: PropTypes.number.isRequired,
};
export default SignificanceLine;