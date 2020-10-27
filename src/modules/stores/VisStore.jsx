import {extendObservable, action} from "mobx";
import * as d3 from "d3";

export class VisStore {
    /* some observable state */
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.animationDuration = 1500;
        extendObservable(this, {
            screenWidth: 1000,
            plotHeight: 700,
            tsPlotType: "lineChart",
            showOverview: false,
            childHighlight: null,
            childHighlights: [],
            conditionIndex: 0,

            get termColorScale() {
                return d3.scaleOrdinal(d3.schemeSet2);
            },
            get treemapLayout() {
                const width = this.screenWidth / 3;
                const height = this.plotHeight / 2;
                const treemap = d3.treemap()
                    .tile(d3.treemapResquarify)
                    .size([width, height])
                    .padding(d => d.height === 1 ? 1 : 0)
                    .round(true);

                const root = treemap(d3.hierarchy({children: dataStore.nestedData, keys: dataStore.conditions})
                    .sum(d => d.values ? d3.sum(d.values) : 0)
                    .sort((a, b) => b.value - a.value));

                const max = d3.max(dataStore.conditions
                    .map((d, i) => d3.hierarchy({children: dataStore.nestedData, keys: dataStore.conditions})
                        .sum(d => d.values ? d.values[i] : 0).value));
                const layout = ((index) => {
                    const k = Math.sqrt(root.sum(d => d.values ? d.values[index] : 0).value / max);
                    const x = (1 - k) / 2 * width;
                    const y = (1 - k) / 2 * height;
                    return treemap.size([width * k, height * k])(root)
                        .each(d => {
                            d.x0 += x;
                            d.x1 += x;
                            d.y0 += y;
                            d.y1 += y;
                        })
                });
                return (layout)
            },

            setScreenWidth: action((width) => {
                this.screenWidth = width - 100;
            }),
            setPlotHeight: action((height) => {
                this.plotHeight = height - 200;
            }),
            setTsPlotType: action((type) => {
                this.tsPlotType = type;
            }),
            toggleIsTimeSeries: action(() => {
                this.isTimeSeries = !this.isTimeSeries;
            }),
            toggleShowOverview: action(() => {
                this.showOverview = !this.showOverview
            }),
            setChildHighlight: action((highlight) => {
                if (highlight === null) {
                    this.childHighlights = []
                } else {
                    this.childHighlights = [highlight];
                }
            }),
            setChildHighlights: action((highlights) => {
                this.childHighlights = highlights;
            }),
            setParentHighlight: action((highlight) => {
                if (highlight !== null) {
                    this.setChildHighlights(this.dataStore.clusterHierarchy[highlight])
                } else {
                    this.setChildHighlights([])
                }
            }),
            setConditionIndex: action((index) => {
                this.conditionIndex = index;
            }),
            setSigThreshold: action((threshold) => {
                this.sigThreshold = threshold;
            }),

        })
    }
}