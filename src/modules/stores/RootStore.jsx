import {DataStore} from "./DataStore";
import {action, extendObservable} from "mobx";

export class RootStore {
    constructor() {
        this.ontologies_map = {BP: "Biological process", MF: "Molecular function", CC: "Cellular component"};
        this.dataStores = {};
        this.selectedMeasure = "Wang";
        this.pvalueFilter = 0.05;
        this.hasGeneInfo = true;
        this.hasFCs = true
        this.geneValues = [];
        this.goSetSize = []
        Object.keys(this.ontologies_map).forEach(ont => {
                this.dataStores[ont] = null
        });
        extendObservable(this, {
            initialized:false,
            ontology: "BP",
            sigThreshold: 0.05,
            ontologies: [],
            get logSigThreshold() {
                return -Math.log10(this.sigThreshold);
            },
            init: action((results, conditions, tableColumns, hasFC, geneValues, goSetSize, selectedMeasure, pvalueFilter) => {
                this.initialized=true;
                this.selectedMeasure = selectedMeasure;
                this.pvalueFilter = pvalueFilter;
                this.hasGeneInfo = Object.keys(geneValues).length > 0;
                this.hasFCs = hasFC
                this.geneValues = geneValues;
                this.goSetSize = goSetSize
                Object.keys(results).forEach(ont => {
                    if (Object.keys(results[ont].tree).length !== 0) {
                        this.dataStores[ont] = new DataStore(results[ont].data, results[ont].tree, conditions, tableColumns, this)
                    } else {
                        this.dataStores[ont] = null
                    }
                });
                this.ontologies = Object.keys(results).map(ont => {
                    return ({id: ont, name: this.ontologies_map[ont]})
                });
                this.sigThreshold = Number(pvalueFilter) <= 0.05 ? Number(pvalueFilter) : 0.05
            }),
            setOntology: action((ontology) => {
                this.ontology = ontology;
            }),
            setSigThreshold: action((threshold) => {
                this.sigThreshold = threshold;
            }),
        });
    }
}