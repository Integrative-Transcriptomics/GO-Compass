import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import TextField from "@material-ui/core/TextField";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Switch from "@material-ui/core/Switch";
import ListSubheader from "@material-ui/core/ListSubheader";
import Slider from "@material-ui/core/Slider";
import Drawer from "@material-ui/core/Drawer";
import React from "react";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";

const AppDrawer = inject("dataStore", "visStore")(observer((props) => {
    return (<Drawer anchor={"left"} open={props.open} onClose={props.toggleDrawer}>
        <List>
            <ListItem>
                <TextField
                    id="standard-number"
                    label="Significance Threshold"
                    type="number"
                    value={props.dataStore.visStore.sigThreshold}
                    onChange={(e) => props.dataStore.visStore.setSigThreshold(e.target.value)}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    size="small"
                    margin="dense"
                />
            </ListItem>
            <ListItem>
                <FormControlLabel
                    control={<Switch checked={props.visStore.isTimeSeries}
                                     onChange={() => props.visStore.toggleIsTimeSeries()}
                                     name="checkedA"/>}
                    label="Time Series Data"
                />
            </ListItem>
        </List>
    </Drawer>)
}));
AppDrawer.propTypes = {
    open: PropTypes.bool.isRequired,
    toggleDrawer: PropTypes.func.isRequired
};
export default AppDrawer;