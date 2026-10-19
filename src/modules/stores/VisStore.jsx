import {action, extendObservable} from "mobx";
import * as d3 from "d3";
import {getTextWidth} from "../../UtilityFunctions";
import traverseTree from "../ClusteredHeatmap/RFLayout";

// Import Trrack functionality from ProvenanceStore.jsx
import { setConditiionIndexAction, setOverviewListComparisonTabAction, setLockedSelectionAction, setScaleLockedAction } from "./ProvenanceStore";

/**
 * store for visualization operations
 */
export class VisStore {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.animationDuration = 1500;
        extendObservable(this, {
            screenWidth: 1000,
            plotHeight: 900,
            treemapHeight: 100,
            treemapWidth: 100,
            scrollBarWidth: 17,
            showOverview: false,
            childHighlight: null,
            childHighlights: [],
            selectedConditions: [],
            selectionLocked: false,
            conditionIndex: 0,
            stepsize: 10,

            // Extra MobX-observed fields for provenance tracking
            overviewListComparisonTab: 0,      // Overview List Comparison in bottom left quadrant starts in tab 0: "All GO-Terms"
            scaleLocked: true,                 // per default, "LOCK Y-SCALE" in bottom right quadrant starts locked ("true")

            /**
             * color Scale for terms
             * @returns {*}
             */
            get termColorScale() {
                return d3.scaleOrdinal(['#8dd3c7', '#bebada', '#fb8072', '#80b1d3'
                    , '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f']);
            },
            get maxConditionTextSize() {
                return d3.max(this.dataStore.conditions.map(d => getTextWidth(d, 12, "normal")))
            },
            /**
             * layout function for treemaps. Created in store to ensure that
             * small multiples and selected Treemap have the same layout
             * @returns {function(*): *}
             */
            get treemapLayout() {
                const width = this.treemapWidth;
                const height = this.treemapHeight;
                const treemap = d3.treemap()
                    .tile(d3.treemapResquarify)
                    .size([width, height])
                    .padding(d => d.height === 1 ? 1 : 0)
                    .round(true);

                const root = treemap(d3.hierarchy({children: dataStore.nestedData, keys: dataStore.conditions})
                    .sum(d => d.values ? d3.sum(d.values) : 0)
                    .sort((a, b) => b.value - a.value));

                const max = d3.max(dataStore.conditions
                    .map((d, i) => d3.hierarchy({children: dataStore.nestedData, keys: dataStore.conditions})
                        .sum(d => d.values ? d.values[i] : 0).value));
                const layout = ((index) => {
                    const k = Math.sqrt(root.sum(d => d.values ? d.values[index] : 0).value / max);
                    const x = (1 - k) / 2 * width;
                    const y = (1 - k) / 2 * height;
                    return treemap.size([width * k, height * k])(root)
                        .each(d => {
                            d.x0 += x;
                            d.x1 += x;
                            d.y0 += y;
                            d.y1 += y;
                        })
                });
                return (layout)
            },
            get treeLayout() {
                return (traverseTree(dataStore.filteredTree, null, this.stepsize, 0.5 * this.stepsize));
            },
            get treeOrder() {
                return this.treeLayout.map(d => d.data.name);
            },
            get parentSizes() {
                const parents = [];
                const parentCounts = {};
                this.treeLayout.forEach(descendant => {
                    let parent = this.dataStore.getFilterParent(descendant.data.name);
                    if (!parents.includes(parent)) {
                        parents.push(parent);
                        parentCounts[parent] = 0
                    }
                    parentCounts[parent] += 1
                })
                return parents.map(parent => {
                    return ({id: parent, count: parentCounts[parent]})
                })
            },
            setTreeStepSize: action((stepsize) => {
                this.stepsize = stepsize
            }),
            setScreenWidth: action((width) => {
                this.screenWidth = width - 36;
            }),
            setPlotHeight: action((height) => {
                this.plotHeight = height - 80;
            }),
            setTreemapHeight: action((height) => {
                this.treemapHeight = height
            }),
            setTreemapWidth: action((width) => {
                this.treemapWidth = width
            }),
            setTsPlotType: action((type) => {
                this.tsPlotType = type;
            }),
            toggleShowOverview: action(() => {
                this.showOverview = !this.showOverview
            }),
            setChildHighlight: action((highlight) => {
                if (highlight === null) {
                    this.childHighlights = []
                } else {
                    this.childHighlights = [highlight];
                }
            }),
            setChildHighlights: action((highlights) => {
                this.childHighlights = highlights;
            }),
            setParentHighlight: action((highlight) => {
                if (highlight !== null) {
                    this.setChildHighlights(this.dataStore.clusterHierarchy[highlight])
                } else {
                    this.setChildHighlights([])
                }
            }),
            setConditionIndex: action((index) => {
                this.conditionIndex = index;

                // If provenance data is present, update the current conditionIndex inside of this provenance data based on the current ontology
                if (this.dataStore.rootStore.provenance) {
                    this.dataStore.rootStore.provenance.apply(
                        setConditiionIndexAction({
                            ontology: this.dataStore.ontology,
                            index: index
                        }),
                         `(${this.dataStore.ontology}) ${this.dataStore.conditions[index]}`);
                }
            }),
            setSigThreshold: action((threshold) => {
                this.sigThreshold = threshold;
            }),
            unlock: action(() => {
                // Only appy on provenance data if there was is a locked-in selection
                // unlock also triggers on every tab switch even if nothing is selected
                const lockedOrSelected = (this.selectionLocked || this.selectedConditions.length > 0);

                this.selectionLocked = false;
                this.selectedConditions = [];

                if (lockedOrSelected && this.dataStore.rootStore.provenance) {
                    this.dataStore.rootStore.provenance.apply(
                        setLockedSelectionAction({ontology: this.dataStore.ontology, selectionLocked: false, selectedConditions: []}), `OLC: Clear selection`);
                }
            }),
            setLockedSelection: action((indices) => {
                const conditionIndicesWithoutDuplicates=[...new Set(indices)];
                if(this.selectionLocked) {
                    if (conditionIndicesWithoutDuplicates.toString() === this.selectedConditions.toString()) {
                        this.selectionLocked = false;
                    } else {
                        this.selectedConditions = conditionIndicesWithoutDuplicates;
                    }
                } else {
                    this.selectionLocked = true;
                    this.selectedConditions = conditionIndicesWithoutDuplicates;
                }
                // New case for provenance handling: If provenance data is present, apply setLockedSelectionAction to the provenance data as well
                if (this.dataStore.rootStore.provenance) {

                    const selectedConditionNames = [];
                    this.selectedConditions.forEach(conditionIndex => {
                        selectedConditionNames.push(this.dataStore.conditions[conditionIndex]);
                    });

                    this.dataStore.rootStore.provenance.apply(
                        setLockedSelectionAction({ // try saying setLockedSelectionAction ten times in a row
                            ontology: this.dataStore.ontology,
                            selectionLocked: this.selectionLocked,
                            selectedConditions: this.selectedConditions
                        }),
                        `${this.selectionLocked ? "Lock" : "Unlock"} ${selectedConditionNames.join(", ")}`);
                }
            }),
            selectConditions: action((indices) => {
                if (!this.selectionLocked) {
                    this.selectedConditions = [...new Set(indices)];
                }
            }),
            // Provenance-enabled Overview List Comparison Tab display for when the user clicks the ALL GO-Terms / Significant GO-Terms tab in Overview List Comparison (bottom left quadrant)
            setOverviewListComparisonTab: action((tab) => {
                // Update MobX observed/observable overviewListComparisonTab field in VisStore instance
                this.overviewListComparisonTab = tab;
                // If provenance data is present, update the current tab inside of this provenance data based on the current ontology
                if (this.dataStore.rootStore.provenance) {
                    this.dataStore.rootStore.provenance.apply(
                        setOverviewListComparisonTabAction({ ontology: this.dataStore.ontology, tab: tab }),
                        // if in tab 0, display All GO-Terms, otherwise display Significant GO-Terms
                        `${tab === 0 ? "All GO-Terms" : "Significant GO-Terms"}`);
                }
            }),
            // Provenance-enabled (UN)LOCK Y-SCALE for when the user clicks sole button in Detailed Comparison (bottom right quadrant)
            setScaleLocked: action((locked) => {
                // Update MobX observed/observable locked field in VisStore instance
                this.scaleLocked = locked;
                // If provenance data is present, update the current tab inside of this provenance data based on the current ontology
                if (this.dataStore.rootStore.provenance) {
                    this.dataStore.rootStore.provenance.apply(
                        setScaleLockedAction({ ontology: this.dataStore.ontology, locked: locked }),
                        `DC: ${locked ? "Lock" : "Unlock"} Y-Scale`);
                }
            })
        })
    }
}