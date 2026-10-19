import React, {useEffect, useState} from 'react';
import Plots from "./modules/Plots";
import Toolbar from "@material-ui/core/Toolbar";
import AppBar from "@material-ui/core/AppBar";
import Typography from "@material-ui/core/Typography";
import {createStyles, FormControl, InputLabel, MenuItem, Select} from "@material-ui/core";
import {makeStyles} from "@material-ui/core/styles";
import SelectData from "./modules/SelectData";
import {observer, Provider} from "mobx-react";
import IconButton from "@material-ui/core/IconButton";
import GitHubIcon from "@material-ui/icons/GitHub";

// Additional Material UI icons for the main view
import Button from "@material-ui/core/Button";
import UndoIcon from "@material-ui/icons/Undo";
import RedoIcon from "@material-ui/icons/Redo";
import GetAppIcon from "@material-ui/icons/GetApp";
import PublishIcon from "@material-ui/icons/Publish";
import { Link } from "@material-ui/core"
// When enabling URL sharing, include the import statements below.
// import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@material-ui/core"
// import LinkIcon from "@material-ui/icons/Link"; Enable import for URL sharing.


// Additional icons for the side drawer and the provenance graph rendering component
import AccountTreeIcon from "@material-ui/icons/AccountTree";
// import History from "@material-ui/icons/History";
import {Drawer} from "@material-ui/core";
import ProvenanceGraph from "./modules/ProvenanceGraph";


const App = observer((props) => {
    const useStyles = makeStyles((theme) =>
        createStyles({
            root: {
                flexGrow: 1,
            },
            menuButton: {
                marginRight: theme.spacing(2),
                minWidth: 170 // prevent buttons from "shrinking" when the user selects options with short name
            },
            title: {
                flexGrow: 1,
            },
            input: {
                color: "white",
                borderColor: "white"
            },
            select: {
                color: "white",
                '&:before': {
                    borderColor: "white",
                },
                '&:after': {
                    borderColor: "white",
                }
            },
            icon: {
                fill: "white",
            },
        }),
    );
    const appBar = React.createRef();

    // Is React currently displaying the shareDialog to the user? Default: false
    // URL sharing dialog state is currently disabled as it is not a very robust solution.
    // const [shareDialogOpen, setShareDialogOpen] = useState(false);

    // Is the Provenance Graph currently being displayed to the user? Default: false
    const [provenanceGraphOpen, setProvenanceGraphOpen] = useState(false);

    // Pattern to identify decimal numbers with
    const decimalPattern = /\d+\.\d+/g;

    // Replace labels that use lengthy decimal values, e.g. "Filter: 0.423352352342" with labels with truncated decimal values
    const shortenActionLabel = (label) => {
        if (!label) {
            return label;
        } else {
            return label.replace(decimalPattern, (rawNumber) => parseFloat(rawNumber).toFixed(2));
        }
    };


    useEffect(() => {
        if (appBar.current != null && props.rootStore.initialized) {
            props.rootStore.dataStores[props.rootStore.ontology].visStore.setPlotHeight(window.innerHeight - appBar.current.getBoundingClientRect().height);
        }
    }, [appBar, props.rootStore.dataStores, props.rootStore.initialized, props.rootStore.ontology]);

    // Keyboard shortcut functionality ("hotkeys") 
    // CTRL+Z (STRG+Z) to undo a provenance-enabled action | CTRL+Y (STRG+Y) to redo a provenance-enabled action | G to open up provenance graph drawer
    useEffect(() => {
        const handleKeyDown = (event) => {

            const targetInFocus = event.target.tagName;

            // If the provenane graph's annotation textarea is opened, keyboard shortcuts need to be disabled. Otherwise G would immediately close the sidebar and so on
            if (event.target.isContentEditable || targetInFocus === "TEXTAREA" || targetInFocus === "INPUT" ) {
                return;
            }

            // No provenance? No undo/redo hotkeys!
            if (!props.rootStore.provenance) {
                return;
            }

            // Hotkey assignment
            const isUndo = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z";
            const isRedo = (event.ctrlKey || event.metaKey) && (event.key.toLowerCase() === "y" || (event.shiftKey && event.key.toLowerCase() === "z"));

            // internally the button is called History, but the key "H" is reserved in many browsers. So G for Graph is the alternate and equally mnemonic choice
            const isHistory = (event.key.toLowerCase() === "g"); 

            // Execute undo/redo logic depending on what button has been triggered
            if (isUndo) {
                event.preventDefault();
                if (props.rootStore.provenance.current.id !== props.rootStore.provenance.root.id) {
                    props.rootStore.provenance.undo();
                }
            } else if (isRedo) {
                event.preventDefault();
                if (props.rootStore.provenance.current.children.length !== 0) {
                    props.rootStore.provenance.redo();
                }
            } else if (isHistory) {
                event.preventDefault();
                setProvenanceGraphOpen((previousDrawerState) => {
                    return !previousDrawerState
                });
            }
        };

        // Global keydown listener for the entire GO-Compass window (incl. drawer with provenance graph)
        window.addEventListener("keydown", handleKeyDown);
        // Remove old listener before attaching new one when the effect is re-run
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [props.rootStore]);

    const classes = useStyles();
    let views = [];
    // create one view for each ontology
    props.rootStore.ontologies.forEach(ont => {
        if (props.rootStore.dataStores[ont.id] !== null) {
            views.push(<div key={ont.id} style={{display: props.rootStore.ontology === ont.id ? "block" : "none"}}>
                <Provider dataStore={props.rootStore.dataStores[ont.id]}
                          visStore={props.rootStore.dataStores[ont.id].visStore}>
                    <Plots logSigThreshold={props.rootStore.logSigThreshold} sigThreshold={props.rootStore.sigThreshold}
                           isTimeSeries={props.rootStore.isTimeSeries}/>
                </Provider>
            </div>)
        }
    });
    return (
        // Trrack'd Title Bar Start
        <div className={classes.root}>
            <React.Fragment>
                <AppBar ref={appBar} position="sticky" style={{backgroundColor: "#a51e37"}}>
                    <Toolbar>
                        <div className={classes.title} style={ {display: "flex", alignItems: "center"} }>
                            <Link component="button" variant="h6" onClick={() => props.rootStore.goBackToUpload()}
                                style={{ textDecoration: "none", color: "white" }}>
                                GO-Compass
                            </Link>
                            <div style={{width: 20}} />
                            <Button component="label" style={{ color: "white" }}>
                                <input type="file"
                                    // needed as "label" so the button can trigger the file picker
                                    style={{display: "none"}}
                                    onChange={(event) => {
                                        // let the browser open a FileReader window
                                        const inputFile = event.target.files[0];
                                        const inputFileReader = new FileReader();
                                        inputFileReader.onload = () => props.rootStore.importProvenance(inputFileReader.result);
                                        inputFileReader.readAsText(inputFile);
                                        // reset the input back to "unset" state so the next time the user picks a file, the browser registers it as a new change
                                        event.target.value = null; 
                                    }}/>
                                <span style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <PublishIcon style={{ color: "white" }} />
                                    <span style={{ fontSize: "0.65rem" }}>Import Session</span>
                                </span>
                            </Button>
                            <Button disabled={!props.rootStore.provenance}
                                style={{color: props.rootStore.provenance ? "white" : "rgba(255, 255, 255, 0.3)"}} // white if provenance data is found, otherwise gray
                                onClick={() => props.rootStore.exportProvenance()}>
                               <span style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <GetAppIcon style={{ color: "white" }} />
                                    <span style={{ fontSize: "0.65rem" }}>Export Session</span>
                                </span>
                            </Button>
                            {/* UI element for URL sharing dialog. This is currently disabled as it is not a very robust solution.
                            <Button disabled={!props.rootStore.provenance}
                                style={{ color: props.rootStore.provenance ? "white" : "rgba(255, 255, 255, 0.3)" }} // white if provenance data is found, otherwise gray
                                onClick={() => setShareDialogOpen(true)}>
                                <span style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <LinkIcon style={{ color: props.rootStore.provenance ? "white" : "rgba(255, 255, 255, 0.3)" }} />
                                    <span style={{ fontSize: "0.65rem" }}>Share State via URL</span>
                                </span>
                            </Button> */}
                        </div>
                        <div style={{ flexGrow: 1 }} />
                        
                        {/* Mini provenance timeline found in the center of the title bar */}
                        <div style={ {flexGrow: 1 }} />
                        {props.rootStore.provenance ?
                            <Typography style={{ color: "white", whiteSpace: "nowrap", textAlign: "center", padding: "4px 4px", border: "1px solid white", borderRadius: 4, }}>
                                {props.rootStore.previousActionLabel ?  shortenActionLabel(props.rootStore.previousActionLabel) + " \u2192 "  : "SESSION START \u2192 " }
                                <b><u>{shortenActionLabel(props.rootStore.currentActionLabel)}</u></b>
                                {props.rootStore.nextActionLabel     ?  " \u2192 " + shortenActionLabel(props.rootStore.nextActionLabel)      :      " \u2192 END"      }
                            </Typography> : null}
                        <div style={ {flexGrow: 1 }} />
                        
                        {props.rootStore.initialized ?
        // Trrack'd Title Bar End
                            // Button in the top bar that reverses the last action perforemd by the user
                            // Disable Undo button when provenance is not available or when we're already sitting at the root node [strict equality might not be necessary]
                            [<Button key={"undo"} disabled={!props.rootStore.provenance || props.rootStore.provenance.current.id === props.rootStore.provenance.root.id}
                                style={{ color: (!props.rootStore.provenance || props.rootStore.provenance.current.id === props.rootStore.provenance.root.id) ? "rgba(255, 255, 255, 0.3)" : "white" }}
                                onClick={() => props.rootStore.provenance.undo()}>
                                <span style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                    <UndoIcon style={{ color: (!props.rootStore.provenance || props.rootStore.provenance.current.id === props.rootStore.provenance.root.id) ? "rgba(255, 255, 255, 0.3)" : "white" }} />
                                    <span style={{ fontSize: "0.65rem" }}>CTRL+Z</span>
                                </span>
                            </Button>,
                                // Button in the top bar that re-applies the last action undone by the undo button
                                // Disable Redo button when provenance is not available or when the graph has no children [strict equality is actually necessary]
                                <Button key={"redo"} disabled={!props.rootStore.provenance || props.rootStore.provenance.current.children.length === 0}
                                    style={{ color: (!props.rootStore.provenance || props.rootStore.provenance.current.children.length === 0) ? "rgba(255, 255, 255, 0.3)" : "white" }}
                                    onClick={() => props.rootStore.provenance.redo()}>
                                    <span style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                        <RedoIcon style={{ color: (!props.rootStore.provenance || props.rootStore.provenance.current.children.length === 0) ? "rgba(255, 255, 255, 0.3)" : "white" }} />
                                        <span style={{ fontSize: "0.65rem" }}>CTRL+Y</span>
                                    </span>
                                </Button>,
                                // Button in the top bar that opens up a drawer on the right side of the screen that contains the provenance graph
                                <Button key={"history"} disabled={!props.rootStore.provenance}
                                    style={{ color: props.rootStore.provenance ? "white" : "rgba(255, 255, 255, 0.3)" }}
                                    onClick={() => setProvenanceGraphOpen(true)}>
                                    <span style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                                        <AccountTreeIcon style={{ color: props.rootStore.provenance ? "white" : "rgba(255, 255, 255, 0.3)" }} />
                                        <span style={{ fontSize: "0.65rem" }}><u>G</u>raph</span>
                                    </span>
                                </Button>,
                            <FormControl className={classes.menuButton} key={"ont"}>
                                <InputLabel style={{color: "white"}}
                                >Ontology</InputLabel>
                                <Select
                                    className={classes.select}
                                    inputProps={{
                                        classes: {
                                            icon: classes.icon
                                        }
                                    }}
                                    value={props.rootStore.ontology}
                                    onChange={(e) => props.rootStore.setOntology(e.target.value)}
                                >
                                    {props.rootStore.ontologies.filter(ontology => props.rootStore.dataStores[ontology.id] !== null).map(ontology =>
                                        <MenuItem key={ontology.id}
                                                  value={ontology.id}>{ontology.name}</MenuItem>)}
                                </Select>
                            </FormControl>,
                                <FormControl className={classes.menuButton} key={"sig"}>
                                <InputLabel style={{color: "white"}}
                                >Significance Threshold</InputLabel>
                                <Select
                                    className={classes.select}
                                    inputProps={{
                                        classes: {
                                            icon: classes.icon
                                        }
                                    }}
                                    value={props.rootStore.sigThreshold}
                                    onChange={(e) => props.rootStore.setSigThreshold(e.target.value)}
                                >
                                    {[0.05,0.01,0.005,0.001,0.0005,0.0001,0.00005,0.00001].map(pval =>
                                        <MenuItem key={pval}
                                                  value={pval}>{pval}</MenuItem>)}
                                </Select>
                            </FormControl>,
                                <Typography key={"info"}>
                                    {"Method: "
                                        + props.rootStore.selectedMeasure + ", p-Value Filter: " + props.rootStore.pvalueFilter + ", Help"}
                                </Typography>] : <Typography>{"Help"}</Typography>}
                        <IconButton href="https://github.com/Integrative-Transcriptomics/GO-Compass"
                                    target="_blank"
                                    rel="noopener noreferrer"> <GitHubIcon style={{color: "white"}}/>
                        </IconButton>
                    </Toolbar>
                </AppBar>

                {/* URL SHARING INSTRUCTIONS DIALOG
                A popup dialog that informs the user about the URL sharing feature and its nuances */}
                {/* URL sharing dialog is currently disabled as it is not a very robust solution.
                <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
                    <DialogTitle>Please read carefully</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Pressing "Copy Link" in the bottom right corner of this window will encode this application's current state as a link and copy it into your computer's clipboad.
                            <br />You can use the copied link to share GO-Compass's current state with another person.
                            <br />This person then needs to:
                            <ol>
                                <li>Open up GO-Compass</li>
                                <li>Paste this link into the URL bar of their browser</li>
                                <li>Load <u>exactly</u> the same dataset that you used when you generated this link</li>
                            </ol>
                            Afterwards, the other person's view of GO-Compass should look exactly like yours at the time when you pressed "Copy Link".
                            <br />In order to do this, GO-Compass needs to pack a lot information into a single string of characters. As different browsers support different maximum URL lengths, <b>it is recommended to use the "Export Session" button in the top left corner of GO-Compass in order to share your progress as a file instead.</b>
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            navigator.clipboard.writeText(window.location.href);
                            setShareDialogOpen(false);
                        }}>Copy Link</Button>
                        <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
                    </DialogActions>
                </Dialog> */}

                {/* PROVENANCE GRAPH DRAWER
                Drawer that slides in from the right side of the screen when the user presses the graph (history) button in the top panel [see Button key={"history"} above] */}
                <Drawer anchor="right" open={provenanceGraphOpen} onClose={() =>  setProvenanceGraphOpen(false) } >
                    <div style={ { width: "30vw", height: "100vh", padding: 8, overflow: "auto", boxSizing: "border-box" } } > { /* show scrollbars if content is bigger than box */}
                        <Typography variant="h6">Provenance Graph</Typography>
                        <ProvenanceGraph open={provenanceGraphOpen} rootStore={props.rootStore} />
                    </div>
                </Drawer>

            </React.Fragment>
            {/* Whenever the sessionID in RootStore changes, React treats the fragement down below and everything inside of it as a brand new element.
                This allows us to avoid the https://github.com/mobxjs/mobx-react#the-set-of-provided-stores-has-changed-error issue [link isn't very helpful at all],
                although I'm still not entirely sure about the underlying React logic here. Here are the two sources that provided me with the idea for my solution/workaround:
                https://cmichel.io/react-fun-with-keys/, https://www.nikgraf.com/blog/using-reacts-key-attribute-to-remount-a-component */}
            <React.Fragment key={props.rootStore.sessionID}>
                {props.rootStore.initialized && views.length > 0 ? views :
                    <SelectData setRootStore={props.rootStore.init}/>}
                {props.rootStore.initialized && views.length === 0 ?
                    <Typography>No significant results</Typography> : null}
            </React.Fragment>
        </div>
    );
});

export default App;
