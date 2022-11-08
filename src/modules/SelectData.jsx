import React, {useCallback, useState} from 'react';
import 'mobx-react-lite/batchingForReactDom'
import {createStyles, Paper, Theme} from "@material-ui/core";
import {makeStyles} from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import CircularProgress from "@material-ui/core/CircularProgress";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import ListSubheader from "@material-ui/core/ListSubheader";
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import {exampleDataWithFC, multiRevigoGoLists, multiSpeciesRevigo} from "../parseDataFlask";
import IconButton from "@material-ui/core/IconButton";
import PropTypes from "prop-types";
import {RootStore} from "./stores/RootStore";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";


const SelectData = (props) => {
    const [goFile, setGoFile] = useState(null);
    const [backgroundFile, setBackgroundFile] = useState(null);
    const [multiBackground, setMultiBackground] = useState([]);
    const [direction, setDirection] = useState("+");
    const [geneFiles, setGeneFiles] = useState([]);
    // loading state: After launching but before the gocompass returns the results loading state is true
    const [isLoading, setIsLoading] = useState(false);
    const [conditions, setConditions] = useState([]);
    // Wang, Lin, Resnik, Edge based
    const [selectedMeasure, selectMeasure] = useState("Edge based");
    const [pvalueFilter, setPvalueFilter] = useState(0.05);
    const [selectedTab, selectTab] = useState(0);
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
    /**
     * Launches the application
     * @type {function(): void}
     */
    const launch = useCallback(() => {
        setIsLoading(true);
        if (selectedTab === 1) {
            multiRevigoGoLists(goFile, backgroundFile, selectedMeasure, pvalueFilter, response => {
                props.setRootStore(new RootStore(response.results, response.conditions, response.tableColumns, false, {}, {}, response.goSetSize, selectedMeasure, pvalueFilter));
            });
        } else {
            if (selectedTab === 0) {
                const reorderedFiles = conditions.map(d => {
                    return geneFiles[d.index];
                });
                multiSpeciesRevigo(reorderedFiles, [...multiBackground], conditions.map(d => d.condition), conditions.map(d => d.background), selectedMeasure, pvalueFilter, direction, response => {
                    props.setRootStore(new RootStore(response.results, response.conditions, response.tableColumns, response.hasFC, response.geneValues, response.go2genes, response.goSetSize, selectedMeasure, pvalueFilter));
                });
            }
        }
    }, [selectedTab, goFile, backgroundFile, selectedMeasure, pvalueFilter, props, conditions, multiBackground, direction, geneFiles]);
    /**
     * Loads example data
     * @type {function(): void}
     */
    const loadExampleData = useCallback(() => {
        exampleDataWithFC((data) => {
            let backgroundFile = new File([data.background], "scoelicolor.txt", {
                type: "text/plain",
            })
            let geneFiles = Object.keys(data.lists).map(condition => {
                return (new File([data.lists[condition]], condition + ".txt", {
                    type: "text/plain",
                }))
            })
            setGeneFiles(geneFiles)
            setConditions(geneFiles.map((d, i) => {
                return ({
                    index: i,
                    condition: d.name.slice(0, -4),
                    background: backgroundFile.name
                })
            }));
            setMultiBackground([backgroundFile])
            selectMeasure("Wang")
            setPvalueFilter(0.05)
        })
    }, [])
    let launchable;
    if (selectedTab === 1) {
        launchable = goFile !== null && backgroundFile !== null;
    } else {
        launchable = geneFiles.length > 0 && multiBackground.length > 0;
    }
    const classes = useStyles();
    return (
        <List dense>
            <ListItem>
                <Tabs
                    value={selectedTab}
                    indicatorColor="primary"
                    textColor="primary"
                    onChange={(e, value) => selectTab(value)}
                >
                    <Tab label="Gene lists"/>
                    <Tab label="GO terms"/>
                </Tabs>
            </ListItem>
            <div hidden={selectedTab !== 0} role="tabpanel">
                <Paper elevation={6} style={{margin: "10px"}}>
                    <ListItem>
                        <Button className={classes.menuButton}
                                variant="contained"
                                component="label"
                                size="small"
                                onClick={loadExampleData}>Load Example Data</Button>
                    </ListItem>
                    <ListSubheader>Select Gene Lists</ListSubheader>
                    <ListItem>
                        <Typography>
                            <Button className={classes.menuButton}
                                    variant="contained"
                                    component="label"
                                    size="small"
                                    disabled={isLoading}
                            >
                                Select Files
                                <input
                                    type="file"
                                    multiple
                                    style={{display: "none"}}
                                    onChange={(event) => {
                                        setConditions([...event.target.files].map((d, i) => {
                                            if (multiBackground.length > 0) {
                                                return ({
                                                    index: i,
                                                    condition: d.name.slice(0, -4),
                                                    background: multiBackground[0].name
                                                })

                                            } else {
                                                return ({index: i, condition: d.name.slice(0, -4)})
                                            }
                                        }));
                                        setGeneFiles([...event.target.files])
                                    }}
                                />
                            </Button>
                            {geneFiles.length > 0 ? geneFiles.length + " files selected" : "No file selected"}
                        </Typography>
                    </ListItem>
                    <ListSubheader>Select Background files</ListSubheader>
                    <ListItem>
                        <Typography>
                            <Button className={classes.menuButton}
                                    variant="contained"
                                    size="small"
                                    disabled={isLoading}
                                    component="label"
                            >
                                Select File
                                <input
                                    type="file"
                                    multiple
                                    style={{display: "none"}}
                                    onChange={(event) => {
                                        if (conditions.length > 0) {
                                            setConditions(conditions.map(d => {
                                                return ({
                                                    index: d.index,
                                                    condition: d.condition,
                                                    background: event.target.files[0].name
                                                })
                                            }))
                                        }
                                        setMultiBackground(event.target.files)
                                    }}
                                />
                            </Button>
                            {multiBackground.length > 0 ? multiBackground.length + " files selected" : "No file selected"}
                        </Typography>
                    </ListItem>
                    {conditions.length > 0 && multiBackground.length > 0 ?
                        <div><ListSubheader>Specify conditions</ListSubheader>
                            {conditions.map((d, i) =>
                                <ListItem key={d.index}>
                                    <IconButton onClick={() => {
                                        const conditionsCopy = conditions.slice();
                                        if (i > 0) {
                                            const save = conditionsCopy[i - 1];
                                            conditionsCopy[i - 1] = conditionsCopy[i];
                                            conditionsCopy[i] = save;
                                        } else {
                                            const save = conditionsCopy[0];
                                            conditionsCopy[0] = conditionsCopy[conditions.length - 1];
                                            conditionsCopy[conditions.length - 1] = save;
                                        }
                                        setConditions(conditionsCopy);
                                    }}>
                                        <KeyboardArrowUpIcon fontSize="small"/>
                                    </IconButton>
                                    <IconButton onClick={() => {
                                        const conditionsCopy = conditions.slice();
                                        if (i < conditionsCopy.length - 1) {
                                            const save = conditionsCopy[i + 1];
                                            conditionsCopy[i + 1] = conditionsCopy[i];
                                            conditionsCopy[i] = save;
                                        } else {
                                            const save = conditionsCopy[0];
                                            conditionsCopy[0] = conditionsCopy[i];
                                            conditionsCopy[i] = save;
                                        }
                                        setConditions(conditionsCopy);
                                    }}>
                                        <KeyboardArrowDownIcon fontSize="small"/>
                                    </IconButton>
                                    <TextField required
                                               label={geneFiles[d.index].name}
                                               disabled={isLoading}
                                               onChange={(e) => {
                                                   let conditionsCopy = conditions.slice();
                                                   conditionsCopy[i].condition = e.target.value;
                                                   setConditions(conditionsCopy);
                                               }}
                                               value={d.condition}/>
                                    <FormControl className={classes.formControl}>
                                        <InputLabel>Background</InputLabel>
                                        <Select
                                            value={d.background}
                                            disabled={isLoading}
                                            onChange={(e) => {
                                                let conditionsCopy = conditions.slice();
                                                conditionsCopy[i].background = e.target.value;
                                                setConditions(conditionsCopy);
                                            }}
                                        >
                                            {[...multiBackground].map(file => <MenuItem key={file.name}
                                                                                        value={file.name}>{file.name}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </ListItem>
                            )}</div> : null}
                </Paper>
                <ListItem>
                    <FormControl component="fieldset">
                        <RadioGroup value={direction} onChange={(e) => setDirection(e.target.value)}>
                            <FormControlLabel value="+" control={<Radio/>} label="Find overrepresented GO Terms"
                                              disabled={isLoading}/>
                            <FormControlLabel value="-" control={<Radio/>}
                                              label="Find underrepresented GO terms"
                                              disabled={isLoading}/>
                        </RadioGroup>
                    </FormControl>
                </ListItem>
            </div>
            <div hidden={selectedTab !== 1} role="tabpanel">
                <Paper elevation={6} style={{margin: "10px"}}>
                    <ListSubheader>Select GO Term file</ListSubheader>
                    <ListItem>
                        <Typography>
                            <Button className={classes.menuButton}
                                    variant="contained"
                                    size="small"
                                    disabled={isLoading}
                                    component="label"
                            >
                                Select File
                                <input
                                    type="file"
                                    style={{display: "none"}}
                                    onChange={(event) => setGoFile(event.target.files[0])}
                                />
                            </Button>
                            {goFile !== null ? goFile.name : "No file selected"}
                        </Typography>
                    </ListItem>
                    <ListSubheader>Select Background file</ListSubheader>
                    <ListItem>
                        <Typography>
                            <Button className={classes.menuButton}
                                    variant="contained"
                                    size="small"
                                    disabled={isLoading}
                                    component="label"
                            >
                                Select File
                                <input
                                    type="file"
                                    style={{display: "none"}}
                                    onChange={(event) => setBackgroundFile(event.target.files[0])}
                                />
                            </Button>
                            {backgroundFile !== null ? backgroundFile.name : "No file selected"}
                        </Typography>
                    </ListItem>
                </Paper>
            </div>
            <ListItem>
                <FormControl className={classes.formControl}>
                    <InputLabel>Similarity measure</InputLabel>
                    <Select
                        value={selectedMeasure}
                        disabled={isLoading}
                        onChange={(e) => selectMeasure(e.target.value)}
                    >
                        <MenuItem value="Edge based">Edge based</MenuItem>
                        <MenuItem value="Resnik">Resnik</MenuItem>
                        <MenuItem value="Lin">Lin</MenuItem>
                        <MenuItem value="Wang">Wang</MenuItem>
                    </Select>
                </FormControl>
            </ListItem>
            <ListItem>
                <TextField
                    id="standard-number"
                    label="P-value filter"
                    type="number"
                    value={pvalueFilter}
                    disabled={isLoading}
                    onChange={(e) => setPvalueFilter(e.target.value)}
                    InputLabelProps={{
                        shrink: true,
                    }}
                    size="small"
                    margin="dense"
                />
            </ListItem>
            <ListItem>
                <Button className={classes.menuButton}
                        variant="contained"
                        component="label"
                        disabled={isLoading || !launchable}
                        onClick={launch}
                >
                    Go!
                </Button>
            </ListItem>
            {isLoading ? <ListItem>
                <CircularProgress/>
            </ListItem> : null}
        </List>
    );
};
SelectData.propTypes = {
    setRootStore: PropTypes.func.isRequired,
};

export default SelectData;
