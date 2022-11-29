import os
import random
import json
import tempfile
from collections import Counter
from io import StringIO

import simplejson
import numpy as np
import pandas as pd
from flask import Flask, send_file
from flask import request
from goatools.anno.factory import get_objanno
from goatools.anno.update_association import update_association
from goatools.godag.consts import NAMESPACE2NS
from goatools.godag.go_tasks import get_go2parents
from goatools.goea.go_enrichment_ns import GOEnrichmentStudyNS
from goatools.obo_parser import GODag
from goatools.semantic import TermCounts, resnik_sim, lin_sim, semantic_similarity
from goatools.semsim.termwise.wang import SsWang
from sklearn.decomposition import PCA

from gocompass.findDescendants import getDescendants

app = Flask(__name__, static_folder='../build', static_url_path='/')
here = os.path.dirname(__file__)

godag = GODag(os.path.join(here, "go-basic.obo"))
optional_relationships = set()
ontologies = ["MF", "BP", "CC"]
parents = get_go2parents(godag, optional_relationships)


def MultiGO(goEnrichment, background, method):
    """ Return a dictionary

    Keyword arguments:
    goTerms -- list of go terms
    background -- backgound (objanno)
    method -- semantic similarity method, either "Lin", "Resnik", "Wang" or "Edge-based"
    Creates semantic similarity matrix
    Performs clustering
    """
    goEnrichment.sort_index(inplace=True)

    # filter GO enrichment by p-values
    mask = goEnrichment[goEnrichment < float(request.form['pvalueFilter'])].isnull().all(axis=1)
    goEnrichment = goEnrichment[mask == False]
    goEnrichment = goEnrichment[goEnrichment.index.isin(godag.keys())]

    goTerms = goEnrichment.index.values
    matrix = np.array(createMatrix(goTerms, background, method))
    matrix[matrix == None] = 0
    return iterateMatrix(matrix, goTerms, goEnrichment, flattenBackground(background))


def createMatrix(goTerms, background, method):
    """ Return a numerical matrix

    Keyword arguments:
    goTerms -- list of go terms
    background -- flattened background: lists of genes and GO Terms
    method -- semantic similarity method, either "Lin", "Resnik", "Wang" or "Edge-based"
    Creates semantic similarity matrix
    """
    termcounts = TermCounts(godag, background)
    matrix = list()
    wang_r1 = None
    if method == "Wang":
        wang_r1 = SsWang(goTerms, godag)
    # only create half of matrix, fill rest with -1
    i = 0
    for termA in goTerms:
        j = 0
        row = list()
        for termB in goTerms:
            sim = -1
            if i < j:
                if method == "Lin":
                    sim = lin_sim(termA, termB, godag, termcounts)
                elif method == "Resnik":
                    sim = resnik_sim(termA, termB, godag, termcounts)
                elif method == "Wang":
                    sim = wang_r1.get_sim(termA, termB)
                else:
                    sim = semantic_similarity(termA, termB, godag)
            row.append(sim)
            j += 1
        matrix.append(row)
        i += 1
    return matrix


def iterateMatrix(matrix, goTerms, goEnrichment, background):
    """ return a dictionary

    Keyword arguments:
    matrix -- numerical matrix of semantic similarities
    goTerms -- list of goTerms
    goEnrichment -- GO enrichment result
    background -- flattened background: lists of genes and GO Terms
    iterates through semantic similarity matrix in decreasing ss order
    """
    numGenes = len(list(dict.fromkeys(background[0])))
    max = goEnrichment.max().max()
    min = goEnrichment.min().min()

    # p-values are considered similar if they have a maximum difference of 5%
    maxDiff = (max - min) * 0.05

    # frequencies of GO temrs
    frequencies = dict(Counter(background[1]))
    frequencies = {k: v / numGenes for k, v in frequencies.items()}
    avgs = dict()

    # calculate averages for each term for uniqueness value
    for index, term in enumerate(goTerms):
        col = matrix[:, index]
        row = matrix[index, :]
        col = col[col != -1]
        row = row[row != -1]
        avgs[term] = (col.sum() + row.sum()) / (len(goTerms) - 1)

    # stores tree structure
    tree = dict()
    # stores additional data for each GO term
    goList = dict()
    if len(goTerms) == 1:
        tree[goTerms[0]] = {}
    while len(goTerms) > 0:
        maxValue = np.amax(np.ravel(matrix))

        # get most similar pair of GO terms
        indices = np.where(matrix == maxValue)
        indices = list(zip(indices[0], indices[1]))[0]
        termA = goTerms[indices[0]]
        termB = goTerms[indices[1]]

        # calculate which GO term is rejected
        delete = testGoTerms(termA, termB, goEnrichment, background, frequencies, maxDiff)
        toDelete = delete["term"]
        if toDelete == termA:
            deleteIndex = indices[0]
            toKeep = termB
        else:
            deleteIndex = indices[1]
            toKeep = termA

        # add GO terms to current tree dict
        if toKeep != toDelete:
            if toDelete in tree:
                if toKeep in tree:
                    # if both terms are in the tree dict, it means that they form non-connected subtrees.
                    # The tree dict of the rejected term is placed as the child of the kept term
                    tree[toKeep][toDelete] = tree[toDelete]
                else:
                    # if the kept term is not in the tree dict but the rejected is,
                    # the kept term will be placed as the parent of the rejected term
                    tree[toKeep] = {}
                    tree[toKeep][toDelete] = tree[toDelete]
            else:
                if toKeep in tree:
                    # if the kept term is in the tree dict, but the rejected is not,
                    # the rejected term is added as a child of the kept term
                    tree[toKeep][toDelete] = toDelete
                else:
                    # if none of the terms are in the tree dict, a new entry is created
                    tree[toKeep] = {toDelete: toDelete}
            # not connected trees that have the rejected term as a parent are deleted
            # as the rejected term is now incorporated in the final tree dict structure
            tree.pop(toDelete, None)
        else:
            maxValue = 0
        uniqueness = 1
        if len(avgs) > 0:
            uniqueness = 1 - avgs[toDelete]
        goList[toDelete] = {
            "termID": toDelete,
            "description": godag[toDelete].name,
            "frequency": calculateFrequency(toDelete, frequencies),
            "uniqueness": uniqueness,
            "dispensability": maxValue,
            "pvalues": np.negative(np.log10(goEnrichment.loc[toDelete, :].values)).tolist()
        }
        # delete rejected term from list of GO terms and from ss matrix
        goTerms = np.delete(goTerms, deleteIndex)
        matrix = np.delete(matrix, deleteIndex, 0)
        matrix = np.delete(matrix, deleteIndex, 1)
    return {"tree": tree, "data": goList}


def testGoTerms(termA, termB, goEnrichment, background, goCounts, maxDiff):
    """ returns a dictionary

    Keyword arguments:
    termA -- goTerm
    termB -- goTerm
    goEnrichment -- GO enrichment result
    applies rejection criteria to pairs of GO terms
    """
    # frequency check: Reject very general GO terms
    frequencyA = calculateFrequency(termA, goCounts)
    frequencyB = calculateFrequency(termB, goCounts)
    if frequencyA > 0.05:
        if frequencyB > 0.05:
            if frequencyB > frequencyA:
                return {"rejection": "frequency" + termA, "term": termB}
                # return termB
            else:
                return {"rejection": "frequency" + termB, "term": termA}
                # return termA
        else:
            return {"rejection": "frequency" + termB, "term": termA}
            # return termA
    else:
        if frequencyB > 0.05:
            return {"rejection": "frequency" + termA, "term": termB}
            # return termB
        # p-value reject: Reject GO terms with lower p-values
        else:
            pvaluesA = np.array(goEnrichment.loc[termA, :].values.tolist())
            pvaluesB = np.array(goEnrichment.loc[termB, :].values.tolist())
            filterMask = (abs(pvaluesA - pvaluesB) * (1 - np.minimum(pvaluesA, pvaluesB))) > maxDiff
            filteredPvaluesA = pvaluesA[filterMask]
            filteredPvaluesB = pvaluesB[filterMask]
            bbiggera = len(np.where(filteredPvaluesA < filteredPvaluesB)[0])
            abiggerb = len(np.where(filteredPvaluesA > filteredPvaluesB)[0])
            if bbiggera < abiggerb:
                return {"rejection": "pval" + termB, "term": termA}
                # return termA
            else:
                if bbiggera > abiggerb:
                    return {"rejection": "pval" + termA, "term": termB}
                    # return termB
                else:
                    if bbiggera != 0 and abiggerb != 0:
                        if np.average(filteredPvaluesA) < np.average(filteredPvaluesB):
                            return {"rejection": "pval" + termA, "term": termB}
                        else:
                            return {"rejection": "pval" + termB, "term": termA}
                    # parent reject: Reject terms based on their relationship in the GO dag
                    else:
                        parentsA = parents[termA]
                        parentsB = parents[termB]
                        genesA = getAssociatedGenes(termA, background)
                        genesB = getAssociatedGenes(termB, background)
                        intersection = np.intersect1d(genesA, genesB)
                        if termB in parentsA:
                            # if the parent term is composed almost exclusively of the child term, reject parent
                            if len(genesB) * 0.75 < len(intersection):
                                return {"rejection": "parent" + termA, "term": termB}
                                # return termB
                            else:
                                # if not, reject child
                                return {"rejection": "child" + termB, "term": termA}
                                # return termA
                        else:
                            if termA in parentsB:
                                if len(genesA) * 0.75 < len(intersection):
                                    return {"rejection": "parent" + termB, "term": termA}
                                    # return termA
                                else:
                                    return {"rejection": "child" + termA, "term": termB}
                                    # return termB
                            # pseudo random reject
                            else:
                                seed = int(termA[3:-1])
                                random.seed(seed)
                                if bool(random.getrandbits(1)):
                                    return {"rejection": "random" + termB, "term": termA}
                                    # return termA
                                else:
                                    return {"rejection": "random" + termA, "term": termB}
                                    # return termB


# calculates frequency of a go Term (including its descendants)
def calculateFrequency(term, frequencies):
    """ returns a float

    Keyword arguments:
    term -- GO term
    frequencies -- dictionary of frequencies

    calculates frequency of a go Term (including its descendants)
    """
    descendants = getDescendants(term)
    frequency = 0
    for descendant in descendants:
        if descendant in frequencies:
            frequency = frequency + frequencies[descendant]
    if term in frequencies:
        frequency = frequency + frequencies[term]
    return frequency


def getAssociatedGenes(term, background):
    """ returns list of genes

    Keyword arguments:
    term -- goTerm
    background -- flattened background: lists of genes and GO terms
    gets genes associated with a GO term
    """
    npBackground = np.array(background)
    associatedGenes = list()
    filteredBackground = npBackground[:, npBackground[1] == term]
    if len(filteredBackground) > 0:
        associatedGenes = filteredBackground[0, :]
    return associatedGenes


def readBackground(backgroundFile):
    """ return a dictionary

    Keyword arguments:
    backgroundFile -- background as string
    reads background file
    """
    # helper file needs to be created since GOAtools method is only able to read files
    helperFile = tempfile.NamedTemporaryFile()
    helperFile.write(backgroundFile.stream.read())
    objanno = get_objanno(helperFile.name, 'id2gos', godag=godag)
    return (objanno)


def flattenBackground(background):
    """ returns list of lists

    Keyword arguments:
    background -- background dictionary
    flattens background dict to two lists: List of genes and list of GO terms
    """
    genes = list()
    terms = list()
    for gene in background:
        for term in background[gene]:
            terms.append(term)
            genes.append(gene)
    return [genes, terms]


def GOEA(genes, objanno, propagateBackground):
    """ returns go term enrichment

    Keyword arguments:
    genes -- list of genes
    objanno -- background dict
    propagateBackground -- should background be propagated
    performs GO term enrichment
    """
    goeaobj = GOEnrichmentStudyNS(
        objanno.get_id2gos().keys(),  # List of  protein-coding genes
        objanno.get_ns2assc(),  # geneid/GO associations
        godag,  # Ontologies
        propagate_counts=propagateBackground,
        alpha=0.05,  # default significance cut-off
        methods=['fdr_bh'])  # defult multipletest correction method
    goea_quiet_all = goeaobj.run_study(genes, prt=None)
    goea_results = dict((el, []) for el in ontologies)
    for r in goea_quiet_all:
        direction = "+"
        if r.enrichment == "p":
            direction = "-"
        goea_results[r.NS].append([r.GO, r.p_fdr_bh, direction, r.pop_count, r.study_items])
    for ont in goea_results:
        goea_results[ont] = np.array(goea_results[ont])
        goea_results[ont] = goea_results[ont][goea_results[ont][:, 0].argsort()]
    return goea_results


@app.route('/pca', methods=["POST"])
def pca():
    """ returns dict
    performs PCA
    """
    data = request.json["data"]
    pvalues = list()
    for key in data:
        if key != "goTerm":
            pvalues.append(data[key])
    pca = PCA(n_components=2)
    pca.fit(pvalues)
    X_pca = pca.fit_transform(pvalues)
    coords = list()
    for dp in X_pca:
        coords.append({"PC1": dp[0], "PC2": dp[1]})
    return {"coords": coords, "percentage": np.round(pca.explained_variance_ratio_ * 100).tolist()}


@app.route('/readFileHeader', methods=["POST"])
def readFileHeader():
    goEnrichmentFile = request.files["goEnrichment"]
    columns = pd.read_csv(StringIO(goEnrichmentFile.stream.read().decode("UTF8"), newline=None), sep='\t', index_col=0,
                          nrows=0).columns.tolist()
    return json.dumps(columns)


@app.route('/correlation', methods=["POST"])
def correlation():
    """ returns numerical matrix
    performs correlation of GO terms
    """
    data = request.json["data"]
    df = pd.DataFrame(data)
    df.drop(["goTerm"], axis=1)
    corrMatrix = df.corr()
    return corrMatrix.to_json(orient="values")


@app.route("/MultiSpeciesREVIGO", methods=["POST"])
def MultiSpeciesREVIGO():
    """ returns dict
    performs clustering with multiple backgrounds
    """
    backgroundFiles = request.files.getlist("backgrounds[]")
    geneListFiles = request.files.getlist("geneLists[]")
    conditions = request.form.getlist("conditions[]")
    backgroundMap = request.form.getlist("backgroundMap[]")
    propagateBackground = request.form["propagateBackground"]
    backgroundAnno = dict()
    # read background for each background file
    for index, file in enumerate(backgroundFiles):
        backgroundAnno[file.filename] = readBackground(file)
    # print(backgroundAnno)
    enrichmentResults = dict((el, dict()) for el in ontologies)
    # for each file perform GOEA
    genesDFs = []
    go2genes = dict()
    goSetSize = dict()
    hasFC = False
    for index, file in enumerate(geneListFiles):
        genesDF = pd.read_csv(StringIO(file.stream.read().decode("utf-8"), newline=None), sep='\t', index_col=0,
                              header=None)
        if len(genesDF.columns) > 0:
            genesDF.columns = [index]
            genesDFs.append(genesDF)
            hasFC = True
        else:
            genesDF[index] = True
            genesDFs.append(genesDF)

        # print("------",str(index),"------")
        result = GOEA(genesDF.index.tolist(), backgroundAnno[backgroundMap[index]],propagateBackground=="true")
        # print(result)

        for ont in ontologies:
            if index == 0:
                for i, term in enumerate(result[ont][:, 0]):
                    if result[ont][i, 2] == request.form["direction"]:
                        enrichmentResults[ont][term] = [result[ont][i, 1]]
                        if not (term in go2genes):
                            go2genes[term] = set()
                            goSetSize[term] = result[ont][i, 3]
                        go2genes[term].update(result[ont][i, 4])
            else:
                for term in enrichmentResults[ont]:
                    if term in result[ont][:, 0]:
                        termIndex = result[ont][:, 0].tolist().index(term)
                        if result[ont][termIndex, 2] == request.form["direction"]:
                            enrichmentResults[ont][term].append(result[ont][termIndex, 1])
                            if not (term in go2genes):
                                go2genes[term] = set()
                                goSetSize[term] = result[ont][termIndex, 3]
                            go2genes[term].update(result[ont][termIndex, 4])
                        else:
                            enrichmentResults[ont][term].append(1)
                    else:
                        enrichmentResults[ont][term].append(1)
                for i, term in enumerate(result[ont][:, 0]):
                    if result[ont][i, 2] == request.form["direction"]:
                        if not (term in go2genes):
                            go2genes[term] = set()
                            goSetSize[term] = result[ont][i, 3]
                        go2genes[term].update(result[ont][i, 4])
                        if term not in enrichmentResults[ont]:
                            enrichmentResults[ont][term] = np.full(shape=index, fill_value=1, dtype=np.float64).tolist()
                            enrichmentResults[ont][term].append(result[ont][:, 1][i])
    # print(enrichmentResults)
    multiGOresults = dict()
    genes = pd.concat(genesDFs, axis=1)
    genes = genes.fillna(False).T.to_dict(orient="list")
    for ont in ontologies:
        enrichmentDF = pd.DataFrame(enrichmentResults[ont]).T.astype("float64")
        enrichmentDF.columns = conditions
        if len(enrichmentDF) > 0:
            background = dict()
            # merge backgrounds for the different species
            for key in backgroundAnno:
                background.update(backgroundAnno[key].get_id2gos(ont))
            multiGOresults[ont] = MultiGO(enrichmentDF, background, request.form["method"])
            for go in multiGOresults[ont]["data"]:
                multiGOresults[ont]["data"][go]["Genes"] = list(go2genes[go])
    tableColumns = ["termID", "description", "frequency", "uniqueness", "dispensability"] + conditions + ["Genes"]
    return simplejson.dumps(
        {"results": multiGOresults, "geneValues": genes, "hasFC": hasFC, "goSetSize": goSetSize,
         "conditions": conditions, "tableColumns": tableColumns}, ignore_nan=True)


@app.route("/GoListsMultiREVIGO", methods=["POST"])
def GoListsMultiREVIGO():
    """ returns dict
    performs clustering for GO terms with associated p-values
    """
    backgroundFiles = request.files.getlist("backgrounds[]")
    goEnrichmentFile = request.files["goEnrichment"]
    geneListFiles = request.files.getlist("geneLists[]")
    propagateBackground = request.form["propagateBackground"]
    hasGenes = len(geneListFiles) > 0
    genes = {}
    hasFC = False
    if hasGenes:
        genesDFs = []
        for index, file in enumerate(geneListFiles):
            genesDF = pd.read_csv(StringIO(file.stream.read().decode("utf-8")
                                           , newline=None)
                                  , sep='\t', index_col=0,
                                  header=None)
            if len(genesDF.columns) > 0:
                genesDF.columns = [index]
                genesDFs.append(genesDF)
                hasFC = True
            else:
                genesDF[index] = True
                genesDFs.append(genesDF)
        genes = pd.concat(genesDFs, axis=1)
        genes = genes.fillna(False).T.to_dict(orient="list")
    backgroundAnno = dict()
    # read background for each background file
    for index, file in enumerate(backgroundFiles):
        backgroundAnno[file.filename] = readBackground(file)
    goEnrichment = pd.read_csv(StringIO(goEnrichmentFile.stream.read().decode("UTF8"), newline=None), sep='\t',
                               index_col=0)
    multiGOresults = dict()
    conditions = []
    goSetSize = {}
    for go in goEnrichment.index.tolist():
        goSetSize[go] = 0
    for ont in ontologies:
        filteredDAG = [d for d in godag if NAMESPACE2NS[godag[d].namespace] == ont]
        enrichmentDF = goEnrichment[goEnrichment.index.isin(filteredDAG)]
        if len(enrichmentDF) > 0:
            go2genes = {}
            for go in goEnrichment.index.tolist():
                go2genes[go] = set()
            background = dict()
            for key in backgroundAnno:
                background_ont = backgroundAnno[key].get_id2gos(ont)
                if propagateBackground=="true":
                    update_association(background_ont, godag, None)
                background.update(background_ont)
                # print(background_ont)
            for gene in background:
                for term in background[gene]:
                    if term in goEnrichment.index.tolist():
                        if gene in genes:
                            go2genes[term].add(gene)
                        goSetSize[term] += 1
            multiGOresults[ont] = MultiGO(enrichmentDF, background, request.form["method"])
            for go in multiGOresults[ont]["data"]:
                multiGOresults[ont]["data"][go]["Genes"] = list(go2genes[go])
        conditions = enrichmentDF.columns.values.tolist()
    tableColumns = ["termID", "description", "frequency", "uniqueness", "dispensability"] + conditions
    if hasGenes:
        tableColumns.append("Genes")
    return {"results": multiGOresults, "conditions": conditions, "geneValues": genes, "hasFC": hasFC
        , "goSetSize": goSetSize, "tableColumns": tableColumns}


@app.route("/exampleBackground", methods=["GET"])
def getExampleBackground():
    """ returns example background as string
    """
    background = os.path.join(here, "data/scoelicolor.txt")
    return send_file(background)


@app.route("/exampleCondition", methods=["GET"])
def getCondition():
    """ returns example condition as string
    """
    filename = request.args.get("name")
    condition = os.path.join(here, "data/scoelicolor/", filename)
    return send_file(condition)


@app.route('/')
def index():
    return app.send_static_file('index.html')


if __name__ == "__main__":
    app.run()

"""
ideas to speed up:
- precompute frequencies
- precompute parents
"""
