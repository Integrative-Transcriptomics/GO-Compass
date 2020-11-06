import React from 'react';
import TableContainer from "@material-ui/core/TableContainer";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import IconButton from "@material-ui/core/IconButton";
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import {makeStyles} from '@material-ui/core/styles';
import TableSortLabel from "@material-ui/core/TableSortLabel";

import {inject, observer} from "mobx-react";
import PropTypes from "prop-types";


const useStyles = makeStyles({
    root: {
        width: '100%',
    },
    container: {
        maxHeight: 440,
    },
    table: {
        fontSize: 12,
        minWidth: 650,
    },
});

function Cell(props) {
    let content;
    content = props.value;
    if (props.significant) {
        content += "*"
    }

    if (props.isTerm) {
        content = [content,
            <IconButton key="icon"
                        onClick={() => window.open("https://www.ebi.ac.uk/QuickGO/term/" + props.value)}><OpenInNewIcon
                fontSize="small"
            /></IconButton>]
    }
    return <TableCell style={{color: props.color}} align={props.align}>{content}</TableCell>;
}

Cell.propTypes = {
    color: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    significant: PropTypes.bool.isRequired,
    isTerm: PropTypes.bool.isRequired,
    align: PropTypes.string.isRequired,
};

const Row = inject("visStore", "dataStore", "tableStore")(observer((props) => {
    const mainRow = props.keys.map(key => {
        let align = "right";
        if (key === "termID") {
            align = "left";
        }
        let value = props.tableStore.mapper[props.goTerm][key];
        if(props.dataStore.conditions.includes(key)){
            value = Math.round(value*1000)/1000;
        } else if(typeof value ==="number"){
            value = Math.round(value*100)/100;
        }
        return <Cell key={key} color="black" align={align} value={value}
                     isTerm={key === "termID"}
                     significant={props.dataStore.conditions.includes(key)
                     && props.tableStore.mapper[props.goTerm][key] > -Math.log10(props.sigThreshold)}/>;
    });
    let subRows = null;
    if ((props.open) && props.subTerms.length > 0) {
        subRows = props.subTerms.map((subTerm) => (
            <TableRow hover key={subTerm}>
                <TableCell/>
                {props.keys.map(key => {
                    return <Cell key={key} color="gray" align="right" value={props.tableStore.mapper[subTerm][key]}
                                 isTerm={key === "termID"}
                                 significant={props.dataStore.conditions.includes(key)
                                 && props.tableStore.mapper[props.goTerm][key] > -Math.log10(props.sigThreshold)}/>
                })}
            </TableRow>
        ))
    }
    return (<React.Fragment>
        <TableRow
            onMouseEnter={() => props.visStore.setChildHighlight(props.goTerm)}
            onMouseLeave={() => props.visStore.setChildHighlight(null)}
            selected={props.visStore.childHighlights.includes(props.goTerm)}>
            <TableCell>
                {props.subTerms.length > 0 ?
                    <IconButton aria-label="expand row" size="small"
                                onClick={() => props.tableStore.toggleOpen(props.goTerm)}>
                        {props.open ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
                    </IconButton> : null}
            </TableCell>
            {mainRow}
        </TableRow>
        {subRows}
    </React.Fragment>)
}));
Row.propTypes = {
    keys: PropTypes.arrayOf(PropTypes.string).isRequired,
    goTerm: PropTypes.string.isRequired,
    open: PropTypes.bool.isRequired,
    sigThreshold: PropTypes.number.isRequired,
};

const DataTable = inject("dataStore", "tableStore")(observer((props) => {
    const classes = useStyles();
    const content = [];
    let header = [];
    let keys = [];
    props.tableStore.termState.map(d => d.goTerm).forEach(goTerm => {
        if (header.length === 0) {
            keys = props.dataStore.tableColumns;
            header = keys.map(d => <TableCell key={d} onClick={() => props.tableStore.sort(d.slice())}
                                              align="right">
                <TableSortLabel
                    active={props.tableStore.sortKey === d}
                    direction={props.tableStore.sortKey === d ? props.tableStore.sortDir : 'asc'}
                >
                    {d}
                </TableSortLabel></TableCell>);
        }
        content.push(<Row key={goTerm}
                          open={props.tableStore.termState.filter(d => d.goTerm === goTerm)[0].open}
                          subTerms={props.dataStore.filterHierarchy[goTerm]}
                          sigThreshold={props.sigThreshold}
                          keys={keys} goTerm={goTerm}/>);
    });
    return (
        <Paper className={classes.root}>
            <TableContainer className={classes.container}>
                <Table size="small" aria-label="a dense table" className={classes.table} stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell><IconButton aria-label="expand row" size="small"
                                                   onClick={() => props.tableStore.toggleGlobalOpen()}>
                                {props.tableStore.globalOpen === "open" ? <KeyboardArrowUpIcon/> :
                                    <KeyboardArrowDownIcon/>}
                            </IconButton> </TableCell>
                            {header}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {content}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}));
DataTable.propTypes = {
    sigThreshold: PropTypes.number.isRequired,
};
export default DataTable;

