import * as d3 from "d3";

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
function readData(dataFile, callback){
    if(dataFile != null){
    var reader = new FileReader();
    reader.onload = function(event) {
        const f = event.target.result;
        if(f !== null){
            d3.tsv(f).then(data =>{
            const keys=data.columns.filter(d=> d!== 'parentCategory' && d!== 'childCategory');
            const hierarchy= new Map();
            const pvalues = data.map(row => {
                hierarchy.set(row.childCategory,row.parentCategory);
                return {name:row.childCategory, values:keys.map(key => Number(row[key]))};
            })
        callback({keys, children: nest(pvalues, d => hierarchy.get(d.name))})
        })
    }
    }
        reader.readAsDataURL(dataFile);
        }
}
export default readData;