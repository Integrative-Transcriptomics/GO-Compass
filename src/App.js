import React, {useEffect, useState} from 'react';
import './App.css';
import readData from './parseData.jsx';
import Plots from "./modules/Plots";
import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Typography from "@material-ui/core/Typography";
import {createStyles} from "@material-ui/core";
import {makeStyles} from "@material-ui/core/styles";


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
    const [isTimeseries, setDatatype] = useState(false);

    useEffect(() => {
        readData(file, (newData) => setData(newData))
    }, [file]);
    const classes=useStyles();
    return (
        <div className={classes.root}>
            <React.Fragment>
                <AppBar position="static">
                    <Toolbar>
                        <Typography className={classes.title} variant="h6">
                            GO Comparison Dashboard
                        </Typography>
                        <Button className={classes.menuButton}
                            variant="contained"
                            component="label"
                        >
                            Select File
                            <input
                                type="file"
                                style={{display: "none"}}
                                accept='.tsv'
                                onChange={(event) => setFile(event.target.files[0])}
                            />
                        </Button>
                        <FormControlLabel
                            control={<Switch checked={isTimeseries} onChange={() => setDatatype(!isTimeseries)}
                                             name="checkedA"/>}
                            label="Time Series Data"
                        />
                    </Toolbar>
                </AppBar>
            </React.Fragment>
            {data != null ? <Plots datatype={isTimeseries ? 'timeseries' : 'conditions'} data={data}/> : null}
        </div>
    );
}

export default App;
