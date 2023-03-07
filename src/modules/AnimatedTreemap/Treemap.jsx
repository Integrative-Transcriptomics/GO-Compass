import {inject, observer} from "mobx-react";
import AnimatedTreemap from "./AnimatedTreemap";
import React, {createRef, useEffect, useMemo, useState} from "react";
import SmallMultiples from "./SmallMultiples";
import {ButtonGroup} from "@material-ui/core";
import SettingsIcon from '@material-ui/icons/Settings';
import SettingsModal from "./SettingsModal";
import {exportPDF} from "../../UtilityFunctions";
import GetAppIcon from "@material-ui/icons/GetApp";
import ButtonGroupIconButton from "../../ButtonGroupIconButton";
import HelpIcon from "@material-ui/icons/Help";


const Treemap = inject("dataStore", "visStore")(observer((props) => {
    const [showLabels, setShowLabels] = useState(true);
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
            if (glyphEncoding === "updown") {
                text = text + " (Set size, #upregulated:#downregulated)"
            } else {
                text = text + " (Set size, median)"
            }
        } else if (props.dataStore.rootStore.hasGeneInfo) {
            text = text + " (Set size, #expressed)"
        } else {
            text = text + (" (Set size)")
        }
        return (text);
    }, [glyphEncoding, props.dataStore.rootStore.hasFCs, props.dataStore.rootStore.hasGeneInfo])

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
                    <img src={"glyph.png"} alt="Glyph legend" height={100}/>
                    <ButtonGroup>
                            <ButtonGroupIconButton
                                href="https://github.com/Integrative-Transcriptomics/GO-Compass#treemaps"
                                target="_blank"
                                rel="noopener noreferrer"><HelpIcon/></ButtonGroupIconButton>
                            <ButtonGroupIconButton onClick={() => exportPDF(props.id, true)}>
                                <GetAppIcon/>
                            </ButtonGroupIconButton>
                            <ButtonGroupIconButton variant="outlined" color="primary" onClick={() => setOpen(true)}>
                                <SettingsIcon/>
                            </ButtonGroupIconButton>
                        </ButtonGroup>
                    <SettingsModal showLabels={showLabels}
                                   setShowLabels={setShowLabels}
                                   showGenes={showGenes} setShowGenes={setShowGenes}
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
                                 showLabels={showLabels}
                                 showGenes={showGenes}
                                 showNumbers={showNumbers}
                                 isTimeseries={isTimeseries}
                                 id={props.id}/>
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
