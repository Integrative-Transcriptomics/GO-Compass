function calculateTreeLayout(tree, height) {
    const flatDescendants = getDescendants(tree);
    const stepsize = height / (flatDescendants.length +1);
    return(traverseTree(tree, null, stepsize, 0));
}

function traverseTree(node, parent, stepSize, currY) {
    const nodes = [];
    const parentNode = ({x: node.value, y: currY, data: node, parent: parent});
    nodes.push(parentNode);
    currY += stepSize;
    if ("children" in node) {
        node.children.sort((a, b) => b.value - a.value).forEach((child, i) => {
            nodes.push(...traverseTree(child, parentNode, stepSize, currY));
            currY += (getDescendants(child).length+1) * stepSize;
        });
    }
    return(nodes)
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


export default calculateTreeLayout;