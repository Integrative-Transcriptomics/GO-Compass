import React, {useCallback, useEffect, useState} from 'react';
import Plots from "./modules/Plots";
import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import {createStyles, Theme} from "@material-ui/core";
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
    const [rootStore, setRootStore] = useState(null);

    const appBar = React.createRef();

    useEffect(() => {
        if (appBar.current != null && rootStore !== null) {
            rootStore.dataStores[rootStore.ontology].visStore.setPlotHeight(window.innerHeight - appBar.current.getBoundingClientRect().height);
        }
    }, [appBar, rootStore]);


    const toggleDrawer = useCallback(() => {
        setOpen(!open);
    }, [open]);
    const classes = useStyles();
    let views = [];
    // create one view for each ontology
    if (rootStore !== null) {
        rootStore.ontologies.forEach(ont => {
            views.push(<div key={ont.id} style={{display: rootStore.ontology === ont.id ? "block" : "none"}}>
                <Provider dataStore={rootStore.dataStores[ont.id]} visStore={rootStore.dataStores[ont.id].visStore}>
                    <Plots logSigThreshold={rootStore.logSigThreshold} sigThreshold={rootStore.sigThreshold}
                           isTimeSeries={rootStore.isTimeSeries}/>
                </Provider>
            </div>)
        });
    }

    return (
        <div className={classes.root}>
            <React.Fragment>
                <AppBar ref={appBar} position="sticky" style={{backgroundColor: "#a51e37"}}>
                    <Toolbar>
                        <IconButton onClick={toggleDrawer} disabled={rootStore === null}>
                            <MenuIcon style={{color: "white"}}/>
                        </IconButton>
                        <Typography className={classes.title} variant="h6">
                            GO-Compass
                        </Typography>
                        {rootStore != null ?
                            <Typography>
                                {"Ontology: " + rootStore.ontologies_map[rootStore.ontology] + ", Method: "
                                + rootStore.selectedMeasure + ", p-Value Filter: " + rootStore.pvalueFilter}
                            </Typography> : null
                        }
                    </Toolbar>
                </AppBar>
            </React.Fragment>
            <React.Fragment>
                {rootStore !== null ? <Provider rootStore={rootStore}>
                    <AppDrawer open={open} toggleDrawer={toggleDrawer}/>
                </Provider> : null}
                {rootStore !== null ? views : <SelectData setRootStore={setRootStore}/>}
            </React.Fragment>
        </div>
    );
};

export default App;
