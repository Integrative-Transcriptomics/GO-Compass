import React, {useCallback, useEffect, useState} from "react";
import PropTypes from 'prop-types';
import * as d3 from "d3";
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


/**
 * @return {null}
 */
function Plots(props) {
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
    const [index, setIndex] = useState(0);
    const [plottype, setPlottype] = useState('lineChart');
    const [plotWidth, setWidth] = useState(100);
    const [plotHeight, setHeight] = useState(100);
    const [anchorEl, setAnchorEl] = useState(null);
    const [parentHighlight, setParentHighlight] = useState(null);
    const [childHighlight, setChildHighlight] = useState(null);

    const main = React.createRef();
    const simplePlot = React.createRef();
    useEffect(() => {
        if (main.current != null) {
            setWidth(main.current.getBoundingClientRect().width);
        }
    }, [main]);
    useEffect(() => {
        if (simplePlot.current != null) {
            setHeight(simplePlot.current.getBoundingClientRect().height);
        }
    }, [simplePlot]);
    const selectPlottype = useCallback((plotType) => {
        setAnchorEl(null);
        setPlottype(plotType);
    }, [setAnchorEl, setPlottype]);
    const duration = 1500;
    const names = props.data.nestedData.map(d => d.name);
    const color = d3.scaleOrdinal(props.data.nestedData.map(d => d.id), d3.schemeCategory10.map(d => d3.interpolateRgb(d, "white")(0.5)));
    const classes = useStyles();
    return (
        <Grid ref={main} className={classes.root} container spacing={1}>
            <Grid item xs={4}>
                <Paper className={classes.paper}>
                    Bla
                </Paper>
            </Grid>
            <Grid item xs={4}>
                <Paper className={classes.paper}>
                    <PCA width={plotWidth / 3}
                         parentHighlight={parentHighlight}
                         childHighlight={childHighlight}
                         setParentHighlight={setParentHighlight}
                         data={props.data.pca}
                         conditions={props.data.conditions}
                    />
                </Paper>
            </Grid>
            <Grid item xs={4}>
                <Paper className={classes.paper}>

                    <CorrelationHeatmap width={plotWidth / 3}
                                        parentHighlight={parentHighlight}
                                        childHighlight={childHighlight}
                                        setParentHighlight={setParentHighlight}
                                        correlation={props.data.correlation}
                                        conditions={props.data.conditions}
                    />
                </Paper>
            </Grid>
            <Grid item xs={4}>
                <Paper ref={simplePlot} className={classes.paper}>
                    <Legend width={plotWidth / 3} height={100} color={color} names={names}/>
                    {props.datatype === "timeseries" ?
                        <div>
                            <PlayButton keys={props.data.conditions} duration={duration} setIndex={setIndex}/>
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
                    <SimpleChart width={plotWidth / 3}
                                 parentHighlight={parentHighlight}
                                 childHighlight={childHighlight}
                                 setParentHighlight={setParentHighlight}
                                 sigThreshold={props.sigThreshold}
                                 plottype={plottype}
                                 data={props.data}
                                 datatype={props.datatype}
                                 index={index} setIndex={setIndex} color={color} duration={duration}/>
                </Paper>
            </Grid>
            <Grid item xs={4}>
                <Paper className={classes.paper}>
                    <AnimatedTreemap parentHighlight={parentHighlight}
                                     childHighlight={childHighlight}
                                     setChildHighlight={setChildHighlight} width={plotWidth / 3}
                                     sigThreshold={props.sigThreshold}
                                     height={plotHeight}
                                     index={index}
                                     data={{children: props.data.nestedData, keys: props.data.conditions}}
                                     color={color}
                                     duration={duration}/>
                </Paper>
            </Grid>
            <Grid item xs={4}>
                <Paper className={classes.paper}>
                    <SmallMultiples parentHighlight={parentHighlight}
                                    childHighlight={childHighlight}
                                    setChildHighlight={setChildHighlight}
                                    sigThreshold={props.sigThreshold}
                                    width={plotWidth / 3} height={plotHeight}
                                    index={index}
                                    duration={duration}
                                    data={{children: props.data.nestedData, keys: props.data.conditions}}
                                    setIndex={setIndex}
                                    color={color}/>
                </Paper>
            </Grid>
            <Grid item xs={12}>
                <Paper className={classes.paper}>
                    <DataTable data={props.data} childHighlight={childHighlight}
                               sigThreshold={props.sigThreshold}
                               setChildHighlight={setChildHighlight}/>
                </Paper>
            </Grid>
        </Grid>
    );

}

Plots.propTypes = {
    data: PropTypes.object.isRequired,
    datatype: PropTypes.string.isRequired,
};
export default Plots;