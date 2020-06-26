import React from 'react';
import {createStyles} from "@material-ui/core";
import {makeStyles} from "@material-ui/core/styles";
import Grid from "@material-ui/core/Grid";
import Button from "@material-ui/core/Button";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";


function SelectData(props) {
    const useStyles = makeStyles((theme: Theme) =>
        createStyles({
            root: {
                flexGrow: 1,
            },
            menuButton: {
                marginRight: theme.spacing(2),
            },
            title: {
                flexGrow: 1,
            },
        }),
    );


    const classes = useStyles();
    return (
        <Grid container className={classes.root}>
            <Grid item xs={12}>
                <Grid container justify="center">
                    <Grid item>
                        <List>
                            <ListItem>
                                <Button className={classes.menuButton}
                                        variant="contained"
                                        component="label"
                                >
                                    Select File
                                    <input
                                        type="file"
                                        style={{display: "none"}}
                                        accept='.tsv'
                                        onChange={(event) => props.setFile(event.target.files[0])}
                                    />
                                </Button>
                            </ListItem>
                            <ListItem>
                                <FormControl className={classes.formControl}>
                                    <InputLabel>Ontology</InputLabel>
                                    <Select
                                        value={props.ontology}
                                        onChange={(e) => props.setOntology(e.target.value)}
                                    >
                                        <MenuItem value="BP">Biological Process</MenuItem>
                                        <MenuItem value="MF">Molecular Function</MenuItem>
                                        <MenuItem value="CC">Cellular Component</MenuItem>
                                    </Select>
                                </FormControl>
                            </ListItem>
                            <ListItem>
                                <FormControl className={classes.formControl}>
                                    <InputLabel>Result size</InputLabel>
                                    <Select
                                        value={props.cutoff}
                                        onChange={(e) => props.setCutoff(e.target.value)}
                                    >
                                        <MenuItem value={0.9}>Large (0.9)</MenuItem>
                                        <MenuItem value={0.7}>Medium (0.7)</MenuItem>
                                        <MenuItem value={0.5}>Small (0.5)</MenuItem>
                                        <MenuItem value={0.4}>Tiny (0.4)</MenuItem>
                                    </Select>
                                </FormControl>
                            </ListItem>
                            <ListItem>
                                <Button className={classes.menuButton}
                                        variant="contained"
                                        component="label"
                                        onClick={props.launch}
                                >
                                    Go!
                                </Button>
                            </ListItem>
                        </List>
                    </Grid>
                </Grid>

            </Grid>
        </Grid>
    );
}

export default SelectData;
