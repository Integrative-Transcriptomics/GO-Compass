import axios from 'axios';

function performCorrelation(data, callback) {
    axios.post("/correlation", {data: data}).then((response) => {
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

function multiRevigoGeneLists(dataFiles, conditions, genome, ontology, pvalueFilter, callback) {
    if (dataFiles.length > 0) {
        let counter = 0;
        dataFiles.forEach((file, i) => {
            const formData = new FormData();
            formData.append("file", file);
            axios.post("/sendFile?condition=" + conditions[i], formData).then(() => {
                counter += 1;
                if (counter === dataFiles.length) {
                    axios.post("/MultiRevigoGeneLists?genome=" + genome + "&ontology=" + ontology + "&pvalueFilter=" + pvalueFilter, {conditions: conditions})
                        .then(response => callback(response.data));
                }
            })
        })
    }

}

function readData(dataFile, ontology, pvalueFilter, callback) {
    if (dataFile != null) {
        const formData = new FormData();
        formData.append("data", dataFile);
        axios.post("/MultiRevigoGoList?ontology=" + ontology + "&pvalueFilter=" + pvalueFilter, formData)
            .then(response => {
                callback(response.data);
            })
            .catch(function (error) {
                console.log(error);
            });
    }
}

export {readData, multiRevigoGeneLists, getSupportedGenomes,performPCA, performCorrelation};
