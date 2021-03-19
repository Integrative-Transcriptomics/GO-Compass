import {inject, observer} from "mobx-react";
import React, {useCallback, useState} from "react";
import UpSetJS, {VennDiagram} from '@upsetjs/react';


const UpSet = inject("upSetStore", "visStore")(observer((props) => {
    const [localSelection, setLocalSelection] = useState(null)

    const select = useCallback((selection) => {
        if (selection === null) {
            setLocalSelection(null);
            props.visStore.setChildHighlights([])
        } else {
            setLocalSelection(selection);
            props.visStore.setChildHighlights(selection.elems.map(d => d.name));
        }
    }, [props.visStore]);
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