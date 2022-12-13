import {IconButton} from "@material-ui/core";
import React from "react";

function ButtonGroupIconButton(props) {
    // intercept props only implemented by `Button`
    const {disableElevation, fullWidth, variant, ...iconButtonProps} = props;
    return <IconButton {...iconButtonProps} />;
}
export default ButtonGroupIconButton