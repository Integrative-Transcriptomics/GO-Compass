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


function readData(dataFile, ontology, cutoff, callback) {
    if (dataFile != null) {
        const reader = new FileReader();
        reader.onload = function (event) {
            const f = event.target.result;
            if (f !== null) {
                d3.tsv(f).then(data => {
                    axios({
                        method: 'post',
                        url: '/MultiRevigo',
                        data: {
                            data: data,
                            ontology: ontology,
                            cutoff: cutoff
                        },
                    }).then(function (response) {
                        const data = response.data;
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
                                    values: data.data[goTerm].pvalues
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
                    })
                        .catch(function (error) {
                            console.log(error);
                        });
                })
            }
        };
        reader.readAsDataURL(dataFile);
    }
}

export default readData;