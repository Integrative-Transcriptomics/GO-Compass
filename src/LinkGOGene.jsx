import React from 'react';
import 'mobx-react-lite/batchingForReactDom'
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import PropTypes from "prop-types";

import {
    IconButton, Table, TableBody, TableCell, TableHead, TableRow,
} from "@material-ui/core";
import Paper from "@material-ui/core/Paper";


const LinkGOGene = (props) => {
    return (<Paper><Table size={"small"}>
        <TableHead>
            <TableRow>
                <TableCell>GO List Header</TableCell>
                <TableCell>Gene List File</TableCell>
                <TableCell/>
            </TableRow>
        </TableHead>
        <TableBody>
            {props.goFileColumns.map((column,i) => <TableRow key={column}>
                <TableCell>{column}</TableCell>
                <TableCell>{props.conditions[i].condition}</TableCell>
                <TableCell>
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
                </TableCell>
            </TableRow>)}
        </TableBody>
    </Table></Paper>);
};
LinkGOGene.propTypes = {
    conditions: PropTypes.arrayOf(PropTypes.object).isRequired,
    setConditions: PropTypes.func.isRequired,
    isLoading: PropTypes.bool.isRequired,
    goFileColumns: PropTypes.arrayOf(PropTypes.string).isRequired,
};

export default LinkGOGene;
