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
import Tree from "./Tree";
import {inject, observer} from "mobx-react";

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
                padding: theme.spacing(0),
                textAlign: 'left',
                color: theme.palette.text.secondary,
            },
        }),
    );
    const changeWidth = useCallback(() => {
        props.visStore.setScreenWidth(window.innerWidth)
    }, [props.visStore]);
    useEffect(() => {
        changeWidth();
        window.addEventListener("resize", changeWidth);
        console.log("added listener");
    }, []);
    const classes = useStyles();
    return (
        <Grid className={classes.root} container spacing={1}>
            <Grid item xs={6}>
                <Paper className={classes.paper}>
                    <Tree width={props.visStore.screenWidth / 2} height={props.visStore.plotHeight / 2}
                    />
                </Paper>
            </Grid>
            <Grid item xs={3}>
                <Paper className={classes.paper}>
                    {props.dataStore.pcaLoaded ?
                        <PCA width={props.visStore.screenWidth / 4}
                             height={props.visStore.plotHeight / 2}
                        /> : null
                    }
                </Paper>
            </Grid>
            <Grid item xs={3}>
                <Paper className={classes.paper}>
                    {props.dataStore.correlationLoaded ?
                        <CorrelationHeatmap width={props.visStore.screenWidth / 4}
                                            height={props.visStore.plotHeight / 2}
                        /> : null
                    }
                </Paper>
            </Grid>

            <Grid item xs={4}>
                <Paper className={classes.paper}>
                    <SimpleChart width={props.visStore.screenWidth / 3} height={props.visStore.plotHeight / 2}/>
                </Paper>
            </Grid>
            <Grid item xs={4}>
                <Paper className={classes.paper}>
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