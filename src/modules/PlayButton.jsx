import React from 'react';
import Button from "@material-ui/core/Button";
import PlayCircleOutlineIcon from '@material-ui/icons/PlayCircleOutline';


function PlayButton(props) {
    const timeout = (index) => {
        if (index < props.keys.length) {
            let waitTime = props.duration + 200;
            setTimeout(() => {
                props.setIndex(index);
                index++;
                timeout(index);
            }, waitTime)
        }
    };
    const passConditions = () => {
        props.setIndex(0);
        timeout(1);
    };
    return (
        <Button onClick={passConditions}>Play <PlayCircleOutlineIcon color="primary"/></Button>
    );
}
export default PlayButton;
