import React from 'react';
import PropTypes from "prop-types";
import TableContainer from "@material-ui/core/TableContainer";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import IconButton from "@material-ui/core/IconButton";
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import {makeStyles} from '@material-ui/core/styles';


const useStyles = makeStyles({
    table: {
        fontSize: 12,
        minWidth: 650,
    },
});

function Row(props) {
    const [open, setOpen] = React.useState(false);
    return (<React.Fragment>
        <TableRow
            onMouseEnter={() => props.setChildHighlight(props.goTerm)}
            onMouseLeave={() => props.setChildHighlight(null)}
            selected={props.childHighlight === props.goTerm}>
            <TableCell>
                {props.subTerms.length > 0 ?
                    <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon/> : <KeyboardArrowDownIcon/>}
                    </IconButton> : null}
            </TableCell>
            {props.keys.map(key => {
                    let align = "right";
                    if (key === "term ID") {
                        align = "left";
                    }
                    return <TableCell key={key} align={align}
                                      onClick={() => window.open("https://www.ebi.ac.uk/QuickGO/term/" + props.goTerm)}>
                        {props.mapper[props.goTerm][key]}
                    </TableCell>
                }
            )}
        </TableRow>
        {(props.open || open) && props.subTerms.length > 0 ? props.subTerms.map((subTerm) => (
            <TableRow hover key={subTerm}>
                <TableCell/>
                {props.keys.map(key =>
                    <TableCell style={{color: "gray"}} key={key} align="right"
                               onClick={() => window.open("https://www.ebi.ac.uk/QuickGO/term/" + subTerm)}>
                        {props.mapper[subTerm][key]}
                    </TableCell>)}
            </TableRow>
        )) : null}
    </React.Fragment>)
}

function DataTable(props) {
    const [open, setOpen] = React.useState(false);
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
    const content2 = [];
    let header2 = [];
    let keys = [];
    let count = 0;
    Object.keys(props.data.hierarchy).forEach(goTerm => {
        count = count + 1 + props.data.hierarchy[goTerm].length;
        if (header2.length === 0) {
            keys = Object.keys(props.data.tableData[goTerm]).filter(d => d !== 'pvalues').concat(props.data.conditions);
            header2 = keys.map(d => <TableCell key={d} align="right">{d}</TableCell>);
        }
        content2.push(<Row key={goTerm} open={open} mapper={mapper} keys={keys} goTerm={goTerm}
                           subTerms={props.data.hierarchy[goTerm]} setChildHighlight={props.setChildHighlight}
                           childHighlight={props.childHighlight}/>);
    });
    return (
        <TableContainer component={Paper}>
            <Table size="small" aria-label="a dense table" className={classes.table} stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell onClick={()=>setOpen(!open)}> (Un)collapse all </TableCell>
                        {header2}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {content2}
                </TableBody>
            </Table>
        </TableContainer>
    );
}

DataTable.propTypes = {
    data: PropTypes.object,
};
DataTable.defaultProps = {};
export default DataTable;
