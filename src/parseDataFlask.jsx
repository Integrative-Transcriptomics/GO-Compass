import axios from 'axios';

/**
 * performs api call for correlation
 * @param {Object} data
 * @param {function} callback
 */
function performCorrelation(data, callback) {
    axios.post("/correlation", {data: data}).then((response) => {
        callback(response.data);
    })
}

/**
 * performs api call for PCA
 * @param {Object} data
 * @param {function} callback
 */
function performPCA(data, callback) {
    axios.post("/pca", {data: data}).then((response) => {
        callback(response.data);
    })
}

/**
 * performs api call to get supported genomes from PANTHER
 * @param {function} callback
 */
function getSupportedGenomes(callback) {
    axios.get("http://pantherdb.org/services/oai/pantherdb/supportedgenomes")
        .then(response => callback(response.data.search.output.genomes.genome))
}

/**
 * performs api call for multiple gene lists
 * @param dataFiles
 * @param backgroundFile
 * @param conditions
 * @param method
 * @param pvalueFilter
 * @param callback
 */
function multiRevigoGeneLists(dataFiles, backgroundFile, conditions, method, pvalueFilter, callback) {
    const formData = new FormData();
    formData.append("background", backgroundFile);
    dataFiles.forEach(file => formData.append("geneLists[]", file));
    formData.append("pvalueFilter", pvalueFilter);
    conditions.forEach(condition => formData.append("conditions[]", condition));
    formData.append("method", method);
    if (dataFiles.length > 0) {
        axios.post("/GeneListsMultiREVIGO", formData)
            .then(response => {
                console.log(response.data);
                callback(response.data);
            })
            .catch(function (error) {
                console.log(error)
            });
    }

}


function multiRevigoGoLists(dataFile, backgroundFile, method, pvalueFilter, callback) {
    if (dataFile != null) {
        const formData = new FormData();
        formData.append("background", backgroundFile);
        formData.append("goEnrichment", dataFile);
        formData.append("pvalueFilter", pvalueFilter);
        formData.append("method", method);
        axios.post("/GoListsMultiREVIGO", formData)
            .then(response => callback(response.data))
            .catch(function (error) {
                console.log(error);
            });
    }
}

function multiSpeciesRevigo(dataFiles, backgroundFiles, conditions, backgroundMap, method, pvalueFilter, direction, callback) {
    const formData = new FormData();
    backgroundFiles.forEach(file => formData.append("backgrounds[]", file));
    dataFiles.forEach(file => formData.append("geneLists[]", file));
    formData.append("pvalueFilter", pvalueFilter);
    conditions.forEach(condition => formData.append("conditions[]", condition));
    backgroundMap.forEach(condition => formData.append("backgroundMap[]", condition));
    formData.append("method", method);
    formData.append("direction",direction);
    if (dataFiles.length > 0 && backgroundFiles.length > 0) {
        axios.post("/MultiSpeciesREVIGO", formData)
            .then(response => {
                console.log(response.data)
                callback(response.data)
            })
            .catch(function (error) {
                console.log(error)
            });
    }
}

function exampleData(callback) {
    const requestBackground = axios.get("/exampleBackground")
    const requestTP1 = axios.get("/exampleCondition?name=timepoint1.txt")
    const requestTP2 = axios.get("/exampleCondition?name=timepoint2.txt")
    const requestTP3 = axios.get("/exampleCondition?name=timepoint3.txt")
    const requestTP4 = axios.get("/exampleCondition?name=timepoint4.txt")
    const requestTP5 = axios.get("/exampleCondition?name=timepoint5.txt")
    axios.all([requestBackground, requestTP1, requestTP2, requestTP3, requestTP4, requestTP5])
        .then(axios.spread((...responses) => {
                const data = {
                    background: responses[0].data,
                    lists: {
                        timepoint1: responses[1].data,
                        timepoint2: responses[2].data,
                        timepoint3: responses[3].data,
                        timepoint4: responses[4].data,
                        timepoint5: responses[5].data,
                    }
                }
                callback(data)
            }
        ))

}
function exampleDataWithFC(callback) {
    const requestBackground = axios.get("/exampleBackground")
    const requestTP1 = axios.get("/exampleCondition?name=timepoint_with_fc_1.txt")
    const requestTP2 = axios.get("/exampleCondition?name=timepoint_with_fc_2.txt")
    const requestTP3 = axios.get("/exampleCondition?name=timepoint_with_fc_3.txt")
    const requestTP4 = axios.get("/exampleCondition?name=timepoint_with_fc_4.txt")
    const requestTP5 = axios.get("/exampleCondition?name=timepoint_with_fc_5.txt")
    axios.all([requestBackground, requestTP1, requestTP2, requestTP3, requestTP4, requestTP5])
        .then(axios.spread((...responses) => {
                const data = {
                    background: responses[0].data,
                    lists: {
                        timepoint1: responses[1].data,
                        timepoint2: responses[2].data,
                        timepoint3: responses[3].data,
                        timepoint4: responses[4].data,
                        timepoint5: responses[5].data,
                    }
                }
                callback(data)
            }
        ))

}

export {
    multiRevigoGoLists,
    multiRevigoGeneLists,
    multiSpeciesRevigo,
    getSupportedGenomes,
    performPCA,
    performCorrelation,
    exampleData,
    exampleDataWithFC
};
