import React, {useCallback, useState} from 'react';
import './App.css';
import readRawData from './parseData.jsx';
import Plots from "./modules/Plots";
import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Typography from "@material-ui/core/Typography";
import {createStyles} from "@material-ui/core";
import {makeStyles} from "@material-ui/core/styles";
import SelectData from "./modules/SelectData";
import InputLabel from "@material-ui/core/InputLabel";
import TextField from "@material-ui/core/TextField";


function App() {
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


    const [data, setData] = useState(null);
    const [file, setFile] = useState(null);
    const [ontology, setOntology] = useState("BP");
    const [cutoff, setCutoff] = useState(0.7);
    const [sigThreshold, setSigThreshold] = useState(0.05);
    const [isTimeseries, setDatatype] = useState(false);

    const launch = useCallback(()=>{
        if(file !== null){
            readRawData(file, ontology, cutoff, (newData) => setData(newData));
        }
    },[file,ontology,cutoff]);
    const classes = useStyles();
    return (
        <div className={classes.root}>
            <React.Fragment>
                <AppBar position="static">
                    <Toolbar>
                        <Typography className={classes.title} variant="h6">
                            GO Comparison Dashboard
                        </Typography>
                        <TextField
                            id="standard-number"
                            label="Significance Threshold"
                            type="number"
                            value={sigThreshold}
                            onChange={(e) => setSigThreshold(e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                        <FormControlLabel
                            control={<Switch checked={isTimeseries} onChange={() => setDatatype(!isTimeseries)}
                                             name="checkedA"/>}
                            label="Time Series Data"
                        />
                    </Toolbar>
                </AppBar>
            </React.Fragment>
            {data != null ? <Plots datatype={isTimeseries ? 'timeseries' : 'conditions'} data={data} sigThreshold={sigThreshold} /> :
                <SelectData setFile={setFile}
                            ontology={ontology}
                            setOntology={setOntology}
                            cutoff={cutoff}
                            setCutoff={setCutoff}
                            launch={launch}/>}
        </div>
    );
}

export default App;
