import axios from 'axios';

function performCorrelation(data, callback) {
    axios.post("/correlation", {data: data}).then((response) => {
        console.log(response.data)
        callback(response.data);
    })
}

function performPCA(data, callback) {
    axios.post("/pca", {data: data}).then((response) => {
        callback(response.data);
    })
}

function getSupportedGenomes(callback) {
    axios.get("http://pantherdb.org/services/oai/pantherdb/supportedgenomes")
        .then(response => callback(response.data.search.output.genomes.genome))
}

function multiRevigoGeneLists(dataFiles, backgroundFile, conditions, ontology, method, pvalueFilter, callback) {
    console.log(dataFiles);
    const formData = new FormData();
    formData.append("background", backgroundFile);
    dataFiles.forEach(file => formData.append("geneLists[]", file));
    formData.append("ontology", ontology);
    formData.append("pvalueFilter", pvalueFilter);
    conditions.forEach(condition => formData.append("conditions[]",condition));
    formData.append("method", method);
    if (dataFiles.length > 0) {
        axios.post("/GeneListsMultiREVIGO", formData)
            .then(response => callback(response.data))
            .catch(function (error) {
                console.log(error)
            });
    }

}

function multiRevigoGoLists(dataFile, backgroundFile, ontology, method, pvalueFilter, callback) {
    if (dataFile != null) {
        const formData = new FormData();
        formData.append("background", backgroundFile);
        formData.append("goEnrichment", dataFile);
        formData.append("ontology", ontology);
        formData.append("pvalueFilter", pvalueFilter);
        formData.append("method", method);
        axios.post("/GoListsMultiREVIGO", formData)
            .then(response => {
                console.log(response.data);
                callback(response.data);
            })
            .catch(function (error) {
                console.log(error);
            });
    }
}

export {multiRevigoGoLists, multiRevigoGeneLists, getSupportedGenomes, performPCA, performCorrelation};
