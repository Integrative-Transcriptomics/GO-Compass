import {inject, observer} from "mobx-react";
import React, {useCallback, useState} from "react";
import UpSetJS, {VennDiagram} from '@upsetjs/react';


const UpSet = inject("upSetStore","dataStore", "visStore")(observer((props) => {
    const [localSelection, setLocalSelection] = useState(null)

    const select = useCallback((selection) => {
        if (selection === null) {
            props.visStore.selectConditions([])
            setLocalSelection(null);
            props.visStore.setChildHighlights([])
        } else {
            if (selection.type === "distinctIntersection" || selection.type === "intersection") {
                props.visStore.selectConditions([...selection.sets].map(d => props.dataStore.conditions.indexOf(d.name)))
            } else if (selection.type === "set") {
                props.visStore.selectConditions([props.dataStore.conditions.indexOf(selection.name)])
            }
            setLocalSelection(selection);
            props.visStore.setChildHighlights(selection.elems.map(d => d.name));
        }
    }, [props.dataStore, props.visStore]);
    if (props.upSetStore.upSetSets.length > 3) {
        return <UpSetJS sets={props.upSetStore.upSetSets} combinations={props.upSetStore.upSetCombinations}
                        width={props.width} height={props.height}
                        selection={localSelection}
                        onHover={select}/>;
    } else {
        return <VennDiagram sets={props.upSetStore.upSetSets} width={props.width} height={props.height}
                            selection={localSelection}
                            onHover={select}/>;
    }
}));
export default UpSet