import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl, FormLabel,
    Radio,
    RadioGroup, Switch
} from "@material-ui/core";
import FormGroup from "@material-ui/core/FormGroup";
import React from "react";
import PropTypes from "prop-types";

const SettingsModal = (props) => {
    return (<Dialog open={props.open} onClose={props.close}>
        <DialogTitle>Treemap Settings</DialogTitle>
        <DialogContent>
            <FormGroup>
                <FormControlLabel
                    control={<Checkbox checked={props.showGenes} onChange={() => props.setShowGenes(!props.showGenes)}
                                       name="checkedA"/>}
                    label="Show gene visualization glyph"
                />
                <FormControlLabel
                    control={<Checkbox checked={props.showNumbers}
                                       onChange={() => props.setShowNumbers(!props.showNumbers)}
                                       name="checkedA"/>}
                    label={props.geneSetText}
                />
                <FormControlLabel
                    control={<Switch checked={props.isTimeseries}
                                     onChange={() => props.setIsTimeseries(!props.isTimeseries)}
                                     name="checkedA"/>}
                    label="Time Series Data"
                />
                {props.hasFCs ? <FormControl component="fieldset">
                    <FormLabel component="legend"> Color Encoding for present genes in glyph
                    </FormLabel>
                    <RadioGroup aria-label="position" name="position" value={props.glyphEncoding}
                                onChange={(e) => props.setGlyphEncoding(e.target.value)}>
                        <FormControlLabel
                            value="updown"
                            control={<Radio color="primary"/>}
                            label="Up/Down"
                            labelPlacement="end"
                        />
                        <FormControlLabel
                            value="median"
                            control={<Radio color="primary"/>}
                            label="Median"
                            labelPlacement="end"
                        />
                    </RadioGroup>
                </FormControl> : null}
            </FormGroup>
        </DialogContent>
        <DialogActions>
            <Button onClick={props.close} color="primary">
                Close
            </Button>
        </DialogActions>
    </Dialog>)
}
export default SettingsModal;
SettingsModal.propTypes = {
    showGenes: PropTypes.bool.isRequired,
    setShowGenes: PropTypes.func.isRequired,
    showNumbers: PropTypes.bool.isRequired,
    setShowNumbers: PropTypes.func.isRequired,
    geneSetText: PropTypes.string.isRequired,
    glyphEncoding: PropTypes.string.isRequired,
    setGlyphEncoding: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    close: PropTypes.func.isRequired,
    hasFCs: PropTypes.bool.isRequired,
    isTimeseries:PropTypes.bool.isRequired,
    setIsTimeseries: PropTypes.func.isRequired,
};