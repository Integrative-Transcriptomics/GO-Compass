import React, {createRef, useCallback, useEffect, useState} from "react";
import Grid from "@material-ui/core/Grid";
import SimpleChart from "./SimpleCharts/SimpleChart";
import {makeStyles} from "@material-ui/core/styles";
import {Button, ButtonGroup, createStyles, Tab, Tabs} from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import DataTable from "./DetailedTable/DataTable";
import CorrelationHeatmap from "./CorrelationHeatmap";
import {inject, observer, Provider} from "mobx-react";
import ClusteredHeatmap from "./ClusteredHeatmap/ClusteredHeatmap";
import Typography from "@material-ui/core/Typography";
import UpSet from "./UpSet";
import Treemap from "./AnimatedTreemap/Treemap";
import TabPanel from "./TabPanel";
import GetAppIcon from '@material-ui/icons/GetApp';
import {exportPDF} from "../UtilityFunctions";
import {v4 as uuidv4} from 'uuid'
import HelpIcon from '@material-ui/icons/Help';
import ButtonGroupIconButton from "../ButtonGroupIconButton";
import LockOpenIcon from "@material-ui/icons/LockOpen";
import SettingsIcon from "@material-ui/icons/Settings";


/**
 * @return {null}
 */
const Plots = inject("dataStore", "visStore")(observer((props) => {
    const [treemapSettingsOpen, setTreemapSettingsOpen]=useState(false);
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
    const tabRef = createRef();
    const classes = useStyles();
    const [selectedTab, setSelectedTab] = useState(0);
    const [tabHeight, setTabHeight] = useState(10);
    const treeID = "id" + uuidv4();
    const treeMapID = "id" + uuidv4();
    const barChartID = "id" + uuidv4();
    const summaryID = "id" + uuidv4();
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
                        <ButtonGroup>
                            <ButtonGroupIconButton onClick={() => exportPDF(treeID, true)}>
                                <GetAppIcon/>
                            </ButtonGroupIconButton>
                            <ButtonGroupIconButton
                                href="https://github.com/Integrative-Transcriptomics/GO-Compass#dispensability-tree-and-cutoff-selection"
                                target="_blank"
                                rel="noopener noreferrer"><HelpIcon/></ButtonGroupIconButton>
                        </ButtonGroup>
                    </Typography>
                    <ClusteredHeatmap
                        logSigThreshold={props.logSigThreshold}
                        width={props.visStore.screenWidth / 2}
                        height={props.visStore.plotHeight / 2}
                        id={treeID}
                    />
                </Paper>
            </Grid>
            <Grid item xs={6}>
                <Paper className={classes.paper}>
                    <Typography>Single List View
                     <ButtonGroup>
                            <ButtonGroupIconButton
                                href="https://github.com/Integrative-Transcriptomics/GO-Compass#treemaps"
                                target="_blank"
                                rel="noopener noreferrer"><HelpIcon/></ButtonGroupIconButton>
                            <ButtonGroupIconButton onClick={() => exportPDF(treeMapID, true)}>
                                <GetAppIcon/>
                            </ButtonGroupIconButton>
                            <ButtonGroupIconButton variant="outlined" color="primary" onClick={() => setTreemapSettingsOpen(true)}>
                                <SettingsIcon/>
                            </ButtonGroupIconButton>
                        </ButtonGroup>
                    </Typography>
                    <Treemap logSigThreshold={props.logSigThreshold}
                             height={props.visStore.plotHeight / 2}
                             width={props.visStore.screenWidth / 2} id={treeMapID} isOpen={treemapSettingsOpen} setIsOpen={setTreemapSettingsOpen}/>
                </Paper>
            </Grid>
            <Grid item xs={6}>
                <Paper className={classes.paper}>
                    <Typography>
                        Overview List Comparison
                        <ButtonGroup>
                            <ButtonGroupIconButton onClick={() => exportPDF(summaryID, true)}>
                                <GetAppIcon/>
                            </ButtonGroupIconButton>
                            <ButtonGroupIconButton
                                href="https://github.com/Integrative-Transcriptomics/GO-Compass#summary-visualizations"
                                target="_blank"
                                rel="noopener noreferrer"><HelpIcon/></ButtonGroupIconButton>
                            {props.visStore.selectionLocked ?
                                <Button onClick={props.visStore.unlock} startIcon={<LockOpenIcon/>}>
                                    Clear selection
                                </Button> : null}
                        </ButtonGroup>
                    </Typography>
                    <Tabs ref={tabRef} value={selectedTab} onChange={(e, v) => {
                        props.visStore.unlock();
                        setSelectedTab(v)
                    }}>
                        <Tab label="All GO-Terms"/>
                        <Tab label="Significant GO-Terms"/>
                    </Tabs>
                    <TabPanel value={selectedTab} index={0}>
                        {props.dataStore.correlationLoaded ?
                            <CorrelationHeatmap width={props.visStore.screenWidth / 2}
                                                height={props.visStore.plotHeight / 2 - tabHeight}
                                                id={summaryID}
                            /> : null
                        }
                    </TabPanel>
                    <TabPanel value={selectedTab} index={1}>
                        <Provider upSetStore={props.dataStore.upSetStore}>
                            <UpSet width={props.visStore.screenWidth / 2}
                                   height={props.visStore.plotHeight / 2 - tabHeight}
                                   logSigThreshold={props.logSigThreshold}
                                   id={summaryID}/>
                        </Provider>
                    </TabPanel>

                </Paper>
            </Grid>
            <Grid item xs={6}>
                <Paper className={classes.paper}>
                    <Typography>Detailed Comparison
                        <ButtonGroup>
                            <ButtonGroupIconButton onClick={() => exportPDF(barChartID, true)}>
                                <GetAppIcon/>
                            </ButtonGroupIconButton>
                            <ButtonGroupIconButton
                                href="https://github.com/Integrative-Transcriptomics/GO-Compass#bar-chart"
                                target="_blank"
                                rel="noopener noreferrer"><HelpIcon/></ButtonGroupIconButton>
                        </ButtonGroup>
                    </Typography>
                    <SimpleChart sigThreshold={props.sigThreshold} logSigThreshold={props.logSigThreshold}
                                 isTimeSeries={props.isTimeSeries}
                                 width={props.visStore.screenWidth / 2} height={props.visStore.plotHeight / 2}
                                 id={barChartID}/>
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
    )
        ;

}));

export default Plots;