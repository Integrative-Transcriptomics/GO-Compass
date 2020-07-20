import React, {useCallback, useEffect, useState} from "react";
import Grid from "@material-ui/core/Grid";
import AnimatedTreemap from "./AnimatedTreemap/AnimatedTreemap";
import PlayButton from "./PlayButton";
import Legend from "./Legend";
import Button from "@material-ui/core/Button";
import MenuItem from "@material-ui/core/MenuItem";
import Menu from "@material-ui/core/Menu";
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
    const [plotHeight, setHeight] = useState(100);
    const [anchorEl, setAnchorEl] = useState(null);

    const main = React.createRef();
    const simplePlot = React.createRef();
    useEffect(() => {
        if (main.current != null) {
            props.visStore.setScreenWidth(main.current.getBoundingClientRect().width);
        }
    }, [main, props.visStore]);
    useEffect(() => {
        if (simplePlot.current != null) {
            setHeight(simplePlot.current.getBoundingClientRect().height);
        }
    }, [simplePlot]);
    const selectPlottype = useCallback((plotType) => {
        setAnchorEl(null);
        props.visStore.setTsPlotType(plotType);
    }, [props.visStore, setAnchorEl]);
    const names = props.dataStore.nestedData.map(d => d.name);
    const classes = useStyles();
    return (
        <Grid ref={main} className={classes.root} container spacing={1}>
            <Grid item xs={6}>
                <Paper className={classes.paper}>
                    <Tree width={props.visStore.screenWidth / 2} height={400}
                    />
                </Paper>
            </Grid>
            <Grid item xs={3}>
                <Paper className={classes.paper}>
                    {props.dataStore.pcaLoaded?
                        <PCA width={props.visStore.screenWidth / 4}
                             height={400}
                        /> : null
                    }
                </Paper>
            </Grid>
            <Grid item xs={3}>
                <Paper className={classes.paper}>
                    <CorrelationHeatmap width={props.visStore.screenWidth / 4}
                                        height={400}
                    />
                </Paper>
            </Grid>

            <Grid item xs={4}>
                <Paper ref={simplePlot} className={classes.paper}>
                    <Legend width={props.visStore.screenWidth / 3} height={100} names={names}/>
                    {props.visStore.isTimeSeries ?
                        <div>
                            <PlayButton/>
                            <Button aria-controls="simple-menu" aria-haspopup="true"
                                    onClick={(event) => setAnchorEl(event.currentTarget)}>
                                Plot Type
                            </Button>
                            <Menu
                                id="simple-menu"
                                anchorEl={anchorEl}
                                keepMounted
                                open={Boolean(anchorEl)}
                                onClose={() => setAnchorEl(null)}
                            >
                                <MenuItem onClick={() => selectPlottype('lineChart')}>Line Chart</MenuItem>
                                <MenuItem onClick={() => selectPlottype('streamGraph')}>Streamgraph</MenuItem>
                            </Menu></div> : null
                    }
                    <SimpleChart width={props.visStore.screenWidth / 3}/>
                </Paper>
            </Grid>
            <Grid item xs={4}>
                <Paper className={classes.paper}>
                    <AnimatedTreemap width={props.visStore.screenWidth / 3}
                                     height={plotHeight}/>
                </Paper>
            </Grid>
            <Grid item xs={4}>
                <Paper className={classes.paper}>
                    <SmallMultiples width={props.visStore.screenWidth / 3} height={plotHeight}/>
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