import React from 'react';
import 'mobx-react-lite/batchingForReactDom'
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import PropTypes from "prop-types";

import {
    FormControl,
    IconButton,
    InputLabel, List,
    ListItem,
    MenuItem,
    Select,
    TextField,
    Typography
} from "@material-ui/core";
import Paper from "@material-ui/core/Paper";


const SpecifyBackgrounds = (props) => {
    return (<Paper>
        <Typography>Link gene lists and backgrounds</Typography>
        <List>
            {props.conditions.map((d, i) => <ListItem key={d.index}>
                <IconButton onClick={() => {
                    const conditionsCopy = props.conditions.slice();
                    if (i > 0) {
                        const save = conditionsCopy[i - 1];
                        conditionsCopy[i - 1] = conditionsCopy[i];
                        conditionsCopy[i] = save;
                    } else {
                        const save = conditionsCopy[0];
                        conditionsCopy[0] = conditionsCopy[props.conditions.length - 1];
                        conditionsCopy[props.conditions.length - 1] = save;
                    }
                    props.setConditions(conditionsCopy);
                }}>
                    <KeyboardArrowUpIcon fontSize="small"/>
                </IconButton>
                <IconButton onClick={() => {
                    const conditionsCopy = props.conditions.slice();
                    if (i < conditionsCopy.length - 1) {
                        const save = conditionsCopy[i + 1];
                        conditionsCopy[i + 1] = conditionsCopy[i];
                        conditionsCopy[i] = save;
                    } else {
                        const save = conditionsCopy[0];
                        conditionsCopy[0] = conditionsCopy[i];
                        conditionsCopy[i] = save;
                    }
                    props.setConditions(conditionsCopy);
                }}>
                    <KeyboardArrowDownIcon fontSize="small"/>
                </IconButton>
                <TextField required
                           label={props.geneFiles[d.index].name}
                           disabled={props.isLoading}
                           onChange={(e) => {
                               let conditionsCopy = props.conditions.slice();
                               conditionsCopy[i].condition = e.target.value;
                               props.setConditions(conditionsCopy);
                           }}
                           value={d.condition}/>
                <FormControl>
                    <InputLabel>Background</InputLabel>
                    <Select
                        value={d.background}
                        disabled={props.isLoading}
                        onChange={(e) => {
                            let conditionsCopy = props.conditions.slice();
                            conditionsCopy[i].background = e.target.value;
                            props.setConditions(conditionsCopy);
                        }}
                    >
                        {[...props.multiBackground].map(file => <MenuItem key={file.name}
                                                                          value={file.name}>{file.name}</MenuItem>)}
                    </Select>
                </FormControl>
            </ListItem>)}</List></Paper>);
};
SpecifyBackgrounds.propTypes = {
    conditions: PropTypes.arrayOf(PropTypes.object).isRequired,
    setConditions: PropTypes.func.isRequired,
    geneFiles: PropTypes.any.isRequired,
    isLoading: PropTypes.bool.isRequired,
    multiBackground: PropTypes.any.isRequired,
};

export default SpecifyBackgrounds;
