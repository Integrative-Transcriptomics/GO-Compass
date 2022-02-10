import {action, extendObservable} from "mobx";
import * as d3 from "d3";
import {getTextWidth} from "../../UtilityFunctions";

/**
 * store for visualization operations
 */
export class VisStore {
    constructor(dataStore) {
        this.dataStore = dataStore;
        this.animationDuration = 1500;
        extendObservable(this, {
            screenWidth: 1000,
            plotHeight: 700,
            treemapHeight: 100,
            tsPlotType: "lineChart",
            showOverview: false,
            childHighlight: null,
            childHighlights: [],
            conditionIndex: 0,

            /**
             * color Scale for terms
             * @returns {*}
             */
            get termColorScale() {
                return d3.scaleOrdinal(['#8dd3c7', '#bebada', '#fb8072', '#80b1d3'
                    , '#fdb462', '#b3de69', '#fccde5', '#d9d9d9', '#bc80bd', '#ccebc5', '#ffed6f']);
            },
            get maxConditionTextSize() {
                return d3.max(this.dataStore.conditions.map(d => getTextWidth(d, 12, "normal")))
            },
            /**
             * layout function for treemaps. Created in store to ensure that
             * small multiples and selected Treemap have the same layout
             * @returns {function(*): *}
             */
            get treemapLayout() {
                const width = this.screenWidth / 3;
                const height = this.treemapHeight;
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
                this.screenWidth = width-36;
            }),
            setPlotHeight: action((height) => {
                this.plotHeight = height - 200;
            }),
            setTreemapHeight: action((height) => {
                this.treemapHeight = height
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