import React, {useCallback, useEffect, useState} from 'react';
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
    const [dataStore, setDataStore] = useState(null);

    const appBar = React.createRef();

    useEffect(() => {
        if (appBar.current != null && dataStore !== null) {
            dataStore.visStore.setPlotHeight(window.innerHeight - appBar.current.getBoundingClientRect().height);
        }
    }, [appBar, dataStore]);


    const toggleDrawer = useCallback(() => {
        setOpen(!open);
    }, [open]);
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <React.Fragment>
                <AppBar ref={appBar} position="sticky" style={{backgroundColor: "#A51E37"}}>
                    <Toolbar>
                        <IconButton onClick={toggleDrawer} disabled={dataStore === null}>
                            <MenuIcon style={{ color: "white" }}/>
                        </IconButton>
                        <Typography className={classes.title} variant="h6">
                            GO Comparison Dashboard
                        </Typography>

                    </Toolbar>
                </AppBar>
            </React.Fragment>
            {dataStore !== null ?
                <Provider dataStore={dataStore} visStore={dataStore.visStore}>
                    <Plots/>
                    <AppDrawer open={open} toggleDrawer={toggleDrawer}/>
                </Provider> :
                <SelectData setDataStore={setDataStore}/>}
        </div>
    );
};

export default App;
