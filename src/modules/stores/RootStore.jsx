import {DataStore} from "./DataStore";
import {action, extendObservable} from "mobx";

export class RootStore {
    constructor(results, conditions, tableColumns, selectedMeasure, pvalueFilter) {
        this.ontologies_map = {BP: "Biological process", MF: "Molecular function", CC: "Cellular component"};
        this.dataStores = {};
        this.selectedMeasure = selectedMeasure;
        this.pvalueFilter = pvalueFilter;
        Object.keys(results).forEach(ont => this.dataStores[ont] = new DataStore(results[ont].data, results[ont].tree, conditions, tableColumns, this));
        this.ontologies = Object.keys(results).map(ont => {
            return ({id: ont, name: this.ontologies_map[ont]})
        });
        extendObservable(this, {
            ontology: "BP",
            sigThreshold: 0.05,
            isTimeSeries: false,
            get logSigThreshold() {
                return -Math.log10(this.sigThreshold);
            },
            setOntology: action((ontolgy) => {
                this.ontology = ontolgy;
            }),
            toggleIsTimeSeries: action(() => {
                this.isTimeSeries = !this.isTimeSeries;
            }),
            setSigThreshold: action((threshold) => {
                this.sigThreshold = threshold;
            }),
        });
    }

}