import {inject, observer} from "mobx-react";
import React, {useCallback, useState} from "react";
import UpSetJS, {VennDiagram} from '@upsetjs/react';


const UpSet = inject("dataStore", "visStore")(observer((props) => {
    const [localSelection, setLocalSelection] = useState(null)

    const select = useCallback((selection) => {
        if (selection === null) {
            setLocalSelection(null)
            props.visStore.setChildHighlights([])
        } else {
            setLocalSelection(selection)
            props.visStore.setChildHighlights(selection.elems.map(d => d.name));
        }
    }, [props.visStore])
    if (props.visStore.upSetSets.length > 3) {
        return <UpSetJS sets={props.visStore.upSetSets} combinations={props.visStore.upSetCombinations} width={props.width} height={props.height}
                        selection={localSelection}
                        onHover={select}/>;
    } else {
        return <VennDiagram sets={props.visStore.upSetSets} width={props.width} height={props.height}
                            selection={localSelection}
                            onHover={select}/>;
    }
}));
export default UpSet