import {action, extendObservable, reaction} from "mobx"
import {multiRevigoGeneLists, performCorrelation, performPCA, readData} from "../../parseData";
import * as d3 from "d3";
import {TableStore} from "../DetailedTable/TableStore";
import {VisStore} from "./VisStore";


export class DataStore {
    /* some observable state */
    constructor() {
        this.tableStore = new TableStore();
        this.visStore=new VisStore(this);
        extendObservable(this, {
            filterCutoff: 0.7,
            clusterCutoff: 0.1,
            tree: null,
            dataTable: null,
            termOrder: [],
            conditions: null,
            dataLoaded: false,
            pcaLoaded: false,
            correlationLoaded: false,


            get isLoaded() {
                return this.dataLoaded && this.pcaLoaded && this.correlationLoaded
            },
            get filteredTree() {
                return this.filterTree(this.tree);
            },

            get clusterHierarchy() {
                return this.extractHierarchy(this.filteredTree, this.clusterCutoff, true);
            },
            get filterHierarchy() {
                return this.extractHierarchy(this.tree, this.filterCutoff, false);
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
            setFilterCutoff: action((cutoff) => {
                this.filterCutoff = cutoff;
            }),

            setClusterCutoff: action((cutoff) => {
                this.clusterCutoff = cutoff;
            }),

            loadGOListData: action((dataFile, ontology, pvalueFilter) => {
                readData(dataFile, ontology, pvalueFilter, (response) => {
                    this.dataTable = response.data;
                    this.tree = this.traverse(response.tree)[0];
                    this.conditions = response.conditions;
                    this.dataLoaded = true;

                })
            }),

            loadGeneListData: action((dataFiles, conditions, genome, ontology, pvalueFilter) => {
                multiRevigoGeneLists(dataFiles, conditions, genome, ontology, pvalueFilter, (response) => {
                    this.dataTable = response.data;
                    this.tree = this.traverse(response.tree)[0];
                    this.conditions = response.conditions;
                    this.dataLoaded = true;
                })
            })
        });
        reaction(
            () => this.filterCutoff,
            () => {
                if (this.dataLoaded) {
                    performPCA(this.filteredPvalues, response => {
                        this.pca = response;
                        this.pcaLoaded = true;
                    });
                    performCorrelation(this.filteredPvalues, response => {
                        this.correlation = response;
                        this.correlationLoaded = true;
                    })
                }
            });
        reaction(
            () => this.dataLoaded,
            () => {
                performPCA(this.filteredPvalues, response => {
                    this.pca = response;
                    this.pcaLoaded = true;
                });
                performCorrelation(this.filteredPvalues, response => {
                    this.correlation = response;
                    this.correlationLoaded = true;
                })
            });
        reaction(
            () => Object.keys(this.filterHierarchy),
            (keys) => {
                this.tableStore.initTermState(keys);
            });

    }

    getFilterParent(goTerm) {
        return Object.keys(this.clusterHierarchy).filter(key => {
            return this.clusterHierarchy[key].includes(goTerm)
        })[0]
    }


    extractHierarchy(tree, cutoff, includeRep) {
        const toReturn = {};
        if (this.dataTable[tree.name].dispensability < cutoff) {
            toReturn[tree.name] = [];
            if (includeRep) {
                toReturn[tree.name].push(tree.name)
            }
            if ("children" in tree) {
                tree.children.forEach(child => {
                    if (this.dataTable[child.name].dispensability >= cutoff) {
                        toReturn[tree.name].push(...this.flattenTree(child))
                    } else {
                        const hierarchy= this.extractHierarchy(child, cutoff, includeRep);
                        Object.keys(hierarchy).forEach(key=>{
                            if(!(key in toReturn)){
                                toReturn[key]=[]
                            }
                            toReturn[key].push(...hierarchy[key])
                        });
                    }
                });
            }
        }
        return toReturn;
    }


    flattenTree(tree) {
        const toReturn = [];
        Object.keys(tree).forEach(key => {
            if ((typeof tree[key]) == 'object' && tree[key] !== null) {
                const flatObject = this.flattenTree(tree[key]);
                Object.keys(flatObject).forEach(key2 => {
                    toReturn.push(flatObject[key2]);
                })
            } else {
                toReturn.push(tree[key]);
            }
        });
        return toReturn;
    }

    traverse(tree) {
        if (tree !== null && typeof tree == "object") {
            return (Object.entries(tree).map(([key, child]) => {
                if (typeof child == "object") {
                    return ({name: key, children: this.traverse(child)})
                } else return ({name: child});
            }));
        } else {
            return null;
        }
    }

    filterTree(tree) {
        if (this.dataTable[tree.name].dispensability < this.filterCutoff) {
            if ("children" in tree) {
                const children = [];
                tree.children.forEach(child => {
                    if (this.dataTable[child.name].dispensability < this.filterCutoff) {
                        children.push(this.filterTree(child));
                    }
                });
                return ({"name": tree.name, "children": children})
            }
            return {"name": tree.name};
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

