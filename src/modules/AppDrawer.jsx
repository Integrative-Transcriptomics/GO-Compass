import React from "react";
import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";
import {
    Drawer,
    FormControl,
    InputLabel,
    List,
    ListItem, MenuItem,
    Select,
    TextField
} from "@material-ui/core";

const AppDrawer = inject("rootStore")(observer((props) => {
    return (<Drawer anchor={"left"} open={props.open} onClose={props.toggleDrawer}>
        <List>
            <ListItem>
                <TextField
                    id="standard-number"
                    label="Significance Threshold"
                    type="number"
                    value={props.rootStore.sigThreshold}
                    onChange={(e) => props.rootStore.setSigThreshold(e.target.value)}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    size="small"
                    margin="dense"
                />
            </ListItem>
            <ListItem>
                <FormControl>
                    <InputLabel>Ontology</InputLabel>
                    <Select
                        value={props.rootStore.ontology}
                        onChange={(e) => props.rootStore.setOntology(e.target.value)}
                    >
                        {props.rootStore.ontologies.filter(ontology => props.rootStore.dataStores[ontology.id] !== null).map(ontology =>
                            <MenuItem key={ontology.id}
                                      value={ontology.id}>{ontology.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </ListItem>
            <ListItem>
            </ListItem>
        </List>
    </Drawer>)
}));
AppDrawer.propTypes = {
    open: PropTypes.bool.isRequired,
    toggleDrawer: PropTypes.func.isRequired
};
export default AppDrawer;