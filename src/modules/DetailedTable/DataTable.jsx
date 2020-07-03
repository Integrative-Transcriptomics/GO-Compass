import React, {useCallback, useState} from 'react';
import PropTypes from "prop-types";
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

function Row(props) {
    const mainRow = props.keys.map(key => {
        let align = "right";
        if (key === "termID") {
            align = "left";
        }
        let visualize = props.visualize && props.conditions.includes(key);
        return <Cell key={key} color="black" align={align} value={props.mapper[props.goTerm][key]} scale={props.scale}
                     visualize={visualize} isTerm={key === "termID"}
                     significant={props.conditions.includes(key) && props.mapper[props.goTerm][key] > -Math.log10(props.sigThreshold)}/>;
    });
    let subRows = null;
    if ((props.open) && props.subTerms.length > 0) {
        subRows = props.subTerms.map((subTerm) => (
            <TableRow hover key={subTerm}>
                <TableCell/>
                {props.keys.map(key => {
                    const visualize = props.visualize && props.conditions.includes(key);
                    return <Cell key={key} color="gray" align="right" value={props.mapper[subTerm][key]}
                                 scale={props.scale}
                                 visualize={visualize} isTerm={key === "termID"}
                                 significant={props.conditions.includes(key) && props.mapper[props.goTerm][key] > -Math.log10(props.sigThreshold)}/>
                })}
            </TableRow>
        ))
    }
    return (<React.Fragment>
        <TableRow
            onMouseEnter={() => props.setChildHighlight(props.goTerm)}
            onMouseLeave={() => props.setChildHighlight(null)}
            selected={props.childHighlight === props.goTerm}>
            <TableCell>
                {props.subTerms.length > 0 ?
                    <IconButton aria-label="expand row" size="small" onClick={() => props.setOpen()}>
                        {props.open ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
                    </IconButton> : null}
            </TableCell>
            {mainRow}
        </TableRow>
        {subRows}
    </React.Fragment>)
}

function DataTable(props) {
    const [globalOpen, setGlobalOpen] = useState('closed');
    const [isOpen, setIsOpen] = useState(Object.keys(props.data.hierarchy).map(d => {
        return ({goTerm: d, open: false})
    }));
    const [order, setOrder] = useState(Object.keys(props.data.hierarchy));
    const [sortKey, setSortKey] = useState(null);
    const [sortDir, setSortDir] = useState('desc');
    const [visualize, setVisualize] = useState(false);
    const classes = useStyles();
    const mapper = {};
    Object.keys(props.data.tableData).forEach(goTerm => {
        mapper[goTerm] = {};
        Object.keys(props.data.tableData[goTerm]).forEach(key => {
            if (key !== "pvalues") {
                mapper[goTerm][key] = props.data.tableData[goTerm][key];
            } else {
                props.data.conditions.forEach((condition, i) => {
                    mapper[goTerm][condition] = props.data.tableData[goTerm]['pvalues'][i];
                })
            }
        })
    });
    const content = [];
    let header = [];
    let keys = [];
    const toggleGlobalOpen = useCallback(() => {
        setIsOpen(isOpen.map((d, i) => {
            if (globalOpen === "open" || globalOpen === "any") {
                setGlobalOpen("closed");
                return ({goTerm: isOpen[i].goTerm, open: false});
            } else {
                setGlobalOpen("open");
                return ({goTerm: isOpen[i].goTerm, open: true});
            }
        }));
    }, [globalOpen, isOpen]);
    const toggleOpen = useCallback((goTerm) => {
        let open2Copy = isOpen.slice();
        const goTermIndex = open2Copy.map(d => d.goTerm).indexOf(goTerm);
        open2Copy[goTermIndex].open = !open2Copy[goTermIndex].open;
        setIsOpen(open2Copy);
        if (globalOpen !== "any") {
            setGlobalOpen("any");
        }
    }, [globalOpen, isOpen]);
    const sort = useCallback((key) => {
        let elements = Object.keys(props.data.hierarchy);
        let dir = sortKey === key && sortDir === 'desc' ? 1 : -1;
        elements.sort((a, b) => {
            if (mapper[a][key] < mapper[b][key]) {
                return -dir;
            } else if (mapper[a][key] > mapper[b][key]) {
                return dir;
            } else return 0;
        });
        setOrder(elements);
        setSortKey(key);
        setSortDir(sortKey === key && sortDir === 'desc' ? 'asc' : 'desc');
    }, [props.data.hierarchy, sortKey, sortDir, mapper]);
    const max = d3.max(props.data.conditions.map(condition => {
        return d3.max((Object.keys(mapper).map(d => mapper[d][condition])));
    }));
    const scale = (d3.scaleLinear().domain([0, max]).range([0, 60]));
    order.forEach(goTerm => {
        if (header.length === 0) {
            keys = Object.keys(props.data.tableData[goTerm]).filter(d => d !== 'pvalues').concat(props.data.conditions);
            header = keys.map(d => <TableCell key={d} onClick={() => sort(d)} align="right">
                <TableSortLabel
                    active={sortKey === d}
                    direction={sortKey === d ? sortDir : 'asc'}
                    onClick={() => sort(d)}
                >
                    {d}
                </TableSortLabel></TableCell>);
        }
        content.push(<Row key={goTerm} open={isOpen.filter(d => d.goTerm === goTerm)[0].open}
                          setOpen={() => toggleOpen(goTerm)}
                          scale={scale} conditions={props.data.conditions}
                          sigThreshold={props.sigThreshold}
                          visualize={visualize} mapper={mapper} keys={keys} goTerm={goTerm}
                          subTerms={props.data.hierarchy[goTerm]} setChildHighlight={props.setChildHighlight}
                          childHighlight={props.childHighlight}/>);
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
}

DataTable.propTypes = {
    data: PropTypes.object,
};
DataTable.defaultProps = {};
export default DataTable;

