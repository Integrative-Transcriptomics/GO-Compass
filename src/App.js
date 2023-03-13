import React, {useEffect} from 'react';
import Plots from "./modules/Plots";
import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import {createStyles, FormControl, InputLabel, MenuItem, Select, Theme} from "@material-ui/core";
import {makeStyles} from "@material-ui/core/styles";
import SelectData from "./modules/SelectData";
import {observer, Provider} from "mobx-react";
import IconButton from "@material-ui/core/IconButton";
import GitHubIcon from "@material-ui/icons/GitHub";

const App = observer((props) => {
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
            input: {
                color: "white",
                borderColor: "white"
            },
            select: {
                color: "white",
                '&:before': {
                    borderColor: "white",
                },
                '&:after': {
                    borderColor: "white",
                }
            },
            icon: {
                fill: "white",
            },
        }),
    );
    const appBar = React.createRef();

    useEffect(() => {
        if (appBar.current != null && props.rootStore.initialized) {
            props.rootStore.dataStores[props.rootStore.ontology].visStore.setPlotHeight(window.innerHeight - appBar.current.getBoundingClientRect().height);
        }
    }, [appBar, props.rootStore.dataStores, props.rootStore.initialized, props.rootStore.ontology]);

    const classes = useStyles();
    let views = [];
    // create one view for each ontology
    props.rootStore.ontologies.forEach(ont => {
        if (props.rootStore.dataStores[ont.id] !== null) {
            views.push(<div key={ont.id} style={{display: props.rootStore.ontology === ont.id ? "block" : "none"}}>
                <Provider dataStore={props.rootStore.dataStores[ont.id]}
                          visStore={props.rootStore.dataStores[ont.id].visStore}>
                    <Plots logSigThreshold={props.rootStore.logSigThreshold} sigThreshold={props.rootStore.sigThreshold}
                           isTimeSeries={props.rootStore.isTimeSeries}/>
                </Provider>
            </div>)
        }
    });
    return (
        <div className={classes.root}>
            <React.Fragment>
                <AppBar ref={appBar} position="sticky" style={{backgroundColor: "#a51e37"}}>
                    <Toolbar>
                        <Typography className={classes.title} variant="h6">
                            GO-Compass
                        </Typography>
                        {props.rootStore.initialized ?
                            [<FormControl className={classes.menuButton}>
                                <InputLabel style={{color: "white"}}
                                >Ontology</InputLabel>
                                <Select
                                    className={classes.select}
                                    inputProps={{
                                        classes: {
                                            icon: classes.icon
                                        }
                                    }}
                                    value={props.rootStore.ontology}
                                    onChange={(e) => props.rootStore.setOntology(e.target.value)}
                                >
                                    {props.rootStore.ontologies.filter(ontology => props.rootStore.dataStores[ontology.id] !== null).map(ontology =>
                                        <MenuItem key={ontology.id}
                                                  value={ontology.id}>{ontology.name}</MenuItem>)}
                                </Select>
                            </FormControl>,
                                <FormControl className={classes.menuButton}>
                                <InputLabel style={{color: "white"}}
                                >Significance Threshold</InputLabel>
                                <Select
                                    className={classes.select}
                                    inputProps={{
                                        classes: {
                                            icon: classes.icon
                                        }
                                    }}
                                    value={props.rootStore.sigThreshold}
                                    onChange={(e) => props.rootStore.setSigThreshold(e.target.value)}
                                >
                                    {[0.05,0.01,0.005,0.001,0.0005,0.0001,0.00005,0.00001].map(pval =>
                                        <MenuItem key={pval}
                                                  value={pval}>{pval}</MenuItem>)}
                                </Select>
                            </FormControl>,
                                <Typography>
                                    {"Method: "
                                        + props.rootStore.selectedMeasure + ", p-Value Filter: " + props.rootStore.pvalueFilter + ", Documentation"}
                                </Typography>] : <Typography>{"Help:"}</Typography>}
                        <IconButton href="https://github.com/Integrative-Transcriptomics/GO-Compass"
                                    target="_blank"
                                    rel="noopener noreferrer"> <GitHubIcon style={{color: "white"}}/>
                        </IconButton>
                    </Toolbar>
                </AppBar>
            </React.Fragment>
            <React.Fragment>
                {props.rootStore.initialized && views.length > 0 ? views :
                    <SelectData setRootStore={props.rootStore.init}/>}
                {props.rootStore.initialized && views.length === 0 ?
                    <Typography>No significant results</Typography> : null}
            </React.Fragment>
        </div>
    );
});

export default App;
