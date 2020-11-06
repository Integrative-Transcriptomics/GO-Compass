import {inject, observer} from "mobx-react";
import React, {useCallback, useState} from "react";
import UpSetJS, {extractSets, generateCombinations, VennDiagram} from '@upsetjs/react';


const UpSet = inject("dataStore", "visStore")(observer((props) => {
    const [localSelection, setLocalSelection] = useState(null)
    const elems = props.dataStore.currentGOterms.map(goTerm => {
        return {
            name: goTerm, sets: props.dataStore.conditions
                .filter((cond, i) => props.dataStore.dataTable[goTerm].pvalues[i] > -Math.log10(props.sigThreshold))
        }
    })
    const sets = extractSets(elems).sort((a, b) => {
        if (a.elems.length > b.elems.length) {
            return 1
        } else return -1
    });
    let combinations = generateCombinations(sets).sort((a, b) => {
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
    const filterIndices = []
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
    combinations = combinations.filter((d, i) => !filterIndices.includes(i))
    const select = useCallback((selection) => {
        if (selection === null) {
            setLocalSelection(null)
            props.visStore.setChildHighlights([])
        } else {
            setLocalSelection(selection)
            props.visStore.setChildHighlights(selection.elems.map(d => d.name));
        }
    }, [props.visStore])
    if (sets.length > 3) {
        return <UpSetJS sets={sets} combinations={combinations} width={props.width} height={props.height}
                        selection={localSelection}
                        onHover={select}/>;
    } else {
        return <VennDiagram sets={sets} width={props.width} height={props.height}
                            selection={localSelection}
                            onHover={select}/>;
    }
}));
export default UpSet