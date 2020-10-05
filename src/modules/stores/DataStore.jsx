import {action, extendObservable, reaction} from "mobx"
import {performCorrelation, performPCA} from "../../parseDataFlask";
import * as d3 from "d3";
import {TableStore} from "../DetailedTable/TableStore";
import {VisStore} from "./VisStore";


export class DataStore {
    /* some observable state */
    constructor(dataTable, tree, conditions, tableColumns) {
        this.tableStore = new TableStore();
        this.visStore = new VisStore(this);
        this.tableColumns = tableColumns;
        extendObservable(this, {
            filterCutoff: 0.7,
            clusterCutoff: 0.1,
            dataTable: dataTable,
            tree: this.traverse(tree, dataTable)[0],
            filteredTree: {},
            filterHierarchy: {},
            conditions: conditions,
            correlation: [],
            pca: [],
            pcaLoaded: false,
            correlationLoaded: false,


            get clusterHierarchy() {
                return this.extractHierarchy(this.filteredTree, this.clusterCutoff, true);
            },
            get maxDisp() {
                return (d3.max(Object.keys(this.filterHierarchy).map(key => this.dataTable[key].dispensability)));
            },
            get minFilteredDisp() {
                return (d3.min(Object.values(this.filterHierarchy).flat().map(key => this.dataTable[key].dispensability)));

            },
            get filteredPvalues() {
                const pvalues = {"goTerm": []};
                Object.entries(this.dataTable).forEach(([key, value]) => {
                    if (key in this.filterHierarchy) {
                        pvalues["goTerm"].push(key);
                        this.conditions.forEach((condition, i) => {
                            if (!(condition in pvalues)) {
                                pvalues[condition] = [];
                            }
                            pvalues[condition].push(value.pvalues[i]);
                        })
                    }
                });
                return pvalues;
            },

            get nestedData() {
                const goMap = new Map();
                Object.keys(this.clusterHierarchy).forEach(goTerm => {
                    this.clusterHierarchy[goTerm].forEach(d => {
                        goMap.set(d, goTerm)
                    });
                });
                const pvalues = [];
                Object.keys(this.dataTable).forEach(goTerm => {
                    if (goMap.has(goTerm)) {
                        pvalues.push({
                            id: goTerm,
                            name: this.dataTable[goTerm].description,
                            values: this.dataTable[goTerm].pvalues.map(d => d + 0.0000001)
                        })
                    }
                });
                return this.nest(pvalues, d => goMap.get(d.id))
            },
            get clusterRepresentatives() {
                return Object.keys(this.clusterHierarchy)
            },
            setFilterCutoff: action((cutoff) => {
                this.filterCutoff = cutoff;
            }),

            setClusterCutoff: action((cutoff) => {
                this.clusterCutoff = cutoff;
            }),
        });
        reaction(
            () => this.filteredPvalues,
            () => {
                performPCA(this.filteredPvalues, response => {
                    this.pca = response;
                });
                performCorrelation(this.filteredPvalues, response => {
                    this.correlation = response;
                })
            });
        reaction(
            () => this.filterHierarchy,
            (object) => {
                this.tableStore.initTermState(Object.keys(object));
            });
        reaction(() => this.filterCutoff, (cutoff => {
            if (cutoff < this.maxDisp || cutoff >= this.minFilteredDisp) {
                    this.filteredTree = this.filterTree(this.tree);
                    this.filterHierarchy = this.extractHierarchy(this.tree, cutoff, false);
            }
        }));
        this.filteredTree = this.filterTree(this.tree);
        this.filterHierarchy = this.extractHierarchy(this.tree, this.filterCutoff, false);
        performPCA(this.filteredPvalues, response => {
            this.pca = response;
            this.pcaLoaded = true;
        });
        performCorrelation(this.filteredPvalues, response => {
            this.correlation = response;
            this.correlationLoaded = true;
        });
        this.tableStore.initTermState(Object.keys(this.filterHierarchy));
    }

    getFilterParent(goTerm) {
        return Object.keys(this.clusterHierarchy).filter(key => {
            return this.clusterHierarchy[key].includes(goTerm)
        })[0]
    }


    extractHierarchy(tree, cutoff, includeRep) {
        const toReturn = {};
        if (this.dataTable[tree.name].dispensability <= cutoff) {
            toReturn[tree.name] = [];
            if (includeRep) {
                toReturn[tree.name].push(tree.name)
            }
            if ("children" in tree) {
                tree.children.forEach(child => {
                    if (this.dataTable[child.name].dispensability > cutoff) {
                        toReturn[tree.name].push(...this.flattenTree(child))
                    } else {
                        const hierarchy = this.extractHierarchy(child, cutoff, includeRep);
                        Object.keys(hierarchy).forEach(key => {
                            if (!(key in toReturn)) {
                                toReturn[key] = []
                            }
                            toReturn[key].push(...hierarchy[key])
                        });
                    }
                });
            }
        }
        return toReturn;
    }


    flattenTree(node) {
        const toReturn = [];
        if ("children" in node) {
            node.children.forEach(child => {
                toReturn.push(...this.flattenTree(child));
            });
        }
        toReturn.push(node.name);
        return toReturn
    }

    traverse(tree, dataTable) {
        if (tree !== null && typeof tree == "object") {
            return (Object.entries(tree).map(([key, child]) => {
                if (typeof child == "object") {
                    return ({
                        name: key,
                        children: this.traverse(child, dataTable),
                        value: dataTable[key].dispensability
                    })
                } else return ({name: child, value: dataTable[child].dispensability});
            }));
        } else {
            return null;
        }
    }

    filterTree(tree) {
        if (this.dataTable[tree.name].dispensability <= this.filterCutoff) {
            if ("children" in tree) {
                const children = [];
                tree.children.forEach(child => {
                    if (this.dataTable[child.name].dispensability <= this.filterCutoff) {
                        children.push(this.filterTree(child));
                    }
                });
                return ({"name": tree.name, "children": children, value: tree.value})
            }
            return {"name": tree.name, value: tree.value};
        }
    }

    nest(data, ...keys) {
        const nest = d3.nest();
        for (const key of keys) nest.key(key);

        function hierarchy({key, values}, depth) {
            return {
                id: key,
                name: data.filter((d) => d.id === key)[0].name,
                children: depth < keys.length - 1
                    ? values.map(d => hierarchy(d, depth + 1))
                    : values
            };
        }

        return nest.entries(data).map(d => hierarchy(d, 0));
    }


}

