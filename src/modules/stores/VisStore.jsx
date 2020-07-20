import {extendObservable, action} from "mobx";
import * as d3 from "d3";

export class VisStore {
    /* some observable state */
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.animationDuration = 1500;
        extendObservable(this, {
            screenWidth: 1000,
            tsPlotType: "lineChart",
            isTimeSeries: false,
            parentHighlight: null,
            childHighlight: null,
            conditionIndex: 0,
            sigThreshold: 0.05,

            get termColorScale() {
                return d3.scaleOrdinal(this.dataStore.nestedData.map(d => d.id), d3.schemeCategory10.map(d => d3.interpolateRgb(d, "white")(0.5)));
            },

            setScreenWidth: action((width) => {
                this.screenWidth = width;
            }),
            setTsPlotType: action((type) => {
                this.tsPlotType = type;
            }),
            toggleIsTimeSeries: action(() => {
                this.isTimeSeries = !this.isTimeSeries;
            }),
            setChildHighlight: action((highlight) => {
                this.childHighlight = highlight;
            }),
            setParentHighlight: action((highlight) => {
                this.parentHighlight = highlight;
            }),
            setConditionIndex: action((index) => {
                this.conditionIndex = index;
            }),
            setSigThreshold: action((threshold) => {
                this.sigThreshold = threshold;
            })
        })
    }
}