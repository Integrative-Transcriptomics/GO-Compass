import {DataStore} from "./DataStore";
import {action, extendObservable} from "mobx";

export class RootStore {
    constructor(results, conditions, tableColumns) {
        this.ontologies_map = {BP: "Biological process", MF: "Molecular function", CC: "Cellular component"};
        this.dataStores = {};
        Object.keys(results).forEach(ont => this.dataStores[ont] = new DataStore(results[ont].data, results[ont].tree, conditions, tableColumns));
        this.ontologies = Object.keys(results).map(ont => {
            return ({id: ont, name: this.ontologies_map[ont]})
        });
        extendObservable(this, {
            ontology: "BP",
            setOntology: action((ontolgy) => {
                this.ontology = ontolgy;
            })
        });
    }

}