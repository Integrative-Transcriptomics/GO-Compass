import {inject, observer} from "mobx-react";
import React from "react";
import UpSetJS, {extractSets, generateCombinations, VennDiagram} from '@upsetjs/react';


const UpSet = inject("dataStore", "visStore")(observer((props) => {
    const elems = props.dataStore.currentGOterms.map(goTerm => {
        return {
            name: goTerm, sets: props.dataStore.conditions
                .filter((cond, i) => props.dataStore.dataTable[goTerm].pvalues[i] > -Math.log10(props.sigThreshold))
        }
    })
    const sets = extractSets(elems).sort((a, b) => {
        if (a.elems > b.elems) {
            return 1
        } else return -1
    });
    const combinations = generateCombinations(sets).sort((a, b) => {
        if (a.elems.length > b.elems.length) {
            return -1
        } else return 1
    });
    const select = function (selection){
        if(selection === null){
            props.visStore.setChildHighlights([])
        } else{
            props.visStore.setChildHighlights(selection.elems.map(d => d.name));
        }
    }
    if (sets.length > 3) {
        return <UpSetJS sets={sets} combinations={combinations} width={props.width} height={props.height}
                        selection={props.visStore.childHighlights}
                            onHover={select}/>;
    } else {
        return <VennDiagram sets={sets} width={props.width} height={props.height}
                            selection={props.visStore.childHighlights}
                            onHover={select}/>;
    }
}));
export default UpSet