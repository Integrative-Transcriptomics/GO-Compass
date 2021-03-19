import {extendObservable} from "mobx";
import {extractSets, generateCombinations} from "@upsetjs/react";

/**
 * Store for UpSet plot
 */
export class UpSetStore {
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
                /**
                 * upSet sets
                 * @returns {ISet<{sets: string[]}>[]}
                 */
                get upSetSets() {
                    return createSets(dataStore.currentGOterms)
                },
                /**
                 * upSet combinations
                 * @returns {ISetCombination<any>[]}
                 */
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
                },
            }
        )

        /**
         * crrates sets of goTerms
         * @param {[string]} goTerms
         * @returns {ISet<{sets: string[]}>[]}
         */
        function createSets(goTerms) {
            const elems = createElements(goTerms);
            return extractSets(elems).sort((a, b) => {
                if (a.elems.length > b.elems.length) {
                    return 1
                } else return -1
            });
        }

        /**
         * creates set elements
         * @param {string} goTerms
         * @returns {[Object]}
         */
        function createElements(goTerms) {
            return (goTerms.map(goTerm => {
                return {
                    name: goTerm, sets: dataStore.conditions
                        .filter((cond, i) => dataStore.dataTable[goTerm].pvalues[i] > dataStore.rootStore.logSigThreshold)
                }
            }));
        }
    }
}