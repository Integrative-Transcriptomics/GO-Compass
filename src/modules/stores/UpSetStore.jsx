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
                /**
                 * Fix for UpSet.jsx's local (non-MobX) highlighted state not staying in sync when Trrack's undo/redo restores selectionLocked/selectedConditions from 
                 * provenance.
                 * This MobX-observed getter gets called automatically on change. The previous approach relied on a manual setter call that wasn't always applied. 
                 * properly when restoring data. There may be more elegant solutions than this, but it ultimately works.
                 * Practical effect: The vertical bars inside our Upset plot now get proper yellow highlighting when the user presses redo.
                 * 
                 * Returns ISet or ISetCombination TypeScript object for the currently locked condition selection, or null if nothing is locked.
                 * @returns {ISet|ISetCombination|null}
                 */
                get lockedSelection() {
                    // If the user hasn't locked a GO-TERM, meaning the user hasn't made a selection (yet), we have nothing to highlight
                    if (!this.visStore.selectionLocked) {
                        return null;
                    }
                    // selectionLocked shouldn't ever be true with an empty selection, but maybe there's a case I'm overlooking, so we'll catch it just in case
                    if (this.visStore.selectedConditions.length === 0) {
                        return null;
                    }

                    // visStore only tracks condition INDICES. We translate them to condition names so they can be compared against upSetSets/upSetCombinations below
                    // [sorted so the order the conditions were locked in doesn't actually affect the comparison]
                    const lockedConditionNames = [];
                    this.visStore.selectedConditions.forEach(conditionIndex => {
                        lockedConditionNames.push(this.dataStore.conditions[conditionIndex]);
                    });

                    // Sort the lockedConditionNames array so we can later compare our arrays position-by-position
                    lockedConditionNames.sort();

                    // A single locked condition should map to one plain set
                    // Multiple locked conditions together should map to a combination of sets/an intersection of sets
                    if (lockedConditionNames.length === 1) {
                        for (const set of this.upSetSets) {
                            if (set.name === lockedConditionNames[0]) { 
                                return set; 
                            }
                        }
                        return null; // if no matching set is found. This shouldn't normally happen, but who knows?
                    }

                    // Find the correct combination with a set of conditions that matches the locked selection
                    for (const combination of this.upSetCombinations) {
                        // Collect this combination's own condition names, sorted in the same way as lockedConditionNames so the two lists line up correctly for position-by-position comparison
                        const conditionNamesOfEachSetWithinThisCombination = []; // Yes, very long name. But it DIRECTLY tells you what it stores! Isn't that EXPLICIT?
                        combination.sets.forEach(set => {
                            conditionNamesOfEachSetWithinThisCombination.push(set.name);
                        });

                        // Now sort our very explicitly named array so we can finally compare our arrays position-by-position
                        conditionNamesOfEachSetWithinThisCombination.sort();

                        // Check whether the two arrays contain exactly the same set of names ["is this partciular UpSet combination the exact same group of conditions the user has locked?"]
                        let conditionNamesAreEqual = lockedConditionNames.length === conditionNamesOfEachSetWithinThisCombination.length;
                        if (conditionNamesAreEqual) {
                            for (let index = 0; index < lockedConditionNames.length; index++) {
                                if (lockedConditionNames[index] !== conditionNamesOfEachSetWithinThisCombination[index]) {
                                    conditionNamesAreEqual = false;
                                    break
                                }
                            }
                        }

                        if (conditionNamesAreEqual) {
                            return combination;
                        }
                    }
                    return null; // if no matching combination is found. Shouldn't normally happen, but again: who knows?
                }
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