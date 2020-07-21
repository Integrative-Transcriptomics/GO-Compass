import React, {useCallback, useState} from 'react';
import Plots from "./modules/Plots";
import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import {createStyles} from "@material-ui/core";
import {makeStyles} from "@material-ui/core/styles";
import SelectData from "./modules/SelectData";
import {Provider} from "mobx-react";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from '@material-ui/icons/Menu';
import AppDrawer from "./modules/AppDrawer";


const App = () => {
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
    const [dataStore, setDataStore] = useState(null);


    const toggleDrawer = useCallback(() => {
        setOpen(!open);
    }, [open]);
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <React.Fragment>
                <AppBar position="sticky">
                    <Toolbar>
                        <IconButton onClick={toggleDrawer} disabled={dataStore === null}>
                            <MenuIcon/>
                        </IconButton>
                        <Typography className={classes.title} variant="h6">
                            GO Comparison Dashboard
                        </Typography>

                    </Toolbar>
                </AppBar>
            </React.Fragment>
            {dataStore !== null ?
                <Provider dataStore={dataStore} visStore={dataStore.visStore}>
                    <Plots selectedSpecies={selectedSpecies}
                           pvalueFilter={pvalueFilter}/>
                    <AppDrawer open={open} toggleDrawer={toggleDrawer}/>
                </Provider> :
                <SelectData setDataStore={setDataStore}
                            selectSpecies={selectSpecies}
                            setPvalueFilter={setPvalueFilter}
                            selectedSpecies={selectedSpecies}
                            pvalueFilter={pvalueFilter}/>}
        </div>
    );
};

export default App;
