import {inject, observer} from "mobx-react";
import AnimatedTreemap from "./AnimatedTreemap";
import React, {createRef, useEffect, useMemo, useState} from "react";
import SmallMultiples from "./SmallMultiples";
import MobileStepper from "@material-ui/core/MobileStepper";
import Button from "@material-ui/core/Button";
import {KeyboardArrowLeft, KeyboardArrowRight} from "@material-ui/icons";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import {ButtonGroup, FormControl, IconButton, Radio, RadioGroup} from "@material-ui/core";
import {set} from "mobx";
import SettingsIcon from '@material-ui/icons/Settings';
import SettingsModal from "./SettingsModal";

const Treemap = inject("dataStore", "visStore")(observer((props) => {
    const [showGenes, setShowGenes] = useState(true);
    const [showNumbers, setShowNumbers] = useState(false);
    const [adaptedScalingFactor, setAdaptedScalingFactor] = useState(0.25);
    const [glyphEncoding, setGlyphEncoding] = useState("updown");
    const [open, setOpen] = React.useState(false);
    const [isTimeseries, setIsTimeseries] = useState(false);
    const scalingFactor = 0.25;
    const controlsRef = createRef();
    let geneSetText = useMemo(() => {
        let text = "Show gene set numbers"
        if (props.dataStore.rootStore.hasFCs) {
            text = text + " (Set size, #upregulated:#downregulated)"
        } else if (props.dataStore.rootStore.hasGeneInfo) {
            text = text + " (Set size, #expressed)"
        } else {
            text = text + (" (Set size)")
        }
        return (text);
    }, [props.dataStore.rootStore.hasFCs, props.dataStore.rootStore.hasGeneInfo])

    useEffect(() => {
        const mainWidth = 0.75 * props.width;
        props.visStore.setTreemapWidth(mainWidth)
        const ts = scalingFactor / (1 - scalingFactor);
        const sideWidth = mainWidth * ts - 10 - props.visStore.scrollBarWidth
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
                            [<ButtonGroup>
                                <IconButton variant="outlined" color="primary" onClick={() => setOpen(true)}>
                                    <SettingsIcon/>
                                </IconButton>
                                <Button size="small"
                                        onClick={() => props.visStore.setConditionIndex(props.visStore.conditionIndex + 1)}
                                        disabled={props.visStore.conditionIndex === props.dataStore.conditions.length - 1}>
                                    Next
                                    <KeyboardArrowRight/>
                                </Button></ButtonGroup>
                            ]
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
                    <SettingsModal showGenes={showGenes} setShowGenes={setShowGenes}
                                   showNumbers={showNumbers}
                                   setShowNumbers={setShowNumbers} geneSetText={geneSetText}
                                   glyphEncoding={glyphEncoding} setGlyphEncoding={setGlyphEncoding}
                                   open={open}
                                   close={() => setOpen(false)}
                                   hasFCs={props.dataStore.rootStore.hasFCs}
                                   isTimeseries={isTimeseries} setIsTimeseries={setIsTimeseries}/>
                </div>
                <AnimatedTreemap logSigThreshold={props.logSigThreshold}
                                 glyphEncoding={glyphEncoding}
                                 showGenes={showGenes}
                                 showNumbers={showNumbers}
                                isTimeseries={isTimeseries}/>
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
        </React.Fragment>
    )
}))
export default Treemap;
