import {DataStore} from "./DataStore";
import {action, extendObservable} from "mobx";

export class RootStore {
    constructor(results, conditions, tableColumns,hasFC, geneValues, go2genes,goSetSize, selectedMeasure, pvalueFilter) {
        this.ontologies_map = {BP: "Biological process", MF: "Molecular function", CC: "Cellular component"};
        this.dataStores = {};
        this.selectedMeasure = selectedMeasure;
        this.pvalueFilter = pvalueFilter;
        this.hasGeneInfo=Object.keys(geneValues).length>0;
        this.hasFCs=hasFC
        this.geneValues=geneValues;
        this.go2genes=go2genes;
        this.goSetSize=goSetSize
        Object.keys(results).forEach(ont => {
            if (Object.keys(results[ont].tree).length !== 0) {
                this.dataStores[ont] = new DataStore(results[ont].data, results[ont].tree, conditions, tableColumns, this)
            }else{
                this.dataStores[ont]=null
            }
        });
        this.ontologies = Object.keys(results).map(ont => {
            return ({id: ont, name: this.ontologies_map[ont]})
        });
        extendObservable(this, {
            ontology: "BP",
            sigThreshold: pvalueFilter<=0.05?pvalueFilter:0.05,
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