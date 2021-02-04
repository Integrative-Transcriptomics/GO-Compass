import {extendObservable} from "mobx";
import {extractSets, generateCombinations} from "@upsetjs/react";

export class UpSetStore {
    /* some observable state */
    constructor(dataStore, visStore) {
        this.dataStore = dataStore;
        this.visStore = visStore;
        extendObservable(this, {
                get highlights() {
                    if (this.visStore.childHighlights.length > 0) {
                        const sets = createSets(this.visStore.childHighlights);
                        const set = {};
                        set.type = "distinctIntersection"
                        set.color = undefined
                        set.degree = 1;
                        set.sets = new Set()
                        set.elems = sets[0].elems
                        set.cardinality = sets[0].cardinality
                        set.name = sets[0].name
                        if (sets.length > 1) {
                            set.name = "("
                        }
                        sets.forEach((currSet, i) => {
                            if (sets.length > 1) {
                                if (i < this.upSetSets.length - 1) {
                                    set.name += currSet.name + " ∩ "
                                } else {
                                    set.name += currSet.name + ")"
                                }
                            }
                            const index = this.upSetSets.map(d => d.name).indexOf(currSet.name);
                            if (index !== -1) {
                                set.sets.add(this.upSetSets[index])
                            }
                        })
                        return (set);
                    } else return null;
                },
                get upSetSets() {
                    return createSets(dataStore.currentGOterms)
                }
                ,
                get upSetCombinations() {
                    let combinations = generateCombinations(this.upSetSets).sort((a, b) => {
                        if (a.elems.length > b.elems.length) {
                            return -1
                        } else if (a.elems.length < b.elems.length) {
                            return 1
                        } else if (a.sets.size > b.sets.size) {
                            return -1
                        } else {
                            return 1
                        }
                    });
                    const filterIndices = [];
                    combinations.forEach((item, index, array) => {
                        if (index < array.length - 1 && !filterIndices.includes(index)) {
                            let index2;
                            for (index2 = index + 1; index2 < array.length; index2++) {
                                if (!filterIndices.includes(index2)) {
                                    let otherItem = array[index2]
                                    if (item.elems.every(elem => otherItem.elems.includes(elem))
                                        && otherItem.elems.every(elem => item.elems.includes(elem))) {
                                        if (item.sets.size > otherItem.sets.size) {
                                            filterIndices.push(index2)
                                        } else {
                                            filterIndices.push(index)
                                        }
                                    }
                                }
                            }
                        }
                    })
                    return (combinations.filter((d, i) => !filterIndices.includes(i)))
                }
                ,
            }
        )

        function

        createSets(goTerms) {
            const elems = createElements(goTerms);
            return extractSets(elems).sort((a, b) => {
                if (a.elems.length > b.elems.length) {
                    return 1
                } else return -1
            });
        }

        function

        createElements(goTerms) {
            return (goTerms.map(goTerm => {
                return {
                    name: goTerm, sets: dataStore.conditions
                        .filter((cond, i) => dataStore.dataTable[goTerm].pvalues[i] > -Math.log10(dataStore.rootStore.sigThreshold))
                }
            }));
        }
    }
}