import React, {useCallback, useState} from 'react';
import {createStyles} from "@material-ui/core";
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
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import {getSupportedGenomes, multiRevigoGeneLists, multiRevigoGoLists} from "../parseDataFlask";
import IconButton from "@material-ui/core/IconButton";
import Autocomplete from '@material-ui/lab/Autocomplete';
import {DataStore} from "./stores/DataStore";
import PropTypes from "prop-types";


const SelectData = (props) => {
    const [supportedGenomes, setSupportedGenomes] = useState([]);
    const [goFile, setGoFile] = useState(null);
    const [backgroundFile, setBackgroundFile] = useState(null);
    const [geneFiles, setGeneFiles] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [ontology, setOntology] = useState("BP");
    const [conditions, setConditions] = useState([]);
    const [selectedMeasure, selectMeasure] = useState(null);
    const [pvalueFilter, setPvalueFilter] = useState(0.5);
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
    const launch = useCallback(() => {
        setIsLoading(true);
        if (goFile !== null) {
            multiRevigoGoLists(goFile, backgroundFile, ontology, selectedMeasure.value, pvalueFilter, response => {
                props.setDataStore(new DataStore(response.data, response.tree, response.conditions));
            });
        } else if (geneFiles.length > 0) {
            const reorderedFiles = conditions.map(d => {
                return geneFiles[d.index];
            });
            multiRevigoGeneLists(reorderedFiles, backgroundFile, conditions.map(d => d.condition), ontology, selectedMeasure.value, pvalueFilter, response => {
                props.setDataStore(new DataStore(response.data, response.tree, response.conditions));
            });
        }
    }, [goFile, backgroundFile, selectedMeasure, conditions, pvalueFilter, geneFiles, ontology, props]);
    const getGenomes = useCallback(() => {
        if (supportedGenomes.length === 0) {
            getSupportedGenomes((genomes) => setSupportedGenomes(genomes))
        }
    }, [supportedGenomes]);
    const classes = useStyles();
    const similarityMeasures = ["Resnik", "Lin", "Edge based"];
    const similarityOptions = similarityMeasures.map(d => {
        return ({value: d, label: d})
    });
    return (
        <Grid
            container
            spacing={0}
            alignItems="center"
            justify="center"
        >
            <Grid item xs={4}>
                <List>
                    <ListItem>
                        <Tabs
                            value={selectedTab}
                            indicatorColor="primary"
                            textColor="primary"
                            onChange={(e, value) => selectTab(value)}
                        >
                            <Tab label="GO-Term input">
                            </Tab>
                            <Tab label="Gene List input"/>
                        </Tabs>
                    </ListItem>
                    <div hidden={selectedTab !== 0} role="tabpanel">
                        <Paper variant="outlined">
                            <ListSubheader>Select GO Term file</ListSubheader>
                            <ListItem>
                                <Typography>
                                    <Button className={classes.menuButton}
                                            variant="contained"
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
                        </Paper>
                    </div>
                    <div hidden={selectedTab !== 1} role="tabpanel">
                        <Paper variant="outlined">
                            <ListSubheader>Select Gene Lists</ListSubheader>
                            <ListItem>
                                <Typography>
                                    <Button className={classes.menuButton}
                                            variant="contained"
                                            disabled={isLoading}
                                            component="label"
                                    >
                                        Select Files
                                        <input
                                            type="file"
                                            multiple
                                            style={{display: "none"}}
                                            onChange={(event) => {
                                                setConditions([...event.target.files].map((d, i) => {
                                                    return ({"index": i, "condition": d.name.slice(0, -4)})
                                                }));
                                                setGeneFiles([...event.target.files])
                                            }}
                                        />
                                    </Button>
                                </Typography>
                            </ListItem>
                            {conditions.length > 0 ? <ListSubheader>Specify conditions</ListSubheader> : null}
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
                                               label={d.condition}
                                               disabled={isLoading}
                                               onChange={(e) => {
                                                   let conditionsCopy = conditions.slice();
                                                   conditionsCopy[i].condition = e.target.value;
                                                   setConditions(conditionsCopy);
                                               }}
                                               value={d.condition}/>
                                </ListItem>
                            )}
                        </Paper>
                    </div>
                    <ListSubheader>Select Background file</ListSubheader>
                    <ListItem>
                        <Typography>
                            <Button className={classes.menuButton}
                                    variant="contained"
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
                    <ListSubheader>Select Similarity Measure</ListSubheader>
                    {/*}
                                                <ListItem onClick={() => getGenomes()}>
                                                <Autocomplete
                                                id="combo-box-demo"
                                                options={speciesOptions}
                                                disabled={isLoading}
                                                getOptionLabel={(option) => option.label}
                                                value={selectedSpecies}
                                                style={{width: 300}}
                                                onChange={(event, newValue) => {
                                                selectSpecies(newValue);
                                                }}
                                                renderInput={(params) => <TextField {...params} label="Select Species"
                                                variant="outlined"/>}
                                                />
                                                </ListItem>
                                                */}
                    <ListItem onClick={() => getGenomes()}>
                        <Autocomplete
                            id="combo-box-demo"
                            options={similarityOptions}
                            disabled={isLoading}
                            getOptionLabel={(option) => option.label}
                            value={selectedMeasure}
                            style={{width: 300}}
                            onChange={(event, newValue) => {
                                selectMeasure(newValue);
                            }}
                            renderInput={(params) => <TextField {...params} label="Similarity measure"
                                                                variant="outlined"/>}
                        />
                    </ListItem>
                    <ListItem>
                        <FormControl className={classes.formControl}>
                            <InputLabel>Ontology</InputLabel>
                            <Select
                                value={ontology}
                                disabled={isLoading}
                                onChange={(e) => setOntology(e.target.value)}
                            >
                                <MenuItem value="BP">Biological Process</MenuItem>
                                <MenuItem value="MF">Molecular Function</MenuItem>
                                <MenuItem value="CC">Cellular Component</MenuItem>
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
                                disabled={isLoading || (goFile == null && geneFiles.length === 0)}
                                onClick={launch}
                        >
                            Go!
                        </Button>
                    </ListItem>
                    {isLoading ? <ListItem>
                        <CircularProgress/>
                    </ListItem> : null}
                </List>
            </Grid>
        </Grid>
    );
};
SelectData.propTypes = {
    setDataStore: PropTypes.func.isRequired,
};

export default SelectData;
