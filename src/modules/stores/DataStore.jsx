import {action, extendObservable, reaction} from "mobx"
import {performCorrelation} from "../../parseDataFlask";
import * as d3 from "d3";
import {TableStore} from "./TableStore";
import {VisStore} from "./VisStore";
import {UpSetStore} from "./UpSetStore";

/**
 * Central store for data operations
 */
export class DataStore {
    constructor(dataTable, tree, conditions, tableColumns, rootStore) {
        this.rootStore = rootStore
        this.tableStore = new TableStore(dataTable, conditions, tableColumns);
        this.visStore = new VisStore(this);
        this.upSetStore = new UpSetStore(this, this.visStore)
        this.tableColumns = tableColumns;
        this.dataTable = dataTable;
        this.tree = this.traverse(tree, dataTable)[0];
        this.conditions = conditions;
        extendObservable(this, {
            filterCutoff: 0.7,
            clusterCutoff: 0.1,
            // tree filtered by filter cutoff
            filteredTree: {},
            // flat hierarchy of filtered go terms and filtered out go terms
            filterHierarchy: {},
            correlation: [],
            pca: [],
            pcaLoaded: false,
            correlationLoaded: false,
            /**
             * flat hierarchy of cluster representatives and other GO terms
             * @returns {{}}
             */
            get clusterHierarchy() {
                return this.extractHierarchy(this.filteredTree, this.clusterCutoff, true, false);
            },
            /**
             * flat hierarchy of cluster representatives and other GO terms
             * @returns {{}}
             */
            get clusterChildren() {
                return this.extractHierarchy(this.filteredTree, this.clusterCutoff, true, true);
            },
            /**
             * maximum dispensability found in currently visualized GO terms
             * @returns {number} maximum dispensability
             */
            get maxDisp() {
                return (d3.max(Object.keys(this.filterHierarchy).map(key => this.dataTable[key].dispensability)));
            },
            /**
             * minimum dispensability found in not visualized GO terms
             * @returns {number} minimum dispensability
             */
            get minFilteredDisp() {
                return (d3.min(Object.values(this.filterHierarchy).flat().map(key => this.dataTable[key].dispensability)));
            },
            /**
             * filters p-values by terms in filter hierarchy for pca and correlation
             * @returns {Object}
             */
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

            /**
             * Nests data for plots
             * @returns {Object}
             */
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
            get geneInformation() {
                const upDown = {}
                this.visStore.treeOrder.forEach(go => {
                    if (rootStore.hasFCs) {
                        upDown[go] = Array.from({length: conditions.length},
                            () => ({
                                up: 0,
                                total: 0,
                                setSize: this.rootStore.goSetSize[go]
                            }))
                    } else if (rootStore.hasGeneInfo) {
                        upDown[go] = Array.from({length: conditions.length},
                            () => ({
                                total: 0,
                                setSize: this.rootStore.goSetSize[go]
                            }))
                    } else {
                        upDown[go] = Array.from({length: conditions.length},
                            () => ({
                                setSize: this.rootStore.goSetSize[go]
                            }))
                    }
                    if (this.rootStore.hasGeneInfo) {
                        this.rootStore.go2genes[go]
                            .forEach(gene => {
                                this.rootStore.geneValues[gene].forEach((fc, i) => {
                                    if(this.rootStore.hasFCs) {
                                        if (fc > 0) {
                                            upDown[go][i].up += 1
                                        }
                                    }
                                    upDown[go][i].total += 1;
                                })
                            })
                    }
                })
                return upDown;
            },
            /**
             * gets all GO terms that are cluster representatives
             * @returns {string[]} cluster representatives
             */
            get clusterRepresentatives() {
                return Object.keys(this.clusterHierarchy)
            },
            /**
             * gets all GO terms that are currently visualized
             * @returns {string[]} current GO terms
             */
            get currentGOterms() {
                return Object.keys(this.filterHierarchy)
            },
            /**
             * sets filter cutoff
             */
            setFilterCutoff: action((cutoff) => {
                this.filterCutoff = cutoff;
            }),
            /**
             * sets cluster cutoff
             */
            setClusterCutoff: action((cutoff) => {
                this.clusterCutoff = cutoff;
            }),
            recalculateFiltering: action((cutoff) => {
                this.filteredTree = this.filterTree(this.tree, cutoff);
                this.filterHierarchy = this.extractHierarchy(this.tree, cutoff, false, false);
            })

        });
        // when the filter slider is moved, recalculate pca and correlation
        reaction(
            () => this.filteredPvalues,
            () => {
                performCorrelation(this.filteredPvalues, response => {
                    this.correlation = response;
                })
            });
        // when the filter slider is moved, restructure table
        reaction(
            () => this.filterHierarchy,
            (object) => {
                this.tableStore.initTermState(Object.keys(object));
            });
        // when the filter slider is moved and the displayed GO terms change
        // recalculate filtered tree and filterHierarchy
        reaction(() => this.filterCutoff, (cutoff => {
            if (cutoff < this.maxDisp || cutoff >= this.minFilteredDisp) {
                this.recalculateFiltering(cutoff);
            }
        }));
        this.recalculateFiltering(this.filterCutoff)
        /**
         * performs PCA
         */
        /*performPCA(this.filteredPvalues, response => {
            this.pca = response;
            this.pcaLoaded = true;
        });*/
        /**
         * Calculates p-value correlation
         */
        performCorrelation(this.filteredPvalues, response => {
            this.correlation = response;
            this.correlationLoaded = true;
        });
        this.tableStore.initTermState(Object.keys(this.filterHierarchy));
    }

    getGoSetSize(GO) {
        return (this.rootStore.goSetSize[GO])
    }

    getNumSigGenes(GO, index, direction) {
        const genes = this.rootStore.go2genes[GO];
        const values = genes.map(d => this.getGeneValue(d, index)).filter(d => d !== false)
        if (this.rootStore.hasFCs) {
            switch (direction) {
                case "up":
                    return (values.filter(d => d > 0).length);
                case "down":
                    return (values.filter(d => d < 0).length);
                default:
                    return (values.length);
            }
        } else {
            return (values.length);
        }

    }

    getGeneValue(gene, index) {
        if (!Object.keys(this.rootStore.geneValues).includes(gene)) {
            return false
        } else {
            return this.rootStore.geneValues[gene][index];
        }
    }

    /**
     * get parent Term of goTerm in flat clustering
     * @param {string} goTerm
     * @returns {string}
     */
    getFilterParent(goTerm) {
        return Object.keys(this.clusterHierarchy).filter(key => {
            return this.clusterHierarchy[key].includes(goTerm)
        })[0]
    }

    /**
     * extract flat hierarchy (flat clusters)
     * @param {Object} tree
     * @param {number} cutoff
     * @param {boolean} includeRep
     * @returns {{}} hierarchy
     */
    extractHierarchy(tree, cutoff, includeRep, includeAll) {
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
                        if (includeAll) {
                            toReturn[tree.name].push(...this.flattenTree(child))
                        }
                        const hierarchy = this.extractHierarchy(child, cutoff, includeRep, includeAll);
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

    /**
     * returns an array of a node and its children (GO term ids)
     * @param {Object} node
     * @returns {[string]} GO ids
     */
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

    /**
     * Stacks p-values
     * @param {Object} dataTable
     * @returns {*}
     */
    stackPvalues(dataTable) {
        Object.keys(dataTable).forEach(key => {
            const subtree = this.getSubtree(this.tree, key)
            if (subtree !== null) {
                this.flattenTree(subtree).forEach(term => {
                        dataTable[key].pvalues = dataTable[key].pvalues.map((d, i) => d + dataTable[term].pvalues[i])
                    }
                )
            }
        })
        return dataTable
    }

    /**
     * traverses tree and returns it in a format better suited for visualization
     * @param {Object} tree
     * @param {Object} dataTable
     * @returns {({children: [Object], name: string, value: number}|{name: string, value: number})[]|null}
     */
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

    /**
     * gets the subtree of name
     * @param {Object} tree
     * @param {string} name
     * @returns {Object} subtree
     */
    getSubtree(tree, name) {
        let reduce = [].reduce;

        function runner(result, tree) {
            if (result || !tree) return result;
            return (tree.name === name && tree) || //is this the proper node?
                runner(null, tree.children) || //process this nodes children
                reduce.call(tree, runner, result);  //maybe this is some ArrayLike Structure
        }

        return runner(null, tree);
    }

    /**
     * filters tree based on filter cutoff
     * @param {Object} tree
     * @param {number} cutoff
     * @returns {{name: string, value: number}|{children: [Object], name: string, value: number}}
     */
    filterTree(tree, cutoff) {
        if (this.dataTable[tree.name].dispensability <= cutoff) {
            if ("children" in tree) {
                const children = [];
                tree.children.forEach(child => {
                    if (this.dataTable[child.name].dispensability <= cutoff) {
                        children.push(this.filterTree(child, cutoff));
                    }
                });
                return ({"name": tree.name, "children": children, value: tree.value})
            }
            return {"name": tree.name, value: tree.value};
        }
    }

    /**
     * Nests the data for easier visualization using the d3.nest() function
     * @param {Object} data
     * @param {[string]} keys
     * @returns {[Object]} nested data
     */
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

