import React, {createRef, useCallback, useEffect, useState} from "react";
import Grid from "@material-ui/core/Grid";
import SimpleChart from "./SimpleCharts/SimpleChart";
import {makeStyles} from "@material-ui/core/styles";
import {createStyles, Tab, Tabs} from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import DataTable from "./DetailedTable/DataTable";
import CorrelationHeatmap from "./CorrelationHeatmap";
import {inject, observer, Provider} from "mobx-react";
import ClusteredHeatmap from "./ClusteredHeatmap/ClusteredHeatmap";
import Typography from "@material-ui/core/Typography";
import UpSet from "./UpSet";
import Treemap from "./AnimatedTreemap/Treemap";
import TabPanel from "./TabPanel";

/**
 * @return {null}
 */
const Plots = inject("dataStore", "visStore")(observer((props) => {
    const useStyles = makeStyles((theme) =>
        createStyles({
            root: {
                padding: 10,
                flexGrow: 1,
                backgroundColor: 'lightgray'
            },
            paper: {
                height: "100%",
                spacing: 1,
                textAlign: 'left',
                color: theme.palette.text.secondary,
                elevation: 3,
                position: "relative"
            },
        }),
    );
    const changeWidth = useCallback(() => {
        props.visStore.setScreenWidth(window.innerWidth)
    }, [props.visStore]);
    let detailedHeader;
    if (props.visStore.childHighlights.length === 0) {
        detailedHeader = "Category Overview"
    } else if (props.visStore.childHighlights.length === 1) {
        detailedHeader = "Highlighted Term: " + props.dataStore.dataTable[props.visStore.childHighlights[0]].description;
    } else {
        detailedHeader = "Subset Overview"
    }
    const tabRef = createRef();
    const classes = useStyles();
    const [selectedTab, setSelectedTab] = useState(0);
    const [tabHeight, setTabHeight] = useState(10)
    useEffect(() => {
        changeWidth();
        window.addEventListener("resize", changeWidth);
    }, [changeWidth]);
    useEffect(() => {
        if (tabRef.current !== null) {
            setTabHeight(tabRef.current.getBoundingClientRect().height)
        }
    }, [tabRef])
    return (
        <Grid className={classes.root} container spacing={1}>
            <Grid item xs={6}>
                <Paper className={classes.paper}>
                    <Typography>
                        Cutoff Selection in GO Dispensability Tree
                    </Typography>
                    <ClusteredHeatmap
                        logSigThreshold={props.logSigThreshold}
                        width={props.visStore.screenWidth / 2}
                        height={props.visStore.plotHeight / 2}
                    />
                </Paper>
            </Grid>
            <Grid item xs={6}>
                <Paper className={classes.paper}>
                    <Treemap logSigThreshold={props.logSigThreshold} height={props.visStore.plotHeight / 2}/>
                    <Typography align={"center"}>
                        {props.dataStore.conditions[props.visStore.conditionIndex]}
                    </Typography>
                </Paper>
            </Grid>
            <Grid item xs={6}>
                <Paper className={classes.paper}>
                    <Typography>
                        List Comparison
                    </Typography>
                    <Tabs ref={tabRef} value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
                        <Tab label="All GO-Terms"/>
                        <Tab label="Significant GO-Terms"/>
                    </Tabs>
                    <TabPanel value={selectedTab} index={0}>
                        {props.dataStore.correlationLoaded ?
                            <CorrelationHeatmap width={props.visStore.screenWidth / 2}
                                                height={props.visStore.plotHeight / 2 - tabHeight}
                            /> : null
                        }
                    </TabPanel>
                    <TabPanel value={selectedTab} index={1}>
                        <Provider upSetStore={props.dataStore.upSetStore}>
                            <UpSet width={props.visStore.screenWidth / 2}
                                   height={props.visStore.plotHeight / 2 - tabHeight}
                                   logSigThreshold={props.logSigThreshold}/>
                        </Provider>
                    </TabPanel>

                </Paper>
            </Grid>
            <Grid item xs={6}>
                <Paper className={classes.paper}>
                    <Typography>
                        {detailedHeader}
                    </Typography>
                    <SimpleChart sigThreshold={props.sigThreshold} logSigThreshold={props.logSigThreshold}
                                 isTimeSeries={props.isTimeSeries}
                                 width={props.visStore.screenWidth / 2} height={props.visStore.plotHeight / 2}/>
                </Paper>
            </Grid>
            <Grid item xs={12}>
                <Paper className={classes.paper}>
                    <Provider tableStore={props.dataStore.tableStore}>
                        <DataTable logSigThreshold={props.logSigThreshold}/>
                    </Provider>
                </Paper>
            </Grid>
        </Grid>
    );

}));

export default Plots;