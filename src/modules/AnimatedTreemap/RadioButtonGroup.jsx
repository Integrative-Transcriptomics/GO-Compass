import React from 'react';
import PropTypes from 'prop-types';
import FormLabel from "@material-ui/core/FormLabel";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Radio from "@material-ui/core/Radio";
import FormControl from "@material-ui/core/FormControl";

function RadioButtonGroup(props) {
    return (
        <FormControl component="fieldset">
            <FormLabel component="legend">Condition</FormLabel>
            <RadioGroup aria-label="condition" name="condition" value={props.index.toString()}
                        onChange={(event) => props.setIndex(Number(event.target.value))}>
                {props.keys.map((key, i) => {
                    return <FormControlLabel key={key} value={i.toString()} control={<Radio/>} label={key}/>
                })}
            </RadioGroup>
        </FormControl>
    );
}

RadioButtonGroup.propTypes = {
    keys: PropTypes.arrayOf(PropTypes.string).isRequired,
    index: PropTypes.number.isRequired,
    setIndex: PropTypes.func.isRequired
};
export default RadioButtonGroup;
