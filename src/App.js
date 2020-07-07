import React, {useState} from 'react';
import Plots from "./modules/Plots";
import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import Switch from "@material-ui/core/Switch";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Typography from "@material-ui/core/Typography";
import {createStyles} from "@material-ui/core";
import {makeStyles} from "@material-ui/core/styles";
import SelectData from "./modules/SelectData";
import TextField from "@material-ui/core/TextField";
import FormGroup from "@material-ui/core/FormGroup";


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
    const [selectedSpecies, selectSpecies] = useState(null);
    const [dispCutoff, setDispCutoff] = useState(0.7);
    const [pvalueFilter, setPvalueFilter] = useState(0.5);
    const [sigThreshold, setSigThreshold] = useState(0.05);
    const [isTimeseries, setDatatype] = useState(false);

    const classes = useStyles();
    return (
        <div className={classes.root}>
            <React.Fragment>
                <AppBar position="sticky">
                    <Toolbar>
                        <Typography className={classes.title} variant="h6">
                            GO Comparison Dashboard
                        </Typography>
                        <FormGroup row>
                            <TextField
                                id="standard-number"
                                label="Significance Threshold"
                                type="number"
                                value={sigThreshold}
                                onChange={(e) => setSigThreshold(e.target.value)}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                size="small"
                                margin="dense"
                            />
                            <FormControlLabel
                                control={<Switch checked={isTimeseries} onChange={() => setDatatype(!isTimeseries)}
                                                 name="checkedA"/>}
                                label="Time Series Data"
                            />
                        </FormGroup>
                    </Toolbar>
                </AppBar>
            </React.Fragment>
            {data != null ?
                <Plots selectedSpecies={selectedSpecies}
                       pvalueFilter={pvalueFilter}
                       dispCutoff={dispCutoff}
                       datatype={isTimeseries ? 'timeseries' : 'conditions'} data={data}
                       sigThreshold={sigThreshold}/> :
                <SelectData setData={setData}
                            selectSpecies={selectSpecies}
                            setPvalueFilter={setPvalueFilter}
                            setDispCutoff={setDispCutoff}
                            selectedSpecies={selectedSpecies}
                            pvalueFilter={pvalueFilter}
                            dispCutoff={dispCutoff}/>}
        </div>
    );
}

export default App;
