import * as d3 from "d3";
import axios from 'axios';


function nest(data, ...keys) {
    const nest = d3.nest();
    for (const key of keys) nest.key(key);

    function hierarchy({key, values}, depth) {
        return {
            name: key,
            children: depth < keys.length - 1
                ? values.map(d => hierarchy(d, depth + 1))
                : values
        };
    }

    return nest.entries(data).map(d => hierarchy(d, 0));
}

function readData(dataFile, callback) {
    if (dataFile != null) {
        var reader = new FileReader();
        reader.onload = function (event) {
            const f = event.target.result;
            if (f !== null) {
                d3.tsv(f).then(data => {
                    const keys = data.columns.filter(d => d !== 'parentCategory' && d !== 'childCategory');
                    const hierarchy = new Map();
                    const pvalues = data.map(row => {
                        hierarchy.set(row.childCategory, row.parentCategory);
                        return {
                            name: row.childCategory, values: keys.map(key => {
                                let number = Number(row[key]);
                                // add small pseudocount because d3 can't handle 0 in treemaps
                                if (number === 0) {
                                    number = 0.00000000000001;
                                }
                                return number;
                            })
                        };
                    });
                    console.log(hierarchy,pvalues);
                    callback({keys, children: nest(pvalues, d => hierarchy.get(d.name))})
                })
            }
        };
        reader.readAsDataURL(dataFile);
    }
}

function readRawData(dataFile, ontology, cutoff, callback) {
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

                            Object.keys(data.treemapHierarchy).forEach(goTerm =>{
                                data.treemapHierarchy[goTerm].forEach((d,i)=>{
                                    goMap.set(data.data[d].description,data.data[goTerm].description)
                                });
                            });
                            const pvalues = [];
                            Object.keys(data.data).forEach(goTerm => {
                                if(goMap.has(data.data[goTerm].description)) {
                                    pvalues.push({
                                        name: data.data[goTerm].description,
                                        values: data.data[goTerm].pvalues
                                    })
                                }
                            });
                        callback({keys: data.conditions, children: nest(pvalues, d => goMap.get(d.name)),tableData:response.data.data, hierarchy:data.hierarchy});
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

export default readRawData;