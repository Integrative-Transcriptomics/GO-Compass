import {action, extendObservable} from "mobx";

// Import Trrack functionality from ProvenanceStore.jsx
import { setTableSortAction, setTableGlobalOpenAction } from "./ProvenanceStore";

/**
 * store for results table
 */
export class TableStore {
    // Per default, each DataStore creates its own TableStore instance (memo: RootStore creates one DataStore per ontology).
    // We now need to provide each TableStore instance with a way to check RootStore's provenance, so it can apply its provenance-enabled actions
    constructor(dataStore, dataTable, conditions, tableColumns) {
        this.dataStore = dataStore;
        this.tableColumns = tableColumns;
        this.mapper = {};
        Object.keys(dataTable).forEach(goTerm => {
            this.mapper[goTerm] = {};
            Object.keys(dataTable[goTerm]).forEach(key => {
                if (key === "pvalues") {
                    conditions.forEach((condition, i) => {
                        this.mapper[goTerm][condition] = dataTable[goTerm]['pvalues'][i];
                    })
                } else if (key === "Genes") {
                    this.mapper[goTerm][key] = dataTable[goTerm][key].join(",");

                } else {
                    this.mapper[goTerm][key] = dataTable[goTerm][key];
                }
            })
        });
        extendObservable(this, {
            globalOpen: "closed",
            sortKey: null,
            sortDir: 'desc',
            visualize: false,
            termState: [],
            initTermState: action((terms) => {
                this.termState = terms.map(term => {
                    return ({goTerm: term, open: false})
                });
            }),
            setTermOrder: action((termOrder) => {
                this.termState = termOrder;
            }),
            setGlobalOpen: action((open) => {
                this.globalOpen = open;
            }),
            setSortKey: action((key) => {
                this.sortKey = key;
            }),
            setSortDir: action((dir) => {
                this.sortDir = dir;
            }),
            setVisualize: action((vis) => {
                this.visualize = vis;
            }),
            toggleGlobalOpen: action(() => {
                this.setTermOrder(this.termState.map((d, i) => {
                    if (this.globalOpen === "open" || this.globalOpen === "any") {
                        return ({goTerm: this.termState[i].goTerm, open: false});
                    } else {
                        return ({goTerm: this.termState[i].goTerm, open: true});
                    }
                }));
                if (this.globalOpen === "open" || this.globalOpen === "any") {
                    this.setGlobalOpen("closed");
                } else {
                    this.setGlobalOpen("open");
                }

                if (this.dataStore.rootStore.provenance) {
                    this.dataStore.rootStore.provenance.apply(
                        setTableGlobalOpenAction({
                            ontology: this.dataStore.ontology,
                            globalOpen: this.globalOpen
                        }),
                        `Term table: ${this.globalOpen}`);
                }
            }),
            toggleOpen: action((goTerm) => {
                let open2Copy = this.termState.slice();
                const goTermIndex = open2Copy.map(d => d.goTerm).indexOf(goTerm);
                open2Copy[goTermIndex].open = !open2Copy[goTermIndex].open;
                this.setTermOrder(open2Copy);
                // Open/collapse state is now fully handled by Trrack
                // if (this.globalOpen !== "any") {
                //     this.setGlobalOpen("any");
                // }
            }),
            // This is the sorting logic previously found in sort: action((key) => { ... } extracted into its own helper method.
            // Due to the new tracking and syncing functionality, we need to re-apply its sorting algorithm multiple times (e.g. in RootStore's restoreStatesPerOntology)
            sortHelper: action((key, dir) => {
                let elements = this.termState.slice();
                let comparisonDir = dir === 'desc' ? -1 : 1;
                elements.sort((a, b) => {
                    if (this.mapper[a.goTerm][key] < this.mapper[b.goTerm][key]) {
                        return -comparisonDir;
                    }
                    else if (this.mapper[a.goTerm][key] > this.mapper[b.goTerm][key]) {
                        return comparisonDir;
                    }
                    else return 0;
                });
                this.setTermOrder(elements);
            }),
            sort: action((key) => {
                let dir = this.sortKey === key && this.sortDir === 'desc' ? 'asc' : 'desc';
                this.sortHelper(key, dir);
                this.setSortDir(dir);
                // TermOrder is now handled by sortHelper
                // this.setTermOrder(elements);
                this.setSortKey(key);

                if (this.dataStore.rootStore.provenance) {
                    this.dataStore.rootStore.provenance.apply(
                        setTableSortAction({
                            ontology: this.dataStore.ontology,
                            sortKey: key,
                            sortDir: dir
                        }),
                        `Col: ${key}, ${dir} sort`);
                }
            }),

        })
    }

    downloadCSV() {
        let rows = this.tableColumns.join("\t") + "\n"
        rows = rows + this.termState.map((state, i) => {
            return (this.tableColumns.map(col => this.mapper[state.goTerm][col])).join("\t")
        }).join("\n")
        let blob = new Blob([rows], {type: 'text/csv;charset=utf-8;'})
        let url = URL.createObjectURL(blob);
        let link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "go-table.tsv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}