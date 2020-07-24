import React, {useCallback, useState} from 'react';
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
import Button from "@material-ui/core/Button";
import * as d3 from "d3";
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
    if (props.visualize) {
        content = <svg key="content" width={props.scale.range()[1]} height={10}>
            <rect fill={props.color} height={10} width={props.scale(props.value)}/>
            {props.significant ?
                <text y={15} fontSize={20} fill="white">*</text> : <text/>}
        </svg>
    } else {
        content = props.value;
        if (props.significant) {
            content += "*"
        }
    }
    if (props.isTerm) {
        content = [content,
            <IconButton key="icon" onClick={() => window.open("https://www.ebi.ac.uk/QuickGO/term/" + props.value)}><OpenInNewIcon
                fontSize="small"
            /></IconButton>]
    }
    return <TableCell style={{color: props.color}} align={props.align}>{content}</TableCell>;
}
Cell.propTypes = {
    visualize: PropTypes.bool.isRequired,
    scale: PropTypes.func.isRequired,
    color: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    significant: PropTypes.bool.isRequired,
    isTerm: PropTypes.bool.isRequired,
    align: PropTypes.string.isRequired,
};

const Row = inject("visStore", "dataStore")(observer((props) => {
    const mainRow = props.keys.map(key => {
        let align = "right";
        if (key === "termID") {
            align = "left";
        }
        let visualize = props.visualize && props.dataStore.conditions.includes(key);
        return <Cell key={key} color="black" align={align} value={props.mapper[props.goTerm][key]} scale={props.scale}
                     visualize={visualize} isTerm={key === "termID"}
                     significant={props.dataStore.conditions.includes(key)
                     && props.mapper[props.goTerm][key] > -Math.log10(props.visStore.sigThreshold)}/>;
    });
    let subRows = null;
    const subTerms = props.dataStore.filterHierarchy[props.goTerm];
    if ((props.open) && subTerms.length > 0) {
        subRows = subTerms.map((subTerm) => (
            <TableRow hover key={subTerm}>
                <TableCell/>
                {props.keys.map(key => {
                    const visualize = props.visualize && props.dataStore.conditions.includes(key);
                    return <Cell key={key} color="gray" align="right" value={props.mapper[subTerm][key]}
                                 scale={props.scale}
                                 visualize={visualize} isTerm={key === "termID"}
                                 significant={props.dataStore.conditions.includes(key)
                                 && props.mapper[props.goTerm][key] > -Math.log10(props.visStore.sigThreshold)}/>
                })}
            </TableRow>
        ))
    }
    return (<React.Fragment>
        <TableRow
            onMouseEnter={() => props.visStore.setChildHighlight(props.goTerm)}
            onMouseLeave={() => props.visStore.setChildHighlight(null)}
            selected={props.visStore.childHighlight === props.goTerm}>
            <TableCell>
                {subTerms.length > 0 ?
                    <IconButton aria-label="expand row" size="small" onClick={() => props.setOpen()}>
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
    visualize: PropTypes.bool.isRequired,
    goTerm: PropTypes.string.isRequired,
    mapper: PropTypes.objectOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    scale: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    setOpen: PropTypes.func.isRequired
};

const DataTable = inject("dataStore")(observer((props) => {
    const [globalOpen, setGlobalOpen] = useState('closed');
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState('desc');
    const [visualize, setVisualize] = useState(false);
    const classes = useStyles();
    const mapper = {};
    Object.keys(props.dataStore.dataTable).forEach(goTerm => {
        mapper[goTerm] = {};
        Object.keys(props.dataStore.dataTable[goTerm]).forEach(key => {
            if (key !== "pvalues") {
                mapper[goTerm][key] = props.dataStore.dataTable[goTerm][key];
            } else {
                props.dataStore.conditions.forEach((condition, i) => {
                    mapper[goTerm][condition] = props.dataStore.dataTable[goTerm]['pvalues'][i];
                })
            }
        })
    });
    const content = [];
    let header = [];
    let keys = [];
    const toggleGlobalOpen = useCallback(() => {
        props.dataStore.tableStore.setTermOrder(props.dataStore.tableStore.termState.map((d, i) => {
            if (globalOpen === "open" || globalOpen === "any") {
                setGlobalOpen("closed");
                return ({goTerm: props.dataStore.tableStore.termState[i].goTerm, open: false});
            } else {
                setGlobalOpen("open");
                return ({goTerm: props.dataStore.tableStore.termState[i].goTerm, open: true});
            }
        }));
    }, [globalOpen, props.dataStore.tableStore]);
    const toggleOpen = useCallback((goTerm) => {
        let open2Copy = props.dataStore.tableStore.termState.slice();
        const goTermIndex = open2Copy.map(d => d.goTerm).indexOf(goTerm);
        open2Copy[goTermIndex].open = !open2Copy[goTermIndex].open;
        props.dataStore.tableStore.setTermOrder(open2Copy);
        if (globalOpen !== "any") {
            setGlobalOpen("any");
        }
    }, [globalOpen, props.dataStore.tableStore]);
    const sort = useCallback((key) => {
        let elements = props.dataStore.tableStore.termState.slice();
        let dir = sortKey === key && sortDir === 'desc' ? 1 : -1;
        elements.sort((a, b) => {
            if (mapper[a.goTerm][key] < mapper[b.goTerm][key]) {
                return -dir;
            } else if (mapper[a.goTerm][key] > mapper[b.goTerm][key]) {
                return dir;
            } else return 0;
        });
        props.dataStore.tableStore.setTermOrder(elements);
        setSortKey(key);
        setSortDir(sortKey === key && sortDir === 'desc' ? 'asc' : 'desc');
    }, [props.dataStore.tableStore, sortKey, sortDir, mapper]);
    const max = d3.max(props.dataStore.conditions.map(condition => {
        return d3.max((Object.keys(mapper).map(d => mapper[d][condition])));
    }));
    const scale = (d3.scaleLinear().domain([0, max]).range([0, 60]));
    props.dataStore.tableStore.termState.map(d=>d.goTerm).forEach(goTerm => {
        if (header.length === 0) {
            keys = Object.keys(props.dataStore.dataTable[goTerm]).filter(d => d !== 'pvalues').concat(props.dataStore.conditions);
            header = keys.map(d => <TableCell key={d} onClick={() => sort(d)} align="right">
                <TableSortLabel
                    active={sortKey === d}
                    direction={sortKey === d ? sortDir : 'asc'}
                    onClick={() => sort(d)}
                >
                    {d}
                </TableSortLabel></TableCell>);
        }
        content.push(<Row key={goTerm} open={props.dataStore.tableStore.termState.filter(d => d.goTerm === goTerm)[0].open}
                          setOpen={() => toggleOpen(goTerm)} scale={scale} visualize={visualize} mapper={mapper}
                          keys={keys} goTerm={goTerm}/>);
    });
    return (
        <Paper className={classes.root}>
            <Button onClick={() => setVisualize(!visualize)}>Visualize Numbers</Button>
            <TableContainer className={classes.container}>
                <Table size="small" aria-label="a dense table" className={classes.table} stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell><IconButton aria-label="expand row" size="small"
                                                   onClick={() => toggleGlobalOpen()}>
                                {globalOpen === "open" ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
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
export default DataTable;

