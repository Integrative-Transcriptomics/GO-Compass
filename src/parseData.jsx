import * as d3 from "d3";
import axios from 'axios';


function nest(data, ...keys) {
    const nest = d3.nest();
    for (const key of keys) nest.key(key);

    function hierarchy({key, values}, depth) {
        return {
            id: key,
            name: data.filter((d) => d.id === key)[0].name,
            children: depth < keys.length - 1
                ? values.map(d => hierarchy(d, depth + 1))
                : values
        };
    }

    return nest.entries(data).map(d => hierarchy(d, 0));
}

function prepareData(data, callback) {
    const goMap = new Map();
    Object.keys(data.treemapHierarchy).forEach(goTerm => {
        data.treemapHierarchy[goTerm].forEach(d => {
            goMap.set(d, goTerm)
        });
    });
    const pvalues = [];
    Object.keys(data.data).forEach(goTerm => {
        if (goMap.has(goTerm)) {
            pvalues.push({
                id: goTerm,
                name: data.data[goTerm].description,
                values: data.data[goTerm].pvalues.map(d => d + 0.0000001)
            })
        }
    });
    callback({
        conditions: data.conditions,
        nestedData: nest(pvalues, d => goMap.get(d.id)),
        tableData: data.data,
        hierarchy: data.hierarchy,
        correlation: data.correlation,
        pca: data.pca
    });
}

function getSupportedGenomes(callback) {
    axios.get("http://pantherdb.org/services/oai/pantherdb/supportedgenomes")
        .then(response => callback(response.data.search.output.genomes.genome))
}

function multiRevigoGeneLists(dataFiles, conditions, genome, ontology, cutoff, pvalueFilter, callback) {
    if (dataFiles.length > 0) {
        let counter = 0;
        dataFiles.forEach((file, i) => {
            const formData = new FormData();
            formData.append("file", file);
            axios.post("/sendFile?condition=" + conditions[i], formData).then(() => {
                counter += 1;
                if (counter === dataFiles.length) {
                    axios.post("/MultiRevigoGeneLists?genome=" + genome + "&ontology=" + ontology + "&cutoff=" + cutoff + "&pvalueFilter=" + pvalueFilter, {conditions:conditions})
                        .then(response => prepareData(response.data, callback));
                }
            })
        })
    }

}

function readData(dataFile, ontology, cutoff, pvalueFilter, callback) {
    if (dataFile != null) {
        console.log(dataFile);
        const formData = new FormData();
        formData.append("data", dataFile);
        axios.post("/MultiRevigoGoList?ontology=" + ontology + "&cutoff=" + cutoff + "&pvalueFilter=" + pvalueFilter, formData)
            .then(response => {
                prepareData(response.data, callback)
            })
            .catch(function (error) {
                console.log(error);
            });
    }
}

export {readData, multiRevigoGeneLists, getSupportedGenomes};
