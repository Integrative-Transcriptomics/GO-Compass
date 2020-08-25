from collections import defaultdict
import sys
import os

#====================================================================#

# define a function to record the children of each GO term in the GO hierarchy:

def read_go_children(input_go_obo_file):
    """record the children of each GO term in the GO hierarchy"""

    # first read in the input GO file, and make a list of all the GO terms, and the
    # terms below them in the GO hierarchy:
    # eg.
    # [Term]
    # id: GO:0004835
    children = defaultdict(list) # children of a particular GO term, in the hierarchy
    take = 0

    fileObj = open(input_go_obo_file, "r")
    for line in fileObj:
        line = line.rstrip()
        temp = line.split()
        if len(temp) == 1:
           if temp[0] == '[Term]':
               take = 1
        elif len(temp) >= 2 and take == 1:
            if temp[0] == 'id:':
                go = temp[1]
            elif temp[0] == 'is_a:': # eg. is_a: GO:0048308 ! organelle inheritance
                parent = temp[1]
                children[parent].append(go) # record that a child of 'parent' is term 'go'
        elif len(temp) == 0:
            take = 0
    fileObj.close()

    return children

#====================================================================#

# define a function to find all descendants of a GO term in the GO hierarchy:

def find_all_descendants(input_go_term, children):
    """find all the descendants of a GO term in the GO hierarchy
    >> find_all_descendants('GO1', {'GO1': ['GO2', 'GO3'], 'GO2': ['GO4']})
    ['GO1', 'GO2', 'GO3', 'GO4']
    """

    descendants = set()
    queue = []
    queue.append(input_go_term)
    while queue:
        node = queue.pop(0)
        if node in children and node not in descendants: # don't visit a second time
            node_children = children[node]
            queue.extend(node_children)
        descendants.add(node)

    return descendants

#====================================================================#

def getDescendants(input_go_term):
    input_go_obo_file = "go-basic.obo" # the input gene ontology file eg. gene_ontology.WS238.obo

    # find all the descendants of the term 'input_go_term':
    descendants = find_all_descendants(input_go_term, children)
    return descendants

children = read_go_children("go-basic.obo")

