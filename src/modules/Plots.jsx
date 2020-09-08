import React, {useCallback, useEffect} from "react";
import Grid from "@material-ui/core/Grid";
import AnimatedTreemap from "./AnimatedTreemap/AnimatedTreemap";
import SimpleChart from "./SimpleCharts/SimpleChart";
import SmallMultiples from "./AnimatedTreemap/SmallMultiples";
import {makeStyles} from "@material-ui/core/styles";
import {createStyles} from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import DataTable from "./DetailedTable/DataTable";
import CorrelationHeatmap from "./CorrelationHeatmap";
import PCA from "./PCA";
import {inject, observer} from "mobx-react";
import ClusteredHeatmap from "./ClusteredHeatmap/ClusteredHeatmap";
import Typography from "@material-ui/core/Typography";
import Legend from "./HorizontalLegend";

/**
 * @return {null}
 */
const Plots = inject("dataStore", "visStore")(observer((props) => {
    const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            root: {
                flexGrow: 1,
                backgroundColor: 'lightgray'
            },
            paper: {
                padding: theme.spacing(2),
                textAlign: 'left',
                color: theme.palette.text.secondary,
                elevation: 3
            },
        }),
    );
    const changeWidth = useCallback(() => {
        props.visStore.setScreenWidth(window.innerWidth)
    }, [props.visStore]);
    useEffect(() => {
        changeWidth();
        window.addEventListener("resize", changeWidth);
    }, [changeWidth]);
    const classes = useStyles();
    return (
        <Grid className={classes.root} container spacing={1}>
            <Grid item xs={6}>
                <Paper className={classes.paper}>
                    <Typography>
                        Select Cutoffs
                    </Typography>
                    <ClusteredHeatmap width={props.visStore.screenWidth / 2} height={props.visStore.plotHeight / 2}
                    />
                </Paper>
            </Grid>
            <Grid item xs={3}>
                <Paper className={classes.paper}>
                    <Typography>
                        Principal Component Analysis of Lists
                    </Typography>
                    {props.dataStore.pcaLoaded ?
                        <PCA width={props.visStore.screenWidth / 4}
                             height={props.visStore.plotHeight / 2}
                        /> : null
                    }
                </Paper>
            </Grid>
            <Grid item xs={3}>
                <Paper className={classes.paper}>
                    <Typography>
                        List Correlation
                    </Typography>
                    {props.dataStore.correlationLoaded ?
                        <CorrelationHeatmap width={props.visStore.screenWidth / 4}
                                            height={props.visStore.plotHeight / 2}
                        /> : null
                    }
                </Paper>
            </Grid>

            <Grid item xs={4}>
                <Paper className={classes.paper}>
                    <Typography>
                        {props.visStore.childHighlight == null ? "Category Overview"
                            : props.dataStore.dataTable[props.visStore.childHighlight].description}
                    </Typography>
                    <SimpleChart width={props.visStore.screenWidth / 3} height={props.visStore.plotHeight / 2}/>
                </Paper>
            </Grid>
            <Grid item xs={4}>
                <Paper className={classes.paper}>
                    <Typography>
                        Selected List
                    </Typography>
                    <AnimatedTreemap width={props.visStore.screenWidth / 3}
                                     height={props.visStore.plotHeight / 2}/>
                </Paper>
            </Grid>
            <Grid item xs={4}>
                <Paper className={classes.paper}>

                    <SmallMultiples width={props.visStore.screenWidth / 3} height={props.visStore.plotHeight / 2}/>
                </Paper>
            </Grid>
            <Grid item xs={12}>
                <Paper className={classes.paper}>
                    <DataTable/>
                </Paper>
            </Grid>
        </Grid>
    );

}));

export default Plots;