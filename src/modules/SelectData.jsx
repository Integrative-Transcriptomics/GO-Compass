import React, {useCallback, useEffect, useState} from 'react';
import 'mobx-react-lite/batchingForReactDom'
import {exampleDataWithFC, getGOheader, multiRevigoGoLists, multiSpeciesRevigo} from "../parseDataFlask";
import PropTypes from "prop-types";
import {RootStore} from "./stores/RootStore";
import HelpIcon from '@material-ui/icons/Help';
import {
    Button,
    CircularProgress,
    createStyles,
    FormControl,
    FormControlLabel,
    InputLabel,
    List,
    ListItem,
    ListSubheader,
    makeStyles,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    TextField,
    Tooltip,
    Typography
} from "@material-ui/core";
import SpecifyBackgrounds from "../SpecifyBackgrounds";
import LinkGOGene from "../LinkGOGene";


const SelectData = (props) => {
    const [goFile, setGoFile] = useState(null);
    const [multiBackground, setMultiBackground] = useState([]);
    const [direction, setDirection] = useState("+");
    const [geneFiles, setGeneFiles] = useState([]);
    const [goFileColumns, setGoFileColumns] = useState([])
    // loading state: After launching but before the gocompass returns the results loading state is true
    const [isLoading, setIsLoading] = useState(false);
    const [conditions, setConditions] = useState([]);
    // Wang, Lin, Resnik, Edge based
    const [selectedMeasure, selectMeasure] = useState("Wang");
    const [pvalueFilter, setPvalueFilter] = useState(0.05);
    const useStyles = makeStyles((theme: Theme) => createStyles({
        root: {
            flexGrow: 1,
        }, menuButton: {
            marginRight: theme.spacing(2),
        }, title: {
            flexGrow: 1,
        },
    }),);
    /**
     * Launches the application
     * @type {function(): void}
     */
    const launch = useCallback(() => {
        setIsLoading(true);
        if (goFile !== null) {
            const reorderedFiles = conditions.map(d => {
                return geneFiles[d.index];
            });
            multiRevigoGoLists(goFile, reorderedFiles, [...multiBackground], selectedMeasure, pvalueFilter, response => {
                props.setRootStore(new RootStore(response.results, response.conditions, response.tableColumns, response.hasFC, response.geneValues, response.go2genes, response.goSetSize, selectedMeasure, pvalueFilter));
            });

        } else {
            const reorderedFiles = conditions.map(d => {
                return geneFiles[d.index];
            });
            multiSpeciesRevigo(reorderedFiles, [...multiBackground], conditions.map(d => d.condition), conditions.map(d => d.background), selectedMeasure, pvalueFilter, direction, response => {
                props.setRootStore(new RootStore(response.results, response.conditions, response.tableColumns, response.hasFC, response.geneValues, response.go2genes, response.goSetSize, selectedMeasure, pvalueFilter));
            });
        }
    }, [goFile, selectedMeasure, pvalueFilter, props, conditions, multiBackground, direction, geneFiles]);
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
                    index: i, condition: d.name.slice(0, -4), background: backgroundFile.name
                })
            }));
            setMultiBackground([backgroundFile])
            selectMeasure("Wang")
            setPvalueFilter(0.05)
        })
    }, [])
    useEffect(() => {
        if (geneFiles.length > 0) {
            getGOheader(goFile, columns => {
                setGoFileColumns(columns)
            })
        }
    }, [geneFiles, goFile])

    let launchable = (goFile !== null || geneFiles.length > 0) && multiBackground.length > 0;
    const classes = useStyles();
    return (<List dense>
            <ListItem>
                <List dense>
                    <ListItem>
                        <Button className={classes.menuButton}
                                component="label"
                                size="small"
                                onClick={loadExampleData}>Load Example Data</Button>
                    </ListItem>
                    <Typography>Upload Gene or GO-term lists (1 required)<Tooltip
                        title={"When not uploading your own enrichment table, GO-term enrichment will be calculated by GO-Compass using the gene lists"}><HelpIcon/></Tooltip></Typography>
                    <ListSubheader><Typography>Select Gene Lists</Typography></ListSubheader>
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
                                            return ({
                                                index: i,
                                                condition: d.name.slice(0, -4),
                                                background: multiBackground.length > 0 ? multiBackground[0].name : null,
                                            })
                                        }));
                                        setGeneFiles([...event.target.files])
                                    }}
                                />
                            </Button>
                            {geneFiles.length > 0 ? geneFiles.length + " files selected" : "No file selected"}
                        </Typography>
                    </ListItem>
                    <ListSubheader>
                        <Typography>Select GO Enrichment table</Typography>
                    </ListSubheader>
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
                </List>
            </ListItem>
            <ListItem>
                <List dense>
                    <Typography>Select Background file(s)</Typography>
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
                    {conditions.length > 0 ? <ListItem>{multiBackground.length > 0 && goFile === null ?
                        <SpecifyBackgrounds conditions={conditions} setConditions={setConditions}
                                            geneFiles={geneFiles} isLoading={isLoading}
                                            multiBackground={multiBackground}/> : goFile !== null ?
                            <LinkGOGene conditions={conditions} setConditions={setConditions} isLoading={isLoading}
                                        goFileColumns={goFileColumns}/> : null}</ListItem> : null}
                </List>
            </ListItem>
            <ListItem>
                <List dense>
                    <Typography>Settings</Typography>
                    {geneFiles.length > 0 && goFile === null && multiBackground.length > 0 ? <ListItem>
                        <FormControl component="fieldset">
                            <RadioGroup value={direction} onChange={(e) => setDirection(e.target.value)}>
                                <FormControlLabel value="+" control={<Radio/>} label="Find overrepresented GO Terms"
                                                  disabled={isLoading}/>
                                <FormControlLabel value="-" control={<Radio/>}
                                                  label="Find underrepresented GO terms"
                                                  disabled={isLoading}/>
                            </RadioGroup>
                        </FormControl>
                    </ListItem> : null}
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
                        <FormControl>
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
                        </FormControl>
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
                </List>
            </ListItem>
            {isLoading ? <CircularProgress/> : null}
        </List>);
};
SelectData.propTypes = {
    setRootStore: PropTypes.func.isRequired,
};

export default SelectData;