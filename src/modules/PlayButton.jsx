import React from 'react';
import Button from "@material-ui/core/Button";
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';
import {inject, observer} from "mobx-react";


const PlayButton = inject("dataStore", "visStore")(observer((props) => {
    const timeout = (index) => {
        if (index < props.dataStore.conditions.length) {
            let waitTime = props.visStore.animationDuration + 200;
            setTimeout(() => {
                props.visStore.setConditionIndex(index);
                index++;
                timeout(index);
            }, waitTime)
        }
    };
    const passConditions = () => {
        props.visStore.setConditionIndex(0);
        timeout(0);
    };
    return (
        <Button onClick={passConditions}>Play <PlayCircleOutlineIcon color="primary"/></Button>
    );
}));
export default PlayButton;
