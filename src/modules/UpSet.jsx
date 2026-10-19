import {inject, observer} from "mobx-react";
import React, {useCallback, useEffect, useState} from "react";
import UpSetJS, {VennDiagram} from '@upsetjs/react';


const UpSet = inject("upSetStore", "dataStore", "visStore")(observer((props) => {
    const [localSelection, setLocalSelection] = useState(null)
    useEffect(()=>{
        if(props.visStore.selectedConditions.length===0){
            setLocalSelection(null)
        }
    },[props.visStore.selectedConditions.length])
    const select = useCallback((selection) => {
        if (selection === null) {
            props.visStore.selectConditions([])
            props.visStore.setChildHighlights([])
        } else {
            if (selection.type === "distinctIntersection" || selection.type === "intersection") {
                props.visStore.selectConditions([...selection.sets].map(d => props.dataStore.conditions.indexOf(d.name)))
            } else if (selection.type === "set") {
                props.visStore.selectConditions([props.dataStore.conditions.indexOf(selection.name)])
            }
            if (!props.visStore.selectionLocked) {
                setLocalSelection(selection);
            }
            props.visStore.setChildHighlights(selection.elems.map(d => d.name));
        }
    }, [props.dataStore, props.visStore]);
    const handleClick = useCallback((selection) => {
        if (selection !== null) {
            if (selection.type === "distinctIntersection" || selection.type === "intersection") {
                props.visStore.setLockedSelection([...selection.sets].map(d => props.dataStore.conditions.indexOf(d.name)))
            } else if (selection.type === "set") {
                props.visStore.setLockedSelection([props.dataStore.conditions.indexOf(selection.name)])
            }

            // The if below might not be needed anymore. Will remove if no bugs occur during prolonged use
            if (props.visStore.selectionLocked) {
                setLocalSelection(selection)
            }
        }
    }, [props.dataStore.conditions, props.visStore]);
    let plot;
    if (props.upSetStore.upSetSets.length > 3) {
        plot = <UpSetJS sets={props.upSetStore.upSetSets} combinations={props.upSetStore.upSetCombinations}
                        width={props.width} height={props.height}

                        // Old variant: selection={localSelection}
                        // Show the tracked condition selection once locked [undo/redo-safe]. Otherwise, show the live hover preview
                        selection={props.visStore.selectionLocked ? props.upSetStore.lockedSelection : localSelection}
                        onHover={select}
                        onClick={handleClick}/>;
    } else {
        plot = <VennDiagram sets={props.upSetStore.upSetSets} width={props.width} height={props.height}

                            // Old variant: selection={localSelection}
                            // Show the tracked condition selection once locked [undo/redo-safe]. Otherwise, show the live hover preview
                            selection={props.visStore.selectionLocked ? props.upSetStore.lockedSelection : localSelection}
                            onHover={select}
                            onClick={handleClick}/>;
    }
    return (<div id={props.id}>
        {plot}
    </div>)
}));
export default UpSet