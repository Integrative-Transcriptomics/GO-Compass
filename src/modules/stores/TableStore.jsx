import {action, extendObservable} from "mobx";

/**
 * store for reasults table
 */
export class TableStore {
    constructor(dataTable, conditions) {
        this.mapper = {};
        Object.keys(dataTable).forEach(goTerm => {
            this.mapper[goTerm] = {};
            Object.keys(dataTable[goTerm]).forEach(key => {
                if (key !== "pvalues") {
                    this.mapper[goTerm][key] = dataTable[goTerm][key];
                } else {
                    conditions.forEach((condition, i) => {
                        this.mapper[goTerm][condition] = dataTable[goTerm]['pvalues'][i];
                    })
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
            }),
            toggleOpen: action((goTerm) => {
                let open2Copy = this.termState.slice();
                const goTermIndex = open2Copy.map(d => d.goTerm).indexOf(goTerm);
                open2Copy[goTermIndex].open = !open2Copy[goTermIndex].open;
                this.setTermOrder(open2Copy);
                if (this.globalOpen !== "any") {
                    this.setGlobalOpen("any");
                }
            }),
            sort: action((key) => {
                let elements = this.termState.slice();
                let dir = this.sortKey === key && this.sortDir === 'desc' ? 1 : -1;
                elements.sort((a, b) => {
                    if (this.mapper[a.goTerm][key] < this.mapper[b.goTerm][key]) {
                        return -dir;
                    } else if (this.mapper[a.goTerm][key] > this.mapper[b.goTerm][key]) {
                        return dir;
                    } else return 0;
                });
                this.setSortDir(this.sortKey === key && this.sortDir === 'desc' ? 'asc' : 'desc');
                this.setTermOrder(elements);
                this.setSortKey(key);
            }),
        })
    }
}