import React, {useEffect, useState} from "react";
import PropTypes from 'prop-types';
import * as d3 from "d3";
import Grid from "@material-ui/core/Grid";
import LineChart from "./SimpleCharts/LineChart";
import AnimatedTreemap from "./AnimatedTreemap/AnimatedTreemap";
import PlayButton from "./PlayButton";
import StackedBarChart from "./SimpleCharts/StackedBarChart";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import StreamGraph from "./SimpleCharts/StreamGraph";


/**
 * @return {null}
 */
function Plots(props) {
    const [index, setIndex] = useState(0);
    const [plottype, setPlottype] = useState('lineChart');
    const [plotWidth, setWidth] = useState(100);
    const [plotHeight, setHeight] = useState(100);
    const main = React.createRef();
    useEffect(()=>{
        if(main.current != null){
            setWidth(main.current.getBoundingClientRect().width/2);
            setHeight(main.current.getBoundingClientRect().height/2);
        }
    },[main]);
    if (props.data !== null) {
        const duration = 1500;
        const color = d3.scaleOrdinal(props.data.children.map(d => d.name), d3.schemeCategory10.map(d => d3.interpolateRgb(d, "white")(0.5)));
        const lineChartChildren = props.data.children.map(parent => {
            const values = props.data.keys.map((d, i) => {
                let current = 0;
                parent.children.forEach(child => {
                    current += child.values[i];
                });
                return current;
            });
            return ({name: parent.name, values: values});
        });
        const keys = new Set();
        const stackedChildren = props.data.keys.map((d, i) => {
            const tpData = {};
            tpData['index'] = i;
            props.data.children.forEach(parent => {
                keys.add(parent.name);
                tpData[parent.name] = d3.sum(parent.children.map(child => child.values[i]));
            });
            return tpData
        });
        let firstPlot;
        if (props.datatype === "conditions") {
            firstPlot =
                <Grid item xs={6}>
                    <StackedBarChart width={plotWidth} data={{timepoints: props.data.keys, keys: [...keys], values: stackedChildren}}
                                     index={index} setIndex={setIndex} color={color} duration={duration}/>
                </Grid>
        } else {
            let timeseriesPlot;
            if (plottype === 'lineChart') {
                timeseriesPlot = <LineChart width={plotWidth} data={{keys: props.data.keys, children: lineChartChildren}}
                                            index={index} setIndex={setIndex} color={color} duration={duration}/>
            } else {
                timeseriesPlot =
                    <StreamGraph width={plotWidth} data={{timepoints: props.data.keys, keys: [...keys], values: stackedChildren}}
                                 index={index} setIndex={setIndex} color={color} duration={duration}/>
            }
            firstPlot =
                <Grid item xs={6}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend">Plot Type</FormLabel>
                        <RadioGroup aria-label="plottype" name="plottype" value={plottype}
                                    onChange={(event) => setPlottype(event.target.value)}>
                            <FormControlLabel value="lineChart" control={<Radio/>} label="Line Chart"/>
                            <FormControlLabel value="streamGraph" control={<Radio/>} label="Stream Graph"/>
                        </RadioGroup>
                    </FormControl>
                    {timeseriesPlot}
                </Grid>
        }
        return (
            <Grid ref={main} container spacing={0}>
                <Grid item xs={12}>
                    {props.datatype === "timeseries" ? <PlayButton keys={props.data.keys} duration={duration} setIndex={setIndex}/> : null}
                </Grid>
                <Grid item xs={6}>
                    {firstPlot}
                </Grid>
                <Grid item xs={6}>
                    <AnimatedTreemap width={plotWidth} index={index} data={props.data} color={color} duration={duration}/>
                </Grid>
            </Grid>
        );
    } else return null;

}

Plots.propTypes = {
    width: PropTypes.number,
    height: PropTypes.number,
    data: PropTypes.objectOf(PropTypes.array)
};
Plots.defaultProps = {
    width: 900,
    height: 600,
};
export default Plots;