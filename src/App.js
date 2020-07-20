import React, {useCallback, useState} from 'react';
import Plots from "./modules/Plots";
import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Typography from "@material-ui/core/Typography";
import {createStyles} from "@material-ui/core";
import {makeStyles} from "@material-ui/core/styles";
import SelectData from "./modules/SelectData";
import TextField from "@material-ui/core/TextField";
import {inject, observer} from "mobx-react";
import Slider from "@material-ui/core/Slider";
import Drawer from "@material-ui/core/Drawer";
import ListItem from "@material-ui/core/ListItem";
import List from "@material-ui/core/List";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from '@material-ui/icons/Menu';
import ListSubheader from "@material-ui/core/ListSubheader";


const App = inject("dataStore", "visStore")(observer((props) => {
    const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            root: {
                flexGrow: 1,
            },
            menuButton: {
                marginRight: theme.spacing(2),
            },
            title: {
                flexGrow: 1,
            },
        }),
    );
    const [open, setOpen] = useState(false);
    const [selectedSpecies, selectSpecies] = useState(null);
    const [pvalueFilter, setPvalueFilter] = useState(0.5);

    const handleChange = useCallback((e, value) => {
        props.dataStore.setClusterCutoff(value[0]);
        props.dataStore.setFilterCutoff(value[1]);
    },[props.dataStore]);
    const toggleDrawer = useCallback(() => {
        setOpen(!open);
    }, [open]);

    const classes = useStyles();
    return (
        <div className={classes.root}>
            <React.Fragment>
                <AppBar position="sticky">
                    <Toolbar>
                        <IconButton onClick={toggleDrawer} disabled={!props.dataStore.isLoaded}>
                            <MenuIcon/>
                        </IconButton>
                        <Typography className={classes.title} variant="h6">
                            GO Comparison Dashboard
                        </Typography>

                    </Toolbar>
                </AppBar>
            </React.Fragment>
            <React.Fragment>
                <Drawer anchor={"left"} open={open} onClose={toggleDrawer}>
                    <List>
                        <ListItem>
                            <TextField
                                id="standard-number"
                                label="Significance Threshold"
                                type="number"
                                value={props.visStore.sigThreshold}
                                onChange={(e) => props.visStore.setSigThreshold(e.target.value)}
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
                        <ListSubheader>
                            Select cutoffs
                        </ListSubheader>
                        <ListItem>
                            <Slider value={[props.dataStore.clusterCutoff, props.dataStore.filterCutoff]} min={0}
                                    step={0.01}
                                    max={1}
                                    valueLabelDisplay="auto"
                                    onChange={handleChange}/>
                        </ListItem>
                    </List>
                </Drawer>
            </React.Fragment>
            {props.dataStore.isLoaded ?
                <Plots selectedSpecies={selectedSpecies}
                       pvalueFilter={pvalueFilter}/> :
                <SelectData selectSpecies={selectSpecies}
                            setPvalueFilter={setPvalueFilter}
                            selectedSpecies={selectedSpecies}
                            pvalueFilter={pvalueFilter}/>}
        </div>
    );
}));

export default App;
