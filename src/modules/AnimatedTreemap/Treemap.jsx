import {inject, observer} from "mobx-react";
import AnimatedTreemap from "./AnimatedTreemap";
import React, {createRef, useEffect, useState} from "react";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import SmallMultiples from "./SmallMultiples";
import MobileStepper from "@material-ui/core/MobileStepper";
import Button from "@material-ui/core/Button";
import {KeyboardArrowLeft, KeyboardArrowRight} from "@material-ui/icons";
import FormGroup from "@material-ui/core/FormGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import NestedDrawer from "./NestedDrawer";

const Treemap = inject("dataStore", "visStore")(observer((props) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showGenes, setShowGenes] = useState(props.dataStore.rootStore.hasGeneInfo)
    const [showNumbers, setShowNumbers] = useState(false);
    const scalingFactor = 0.25;
    const controlsRef = createRef();
    useEffect(() => {
        if (controlsRef.current != null) {
            props.visStore.setTreemapWidth(controlsRef.current.getBoundingClientRect().width)
            props.visStore.setTreemapHeight(props.height - controlsRef.current.getBoundingClientRect().height)
        }
    }, [controlsRef, props.height, props.visStore]);
    return (<React.Fragment key={"anchor"}>
        <div ref={controlsRef}>
            {/* eslint-disable-next-line react/jsx-no-undef */}
            <MobileStepper
                steps={props.dataStore.conditions.length}
                position="static"
                variant="text"
                activeStep={props.visStore.conditionIndex}
                nextButton={
                    <div>
                        <Button size="small"
                                onClick={() => props.visStore.setConditionIndex(props.visStore.conditionIndex + 1)}
                                disabled={props.visStore.conditionIndex === props.dataStore.conditions.length - 1}>
                            Next
                            <KeyboardArrowRight/>
                        </Button>
                        <IconButton onClick={() => setIsOpen(!isOpen)}>
                            <MenuIcon/>
                        </IconButton>
                    </div>
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
                    control={<Checkbox checked={showGenes} onChange={() => setShowGenes(!showGenes)} name="checkedA"/>}
                    label="Show gene visualization"
                />
                <FormControlLabel
                    control={<Checkbox checked={showNumbers} onChange={() => setShowNumbers(!showNumbers)}
                                       name="checkedA"/>}
                    label="Show gene set numbers"
                />
            </FormGroup> : null}
        </div>
        <div onClick={() => setIsOpen(false)}>
            <NestedDrawer direction={"left"} open={isOpen}>
                <div style={{
                    right: "0",
                    borderLeft: "1px solid lightgray",
                    height: props.visStore.treemapHeight, width: props.visStore.treemapWidth * scalingFactor + 10,
                    overflowY: "scroll", position: "absolute", backgroundColor: "rgba(255, 255, 255, 0.9)"
                }}>
                    <SmallMultiples logSigThreshold={props.logSigThreshold}
                                    scalingFactor={scalingFactor}/>
                </div>
            </NestedDrawer>
            <AnimatedTreemap logSigThreshold={props.logSigThreshold}
                             showGenes={showGenes}
                             showNumbers={showNumbers}/>
        </div>
    </React.Fragment>)
}))
export default Treemap;
