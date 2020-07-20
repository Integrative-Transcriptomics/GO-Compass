import {extendObservable, action} from "mobx";

export class TableStore {
    constructor() {
        extendObservable(this, {
            termState: [],
            initTermState: action((terms) => {
                this.termState = terms.map(term => {
                    return ({goTerm: term, open: false})
                });
            }),
            setTermOrder: action((termOrder) => {
                this.termState=termOrder;
            }),
        })
    }
}