import React, {useCallback, useEffect, useState} from 'react';
import 'mobx-react-lite/batchingForReactDom'
import {
    exampleMouse, exampleStrepto,
    exampleTreponema,
    getGOheader,
    multiRevigoGoLists,
    multiSpeciesRevigo
} from "../parseDataFlask";
import PropTypes from "prop-types";
import HelpIcon from '@material-ui/icons/Help';
import HomeIcon from '@material-ui/icons/Home';
import GitHubIcon from '@material-ui/icons/GitHub';
import {
    Backdrop,
    Button,
    CircularProgress, Container,
    createStyles,
    FormControl,
    FormControlLabel,
    InputLabel, Link,
    List,
    ListItem,
    ListSubheader,
    makeStyles,
    MenuItem,
    Radio,
    RadioGroup,
    Select, Switch, Tab, Tabs,
    TextField,
    Tooltip,
    Typography
} from "@material-ui/core";
import SpecifyBackgrounds from "../SpecifyBackgrounds";
import LinkGOGene from "../LinkGOGene";
import ExampleDataTable from "./ExampleDataTable";
import {Alert} from "@material-ui/lab";
import schematic from './schematic.png';


const SelectData = (props) => {
    const [goFile, setGoFile] = useState(null);
    const [multiBackground, setMultiBackground] = useState([]);
    const [direction, setDirection] = useState("+");
    const [geneFiles, setGeneFiles] = useState([]);
    const [goFileColumns, setGoFileColumns] = useState([])
    // loading state: After launching but before the gocompass returns the results loading state is true
    const [isLoading, setIsLoading] = useState(false);
    const [conditions, setConditions] = useState([]);
    const [propagateBackground, setPropagateBackground] = useState(true)
    // Wang, Lin, Resnik, Edge based
    const [selectedMeasure, selectMeasure] = useState("Wang");
    const [pvalueFilter, setPvalueFilter] = useState(0.05);
    const [tab, setTab] = React.useState(0);

    const useStyles = makeStyles((theme: Theme) => createStyles({
        root: {
            flexGrow: 1,
        }, menuButton: {
            marginRight: theme.spacing(2),
        }, title: {
            flexGrow: 1,
        }, backdrop: {
            zIndex: theme.zIndex.drawer + 1,
            color: '#fff',
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
            multiRevigoGoLists(goFile, reorderedFiles, [...multiBackground], propagateBackground, selectedMeasure, pvalueFilter, direction, response => {
                props.setRootStore(response.results, response.conditions, response.tableColumns, response.hasFC, response.geneValues, response.goSetSize, selectedMeasure, pvalueFilter);
            });

        } else {
            const reorderedFiles = conditions.map(d => {
                return geneFiles[d.index];
            });
            multiSpeciesRevigo(reorderedFiles, [...multiBackground], propagateBackground, conditions.map(d => d.condition), conditions.map(d => d.background), selectedMeasure, pvalueFilter, direction, response => {
                props.setRootStore(response.results, response.conditions, response.tableColumns, response.hasFC, response.geneValues, response.goSetSize, selectedMeasure, pvalueFilter);
            });
        }
    }, [goFile, conditions, multiBackground, propagateBackground, selectedMeasure, pvalueFilter, geneFiles, props, direction]);
    const loadMouse = useCallback(() => {
        setIsLoading(true)
        exampleMouse((response) => {
            props.setRootStore(response.results, response.conditions, response.tableColumns, response.hasFC, response.geneValues, response.goSetSize, selectedMeasure, 0.00005);
        })
    }, [props, selectedMeasure])
    const loadTreponema = useCallback(() => {
        setIsLoading(true)
        exampleTreponema((response) => {
            props.setRootStore(response.results, response.conditions, response.tableColumns, response.hasFC, response.geneValues, response.goSetSize, selectedMeasure, pvalueFilter);
        })
    }, [props, pvalueFilter, selectedMeasure])
    const loadStreptomyces = useCallback(() => {
        setIsLoading(true)
        exampleStrepto((response) => {
            props.setRootStore(response.results, response.conditions, response.tableColumns, response.hasFC, response.geneValues, response.goSetSize, selectedMeasure, pvalueFilter);
        })
    }, [props, pvalueFilter, selectedMeasure])
    useEffect(() => {
        if (geneFiles.length > 0) {
            getGOheader(goFile, columns => {
                setGoFileColumns(columns)
            })
        }
    }, [geneFiles, goFile])

    let launchable = (goFile !== null || geneFiles.length > 0) && multiBackground.length > 0;
    const classes = useStyles();
    return (
        <div>
            <Tabs value={tab} onChange={(e, val) => setTab(val)} aria-label="simple tabs example">
                <Tab label={<HomeIcon/>} disabled={isLoading}/>
                <Tab label="Data Upload" disabled={isLoading}/>
                <Tab label="Example Data" disabled={isLoading}/>
            </Tabs>
            <div role="tabpanel" hidden={tab !== 0}>
                <Container>
                    <Typography variant={"h5"}> Welcome to GO-Compass!
                    </Typography>
                    <img src={schematic} alt={"Workflow Schematic"} width={"100%"}/>
                    <Typography>
                        Go-Compass (Gene Ontology list comparison using Semantic Similarity) is a visual analytics tool
                        for the dispensability reduction and visual comparison of lists of GO terms.
                        GO-Compass performs the analysis in multiple steps:

                    </Typography>
                    <ol>
                        <li> (Optional) For gene list input: GO-enrichment for each list of genes to obtain lists of
                            GO temrs
                        </li>
                        <li>Dispensability clustering: Adapted version of the REVIGO algorithm, a summarization
                            method based on semantic similarity
                            of GO terms, to perform hierarchical dispensability clustering on multiple lists.
                        </li>
                        <li>Interactive comparison: GO-Compass offers several visualizations for the comparison and
                            improved
                            interpretability of GO terms lists. The hierarchical dispensability clustering is
                            visualized as
                            a tree, where users can interactively filter out dispensable GO terms and create flat
                            clusters.
                            The flat clusters are visualized in animated treemaps, and are compared using a
                            correlation
                            heatmap, UpSet plots, and bar charts.
                        </li>
                    </ol>
                    <Typography variant={"subtitle1"}>More information:
                        <Link href="https://tuevis.cs.uni-tuebingen.de/go-compass/" target="_blank"
                              rel="noopener noreferrer"
                              style={{marginRight: "10px"}}>https://tuevis.cs.uni-tuebingen.de/go-compass/</Link>
                        <Link href="https://github.com/Integrative-Transcriptomics/GO-Compass" className={classes.link}
                              target="_blank" rel="noopener noreferrer">
                            <GitHubIcon/>
                        </Link>
                    </Typography>
                    <Alert severity={"info"}>Looking for example data? Get started <Link
                        component="button"
                        variant="body2"
                        onClick={() => {
                            setTab(2);
                        }}
                    >
                        here
                    </Link> </Alert>

                </Container>
            </div>
            <div
                role="tabpanel"
                hidden={tab !== 1}
            >
                <List dense>
                    <ListItem>
                        <List dense>
                            <Typography>Upload Gene or GO-term lists (1 required)<Tooltip
                                title={"When not uploading your own enrichment table, GO-term enrichment will be calculated by GO-Compass using the gene lists"}><HelpIcon/></Tooltip></Typography>
                            <ListSubheader>
                                <Typography>Select Gene Lists</Typography>
                            </ListSubheader>
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
                            <Typography>Select Background file(s) <Tooltip
                                title={"GO-Compass propagates the gene backgrounds using the is_a relationships of the gene ontology. If a different propagation is desired, disable background propagation and submit an already propagated background."}><HelpIcon/></Tooltip></Typography>
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
                            <ListItem>
                                <FormControlLabel
                                    control={<Switch checked={propagateBackground}
                                                     onChange={() => setPropagateBackground(!propagateBackground)}
                                                     name="checkedA"/>}
                                    label="Propagate background"
                                />
                            </ListItem>
                            {conditions.length > 0 ? <ListItem>{multiBackground.length > 0 && goFile === null ?
                                <SpecifyBackgrounds conditions={conditions} setConditions={setConditions}
                                                    geneFiles={geneFiles} isLoading={isLoading}
                                                    multiBackground={multiBackground}/> : goFile !== null ?
                                    <LinkGOGene conditions={conditions} setConditions={setConditions}
                                                isLoading={isLoading}
                                                goFileColumns={goFileColumns}/> : null}</ListItem> : null}
                        </List>
                    </ListItem>
                    <ListItem>
                        <List dense>
                            <Typography>Settings <Tooltip
                                title={"Semantic similarity: Wang's semantic similarity is usually a good choice. View the documentation for more information.\n P-value filter: GO-terms with p-values higher than the specified threshold in all lists are not considered for the clustering."}><HelpIcon/></Tooltip></Typography>
                            {geneFiles.length > 0 && goFile === null && multiBackground.length > 0 ? <ListItem>
                                <FormControl component="fieldset">
                                    <RadioGroup value={direction} onChange={(e) => setDirection(e.target.value)}>
                                        <FormControlLabel value="+" control={<Radio/>}
                                                          label="Find overrepresented GO Terms"
                                                          disabled={isLoading}/>
                                        <FormControlLabel value="-" control={<Radio/>}
                                                          label="Find underrepresented GO terms"
                                                          disabled={isLoading}/>
                                    </RadioGroup>
                                </FormControl>
                            </ListItem> : null}
                            <ListItem>
                                <FormControl className={classes.formControl}>
                                    <InputLabel>Similarity measure </InputLabel>
                                    <Select
                                        value={selectedMeasure}
                                        disabled={isLoading}
                                        onChange={(e) => selectMeasure(e.target.value)}
                                    >
                                        <MenuItem value="Wang">Wang</MenuItem>
                                        <MenuItem value="Lin">Lin</MenuItem>
                                        <MenuItem value="Resnik">Resnik</MenuItem>
                                        <MenuItem value="Edge distance">Edge distance</MenuItem>
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
                </List></div>
            <div hidden={tab !== 2}>
                <ExampleDataTable loadMouse={loadMouse} loadTreponema={loadTreponema} loadStrepto={loadStreptomyces}
                                  isLoading={isLoading}/>
            </div>
            <Backdrop className={classes.backdrop} open={isLoading}>
                <CircularProgress color="inherit"/>
            </Backdrop>
        </div>);
};
SelectData.propTypes = {
    setRootStore: PropTypes.func.isRequired,
};

export default SelectData;