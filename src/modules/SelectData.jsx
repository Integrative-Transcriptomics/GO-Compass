import React, {useCallback, useState} from 'react';
import {createStyles} from "@material-ui/core";
import {makeStyles} from "@material-ui/core/styles";
import Button from "@material-ui/core/Button";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import ReactSelect from 'react-select'
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
import {getSupportedGenomes, multiRevigoGeneLists, readData} from "../parseData";


function SelectData(props) {
    const [supportedGenomes, setSupportedGenomes] = useState([]);
    const [selectedGenome, setSelectedGenome] = useState(null);
    const [goFile, setGoFile] = useState(null);
    const [geneFiles, setGeneFiles] = useState([]);
    const [conditions, setConditions]=useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [ontology, setOntology] = useState("BP");
    const [pvalueFilter, setPvalueFilter] = useState(0.5);
    const [cutoff, setCutoff] = useState(0.7);
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
            readData(goFile, ontology, cutoff, pvalueFilter,(newData) => {
                setIsLoading(false);
                props.setData(newData);
            });
        } else if (geneFiles.length > 0 && selectedGenome !== null) {
            multiRevigoGeneLists(geneFiles, conditions, selectedGenome.value, ontology, cutoff, pvalueFilter,(newData) => {
                setIsLoading(false);
                props.setData(newData);
            })
        }
    }, [goFile, conditions, selectedGenome, geneFiles, ontology, cutoff, pvalueFilter]);
    const getGenomes = useCallback(() => {
        if (supportedGenomes.length === 0) {
            getSupportedGenomes((genomes) => setSupportedGenomes(genomes))
        }
    },[supportedGenomes]);
    const classes = useStyles();
    const speciesOptions = supportedGenomes.map(d => {
        return ({value: d.taxon_id, label: d.long_name})
    });
    return (
        <Grid
            container
            spacing={0}
            alignItems="center"
            justify="center"
        >
            <Grid item xs="4">
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
                                                setConditions([...event.target.files].map(d => d.name));
                                                setGeneFiles([...event.target.files])
                                            }}
                                        />
                                    </Button>
                                </Typography>
                            </ListItem>
                            <ListSubheader>Select Species</ListSubheader>
                            <ListItem>
                                <div onClick={() => getGenomes()} style={{width: "200px"}}>
                                    <ReactSelect
                                         options={speciesOptions}
                                        value={selectedGenome}
                                        onChange={(selected) => setSelectedGenome(selected)}/>
                                </div>
                            </ListItem>
                            {geneFiles.length > 0 ? <ListSubheader>Specify conditions</ListSubheader> : null}
                            {geneFiles.map((d, i) => <ListItem>
                                <TextField required
                                           label={d.name}
                                           onChange={(e) => {
                                               let conditionsCopy = conditions.slice();
                                               conditionsCopy[i] = e.target.value;
                                               setConditions(conditionsCopy);
                                           }}
                                           value={conditions[i]}
                                           defaultValue={d.name}/>
                            </ListItem>)}
                            <ListItem>
                                <Typography>
                                    GO enrichment will be computed by PANTHER
                                </Typography>
                            </ListItem>
                        </Paper>
                    </div>
                    <ListSubheader>Parameters</ListSubheader>
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
                        <FormControl className={classes.formControl}>
                            <InputLabel>Result size</InputLabel>
                            <Select
                                value={cutoff}
                                disabled={isLoading}
                                onChange={(e) =>setCutoff(e.target.value)}
                            >
                                <MenuItem value={0.9}>Large (0.9)</MenuItem>
                                <MenuItem value={0.7}>Medium (0.7)</MenuItem>
                                <MenuItem value={0.5}>Small (0.5)</MenuItem>
                                <MenuItem value={0.4}>Tiny (0.4)</MenuItem>
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
}

export default SelectData;
