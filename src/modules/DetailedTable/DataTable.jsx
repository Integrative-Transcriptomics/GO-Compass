import React from 'react';
import PropTypes from "prop-types";
import TableContainer from "@material-ui/core/TableContainer";
import Paper from "@material-ui/core/Paper";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import Typography from "@material-ui/core/Typography";
import IconButton from "@material-ui/core/IconButton";
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import { withStyles, Theme, createStyles, makeStyles } from '@material-ui/core/styles';


const StyledTableCell = withStyles((theme: Theme) =>
    createStyles({
        head: {
            backgroundColor: theme.palette.common.black,
            color: theme.palette.common.white,
            fontSize: 12,
        },
        body: {
            fontSize: 10,
        },
    }),
)(TableCell);
const useStyles = makeStyles({
    table: {
        fontSize: 12,
        minWidth: 650,
    },
});
function Row(props) {

    const [open, setOpen] = React.useState(false);
    return (<React.Fragment>
        <TableRow onClick={() => setOpen(!open)}
                  onMouseEnter={() => props.setChildHighlight(props.mapper[props.goTerm].description)}
                  onMouseLeave={() => props.setChildHighlight(null)}
                    selected={props.childHighlight === props.mapper[props.goTerm].description}>
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
                    return <TableCell key={key} align={align}>
                            {props.mapper[props.goTerm][key]}
                    </TableCell>
                }
            )}
        </TableRow>
        {open && props.subTerms.length > 0 ? props.subTerms.map((subTerm) => (
            <TableRow hover key={subTerm}>
                <TableCell/>
                {props.keys.map(key =>
                    <TableCell style={{color: "gray"}} key={key} align="right">
                        {props.mapper[subTerm][key]}
                    </TableCell>)}
            </TableRow>
        )) : null}
    </React.Fragment>)
}

function DataTable(props) {
    const classes = useStyles();
    const mapper = {};
    Object.keys(props.data.tableData).forEach(goTerm => {
        mapper[goTerm] = {};
        Object.keys(props.data.tableData[goTerm]).forEach(key => {
            if (key !== "pvalues") {
                mapper[goTerm][key] = props.data.tableData[goTerm][key];
            } else {
                props.data.keys.forEach((condition, i) => {
                    mapper[goTerm][condition] = props.data.tableData[goTerm]['pvalues'][i];
                })
            }
        })
    });
    const content2 = [];
    let header2 = [];
    let keys = [];
    Object.keys(props.data.hierarchy).forEach(goTerm => {
        if (header2.length === 0) {
            keys = Object.keys(props.data.tableData[goTerm]).filter(d => d !== 'pvalues').concat(props.data.keys);
            header2 = keys.map(d => <TableCell key={d} align="right">{d}</TableCell>);
        }
        content2.push(<Row key={goTerm} mapper={mapper} keys={keys} goTerm={goTerm}
                           subTerms={props.data.hierarchy[goTerm]} setChildHighlight={props.setChildHighlight} childHighlight={props.childHighlight}/>);
    });
    return (
        <TableContainer component={Paper}>
            <Table size="small" aria-label="a dense table" className={classes.table} stickyHeader>
                <TableHead>
                    <TableRow>
                        <TableCell/>
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

