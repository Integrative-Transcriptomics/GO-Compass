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

function multiRevigoGoLists(goFile, dataFiles, backgroundFiles, propagateBackground, method, pvalueFilter, direction, callback) {
    const formData = new FormData();
    backgroundFiles.forEach(file => formData.append("backgrounds[]", file));
    formData.append("propagateBackground", propagateBackground);
    dataFiles.forEach(file => formData.append("geneLists[]", file));
    formData.append("goEnrichment", goFile);
    formData.append("pvalueFilter", pvalueFilter);
    formData.append("method", method);
    formData.append("direction", direction);
    axios.post("/MultiREVIGO", formData)
        .then(response => {
            callback(response.data)
        })
        .catch(error => {
            if (error.response) {
                console.log(error.response.data);
                console.log(error.response.status);
                console.log(error.response.headers);
            } else if (error.request) {
                console.log(error.request);
            } else {
                // Something happened in setting up the request that triggered an Error
                console.log('Error', error.message);
            }
            callback()
        })
}

function multiSpeciesRevigo(dataFiles, backgroundFiles, propagateBackground, conditions, backgroundMap, method, pvalueFilter, direction, callback) {
    const formData = new FormData();
    backgroundFiles.forEach(file => formData.append("backgrounds[]", file));
    formData.append("propagateBackground", propagateBackground);
    dataFiles.forEach(file => formData.append("geneLists[]", file));
    formData.append("pvalueFilter", pvalueFilter);
    conditions.forEach(condition => formData.append("conditions[]", condition));
    backgroundMap.forEach(condition => formData.append("backgroundMap[]", condition));
    formData.append("method", method);
    formData.append("direction", direction);
    if (dataFiles.length > 0 && backgroundFiles.length > 0) {
        axios.post("/MultiREVIGO", formData)
            .then(response => {
                callback(response.data)
            })
            .catch(error => {
                if (error.response) {
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);
                } else if (error.request) {
                    console.log(error.request);
                } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log('Error', error.message);
                }
                callback()
            })
    }
}


function getGOheader(goFile, callback) {
    if (goFile != null) {
        const formData = new FormData();
        formData.append("goEnrichment", goFile);
        axios.post("/readFileHeader", formData)
            .then(response => {
                callback(response.data)
            })
            .catch(function (error) {
                console.log(error);
            });
    }
}

function exampleMouse(callback) {
    axios.get("/load_mus_musculus").then((response) => {
        callback(response.data)
    })
}

function exampleTreponema(callback) {
    axios.get("/load_treponema_pallidum").then((response) => {
        callback(response.data)
    })
}

function exampleStrepto(callback) {
    axios.get("/load_streptomyces").then((response) => {
        callback(response.data)
    })
}


export {
    multiRevigoGoLists,
    multiSpeciesRevigo,
    performCorrelation,
    getGOheader,
    exampleMouse,
    exampleTreponema,
    exampleStrepto
};
