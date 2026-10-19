import {DataStore} from "./DataStore";
import {action, extendObservable} from "mobx";

// Import Trrack functionality from ProvenanceStore.jsx
//import * as ProvenanceStore from "./ProvenanceStore"
import {createGoCompassProvenance, setOntologyAction, setSigThresholdAction} from "./ProvenanceStore";

export class RootStore {
    constructor() {
        this.ontologies_map = {BP: "Biological process", MF: "Molecular function", CC: "Cellular component"};
        this.dataStores = {};
        this.selectedMeasure = "Wang";
        this.pvalueFilter = 0.05;
        this.hasGeneInfo = true;
        this.hasFCs = true
        this.geneValues = [];
        this.goSetSize = []

        // SESSION COUNTER
        // Incremeent sessionID every time init() is called, so App.js can fully "restart" when a session is imported via the importProvenance function
        // Introduced primarily as a workaround to avoid https://github.com/mobxjs/mobx-react#the-set-of-provided-stores-has-changed-error
        this.sessionID = 0;

        Object.keys(this.ontologies_map).forEach(ont => {
                this.dataStores[ont] = null
        });
        extendObservable(this, {
            initialized:false,
            ontology: "BP",
            sigThreshold: 0.05,
            ontologies: [],
            provenance: null,
            get logSigThreshold() {
                return -Math.log10(this.sigThreshold);
            },
            get previousActionLabel() {
                if (!this.provenance || !this.provenance.current.parent) {
                    return null;
                }
                return this.provenance.graph.nodes[this.provenance.current.parent].label;
            },
            get currentActionLabel() {
                if (!this.provenance) {
                    return null;
                }
                return this.provenance.current.label;
            },
            get nextActionLabel() {
                if (!this.provenance || this.provenance.current.children.length === 0) {
                    return null;
                }
                return this.provenance.graph.nodes[this.provenance.current.children[0]].label
            },
            // init starts dormant
            init: action((results, conditions, tableColumns, hasFC, geneValues, goSetSize, selectedMeasure, pvalueFilter) => {
                this.initialized=true
                this.sessionID += 1;

                this.selectedMeasure = selectedMeasure;
                this.pvalueFilter = pvalueFilter;
                this.hasGeneInfo = Object.keys(geneValues).length > 0;
                this.hasFCs = hasFC
                this.geneValues = geneValues;
                this.goSetSize = goSetSize
                Object.keys(results).forEach(ont => {
                    if (Object.keys(results[ont].tree).length !== 0) {
                        // Pass ontology id (ont) over to DataStore so its provenance-enabled actions can correctly utilize this.ontology
                        this.dataStores[ont] = new DataStore(ont, results[ont].data, results[ont].tree, conditions, tableColumns, this)
                    } else {
                        this.dataStores[ont] = null
                    }
                });
                this.ontologies = Object.keys(results).map(ont => {
                    return ({id: ont, name: this.ontologies_map[ont]})
                });
                this.sigThreshold = Number(pvalueFilter) <= 0.05 ? Number(pvalueFilter) : 0.05
                
                // TRRACK COMPONENT FOR MobX extendObservable START
                // Three extra MobX-observed fields, relevant for  export/import logic further down in this file
                this.conditions = conditions;
                this.results = results;
                this.tableColumns = tableColumns;
                
                /* Create Provenance and observe it globally
                * Call createGoCompassProvenance from ProvenanceStore to build provenance out of:
                *  Global, independent variables:
                *   ontology and sigThreshold:              Global values shared by the entirety of GO-Compass. They're set up via extendObservable right in _this_ specific RootStore instance
                *
                *  Local, dependent variables:
                *   filterCutoff and clusterCutoff:         Ontology-dependent values associated with the Cluster and Filter slider seen in the top left quadrant of the app
                * 
                *   conditionIndex:                         Ontology-dependent value that records which specific comparison pair (like D8vsD0, ...)
                *                                           is currently selected/getting displayed to the user in the top right treemap panel
                * 
                *   overviewListComparisonTab:              Ontology-dependent value that records whether the "All GO-Terms" or "Significant GO-Terms"
                *                                           tab is currently selected in the Overview List Comparison panel (bottom left quadrant)
                * 
                *   selectionLocked and selectedConditions: Ontology-dependent values that record whether a set/intersection selection is currently locked in the
                *                                           UpSet plot and which conditions it contains (Significant GO-Terms tab, bottom left quadrant)
                *
                *   scaleLocked:                            Ontology-dependent value that records whether the Y-Axis of the faceted bar chart in the bottom-right is locked
                * 
                *   initialTableSortKey, initialTableSortDir  Ontology-dependent values that record which column of the bottom table is being sorted and if its *                                             ascending or descending
                * 
                *   setTableGlobalOpenAction                 Ontology-dependent value that records whether table at the bottom is expanded or collapsed
                */
                this.provenance = createGoCompassProvenance(this.ontology, this.sigThreshold, this.seedStatesPerOntology());
                // Replay into RootStore only on undo/redo. NOTE: Don't use it on apply()
                this.provenance.addGlobalObserver(action((graph, change) => {
                    // This flag tells Trrack that the app state has changed, thereby keeping it in sync with MobX
                    if (change === "CurrentChanged") {
                        const state = this.provenance.state;

                        this.ontology = state.ontology;
                        this.sigThreshold = state.sigThreshold;
                        this.restoreStatesPerOntology(state);
                    }
                }));
                // Inform Trrack that our provenance has been initialized, allowing Trrack to perform .apply() actions on this.provenance
                this.provenance.done();
                this.syncStateFromProvenance(this.provenance.state);
            }),

            // Seed/populate per-ontology objects for all values that help us create Trrack's initial state
            // Technically we do not need a separate function for initial seeding. This could be done right next to this.provenance = createGoCompassProvenance(...), but in my opinion, it does improve code readability quite a bit
            seedStatesPerOntology: action(() => {
                const initialFilterCutoff = {}, initialClusterCutoff = {}, initialConditionIndex = {}, initialOverviewListComparisonTab = {}, initialSelectionLocked = {}, 
                initialSelectedConditions = {}, initialScaleLocked = {}, initialTableGlobalOpen = {}, initialTableSortKey = {}, initialTableSortDir = {};
                // "for every ontology ID available, if said ontology ID has a DataStore instance, 
                // read its current values and then use them to seed Trrack's initial per-ontology state"
                Object.keys(this.dataStores).forEach(ont => {
                    if (this.dataStores[ont]) {
                        // Values relevant for the top left quadrant of the app
                        initialFilterCutoff[ont] = this.dataStores[ont].filterCutoff;
                        initialClusterCutoff[ont] = this.dataStores[ont].clusterCutoff;

                        // Values relevant for the top right quadrant of the app
                        initialConditionIndex[ont] = this.dataStores[ont].visStore.conditionIndex;

                        // Values relevant for the bottom left quadrant of the app
                        initialOverviewListComparisonTab[ont] = this.dataStores[ont].visStore.overviewListComparisonTab;
                        initialSelectionLocked[ont] = this.dataStores[ont].visStore.selectionLocked;
                        initialSelectedConditions[ont] = this.dataStores[ont].visStore.selectedConditions;

                        // Values relevant for the bottom right quadrant of the app
                        initialScaleLocked[ont] = this.dataStores[ont].visStore.scaleLocked;

                        // Values for the table at the very bottom of the app
                        initialTableGlobalOpen[ont] = this.dataStores[ont].tableStore.globalOpen;
                        initialTableSortKey[ont] = this.dataStores[ont].tableStore.sortKey;
                        initialTableSortDir[ont] = this.dataStores[ont].tableStore.sortDir;
                    }
                });
                return {
                    filterCutoff: initialFilterCutoff, clusterCutoff: initialClusterCutoff,
                    conditionIndex: initialConditionIndex,
                    overviewListComparisonTab: initialOverviewListComparisonTab, selectionLocked: initialSelectionLocked, selectedConditions: initialSelectedConditions,
                    scaleLocked: initialScaleLocked,
                    globalOpen: initialTableGlobalOpen, sortKey: initialTableSortKey, sortDir: initialTableSortDir
                };
            }),

            // Restore per-ontology state directly to the DataStore/VisStore/ instances [filter/cluster cutoffs, results tab, locked selection, perhaps more to come...]
            // This revision now bypasses their actions, preventing provenance.apply() from getting re-triggered, thus avoiding some strange self-loop
            restoreStatesPerOntology: action((state) => {
                // "for every ontology ID available, if said ontology ID has a DataStore instance, 
                // read Trrack's current per-ontology state and use it to restore the DataStore's and VisStore's value"
                Object.keys(this.dataStores).forEach(ont => {
                    if (this.dataStores[ont]) {
                        // Values relevant for the top left quadrant of the app
                        this.dataStores[ont].clusterCutoff = state.clusterCutoff[ont];

                        // Occasionally, the filterCutoff value did not correctly get recalculated upon state restoration. If it's not up-to-date, the code below should fix it.
                        // Important: If we now restore filterCutoff from provenance, the client may send an HTTP POST request to the Python backend if values differ.
                        // That means even if we're just restoring from provenance, our JS frontend is not independent from the Python backend.
                        if (this.dataStores[ont].filterCutoff !== state.filterCutoff[ont]) {
                            const newFilterCutoff = state.filterCutoff[ont];

                            this.dataStores[ont].filterCutoff = newFilterCutoff;
                            this.dataStores[ont].recalculateFiltering(newFilterCutoff);

                            // Resync termState with filterHierarchy. MobX normally manages to sync this automatically, but sometimes it's not fast enough?
                            // The issue only seems to happen when importing a larger session. Whatever the exact cause may be, the code below stops the issue from appearing
                            this.dataStores[ont].tableStore.initTermState(Object.keys(this.dataStores[ont].filterHierarchy));
                        }

                        // Values relevant for the top right quadrant of the app
                        this.dataStores[ont].visStore.conditionIndex = state.conditionIndex[ont];

                        // Values relevant for the bottom left quadrant of the app
                        this.dataStores[ont].visStore.overviewListComparisonTab = state.overviewListComparisonTab[ont];
                        this.dataStores[ont].visStore.selectionLocked = state.selectionLocked[ont];
                        this.dataStores[ont].visStore.selectedConditions = state.selectedConditions[ont];

                        // Values relevant for the bottom right quadrant of the app
                        this.dataStores[ont].visStore.scaleLocked = state.scaleLocked[ont];

                        // Values for the table at the very bottom of the app
                        this.dataStores[ont].tableStore.globalOpen = state.globalOpen[ont];
                        this.dataStores[ont].tableStore.sortKey = state.sortKey[ont];
                        this.dataStores[ont].tableStore.sortDir =state.sortDir[ont];

                        // If this ontology has a sortKey associated with it, make sure that the GO-TERM sorting actually gets applied
                        if (state.sortKey[ont]) {
                            this.dataStores[ont].tableStore.sortHelper(state.sortKey[ont], state.sortDir[ont]);
                        }
                    }
                });
            }),

            // Sync the state of the current provenance. Required for Trrack's URL sharing feature.
            syncStateFromProvenance: action((state) => {
                this.ontology = state.ontology;
                this.sigThreshold = state.sigThreshold;
                this.restoreStatesPerOntology(state);
            }),

            // Setter for ontology, provenance-enabled
            setOntology: action((ontology) => {
                this.ontology = ontology;
                if (this.provenance) {
                    this.provenance.apply(setOntologyAction(ontology), `Ont: ${ontology}`);
                }
            }),
            // Setter for significance threshold, provenance-enabled
            setSigThreshold: action((threshold) => {
                this.sigThreshold = threshold;
                if (this.provenance) {
                    this.provenance.apply(setSigThresholdAction(threshold), `SigTresh: ${threshold}`);
                }
            }),

            // Import session & provenance data functionality for data previously created by exportProvenance()
            importProvenance: action((json) => {
                const session = JSON.parse(json);
                // Initializes a new session from within our current session... and crashes React. [fixed in commit 7a18fec, more info in commit 1593a50]
                this.init(session.sessionData.results, session.sessionData.conditions, session.sessionData.tableColumns,
                    session.sessionData.hasFC, session.sessionData.geneValues, session.sessionData.goSetSize,
                    session.sessionData.selectedMeasure, session.sessionData.pvalueFilter);

                this.provenance.importProvenanceGraph(session.provenanceGraph);

                const state = this.provenance.state;
                this.ontology = state.ontology;
                this.sigThreshold = state.sigThreshold;
                this.restoreStatesPerOntology(state);
            }),

            // Un-initialize GO-Compass & null its provenance, thereby bringing the user back to the landing page / data upload part
            goBackToUpload: action(() => {
                this.initialized = false;
                this.provenance = null;
                // If createGoCompassProvenance utilizes URL sharing (loadFromUrl: true), we need to strip away the ?provState= parameter for a full reset.
                window.history.replaceState({}, '', window.location.pathname);
            })
        });
        // TRRACK COMPONENT FOR MobX extendObservable END
    }

    // Store session values (=calculation results from the Python backend) & provenance graph inside a JSON file, then open download popup for user
    exportProvenance() {
        if (!this.provenance) {
            console.error("Provenance graph is not yet initialized.");
            return;
        }

        const session = {
            sessionData: {
                results: this.results,
                conditions: this.conditions,
                tableColumns: this.tableColumns,
                hasFC: this.hasFCs,
                geneValues: this.geneValues,
                goSetSize: this.goSetSize,
                selectedMeasure: this.selectedMeasure,
                pvalueFilter: this.pvalueFilter,
            },

            provenanceGraph: this.provenance.exportProvenanceGraph(),
        }

        const json = JSON.stringify(session);
        let blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
        let url = URL.createObjectURL(blob);
        let link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "go-compass-session-export.json");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}