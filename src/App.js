import React, {useEffect, useState} from 'react';
import './App.css';
import readData from './parseData';
import Plots from "./modules/Plots";
import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import Button from "@material-ui/core/Button";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";


function App() {
    const [data, setData] = useState(null);
    const [file, setFile] = useState(null);
    const [isTimeseries, setDatatype] = useState(false);

    useEffect(() => {
        readData(file, (newData) => setData(newData))
    }, [file]);
    return (
        <div>
            <React.Fragment>
                <AppBar position="static">
                    <Toolbar>
                        <Button
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
                            control={<Switch checked={isTimeseries} onChange={() => setDatatype(!isTimeseries)} name="checkedA" />}
                            label="Time Series Data"
                        />
                    </Toolbar>
                </AppBar>
            </React.Fragment>
            <Plots datatype={isTimeseries?'timeseries':'conditions'} data={data}/>
        </div>
    );
}

export default App;
