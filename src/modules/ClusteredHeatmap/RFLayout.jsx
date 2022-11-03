function traverseTree(node, parent, stepSize, currY) {
    const nodes = [];
    const parentNode = ({x: node.value, y: currY, data: node, parent: parent});
    nodes.push(parentNode);
    currY += stepSize;
    if ("children" in node) {
        node.children.slice().sort((a, b) => b.value - a.value).forEach((child, i) => {
            nodes.push(...traverseTree(child, parentNode, stepSize, currY));
            currY += (getDescendants(child).length + 1) * stepSize;
        });
    }
    return (nodes)
}


function getDescendants(node) {
    const toReturn = [];
    if ("children" in node) {
        node.children.forEach(child => {
            toReturn.push(...getDescendants(child));
            toReturn.push(child);
        })
    }
    return toReturn
}


export default traverseTree;