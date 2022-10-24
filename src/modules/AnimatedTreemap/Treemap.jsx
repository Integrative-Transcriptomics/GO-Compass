import {inject, observer} from "mobx-react";
import AnimatedTreemap from "./AnimatedTreemap";
import React, {createRef, useEffect, useState} from "react";
import SmallMultiples from "./SmallMultiples";
import MobileStepper from "@material-ui/core/MobileStepper";
import Button from "@material-ui/core/Button";
import {KeyboardArrowLeft, KeyboardArrowRight} from "@material-ui/icons";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";

const Treemap = inject("dataStore", "visStore")(observer((props) => {
    const [showGenes, setShowGenes] = useState(props.dataStore.rootStore.hasGeneInfo)
    const [showNumbers, setShowNumbers] = useState(false);
    const [adaptedScalingFactor, setAdaptedScalingFactor] = useState(0.25)
    const scalingFactor = 0.25;
    const controlsRef = createRef();

    useEffect(() => {
        const mainWidth = 0.75 * props.width;
        props.visStore.setTreemapWidth(mainWidth)
        const ts = scalingFactor / (1 - scalingFactor);
        const sideWidth = mainWidth * ts - 10
        setAdaptedScalingFactor(sideWidth / mainWidth)
    }, [props.visStore, props.width]);
    useEffect(() => {
        if (controlsRef.current !== null) {
            props.visStore.setTreemapHeight(props.height - controlsRef.current.getBoundingClientRect().height)
        }
    }, [controlsRef, props.height, props.visStore])
    return (<React.Fragment key={"anchor"}>
        <div style={{width: "75%", float: "left"}}>
            <div ref={controlsRef}>
                {/* eslint-disable-next-line react/jsx-no-undef */}
                <MobileStepper
                    steps={props.dataStore.conditions.length}
                    position="static"
                    variant="text"
                    activeStep={props.visStore.conditionIndex}
                    nextButton={
                        <Button size="small"
                                onClick={() => props.visStore.setConditionIndex(props.visStore.conditionIndex + 1)}
                                disabled={props.visStore.conditionIndex === props.dataStore.conditions.length - 1}>
                            Next
                            <KeyboardArrowRight/>
                        </Button>
                    }
                    backButton={
                        <Button size="small"
                                onClick={() => props.visStore.setConditionIndex(props.visStore.conditionIndex - 1)}
                                disabled={props.visStore.conditionIndex === 0}>
                            <KeyboardArrowLeft/>
                            Back
                        </Button>
                    }
                />
                {props.dataStore.rootStore.hasGeneInfo ? <FormGroup row>
                    <FormControlLabel
                        control={<Checkbox checked={showGenes} onChange={() => setShowGenes(!showGenes)}
                                           name="checkedA"/>}
                        label="Show gene visualization"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={showNumbers} onChange={() => setShowNumbers(!showNumbers)}
                                           name="checkedA"/>}
                        label="Show gene set numbers"
                    />
                </FormGroup> : null}
            </div>
            <AnimatedTreemap logSigThreshold={props.logSigThreshold}
                             showGenes={showGenes}
                             showNumbers={showNumbers}/>
        </div>
        <div style={{
            right: "0",
            float: "right",
            height: props.height, width: "25%",
            overflowY: "scroll"
        }}>
            <SmallMultiples logSigThreshold={props.logSigThreshold}
                            scalingFactor={adaptedScalingFactor}/>
        </div>
    </React.Fragment>)
}))
export default Treemap;
