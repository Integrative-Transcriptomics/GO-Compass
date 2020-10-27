from flask import Flask
from flask import request
from io import StringIO

from goatools.obo_parser import GODag
from goatools.anno.factory import get_objanno
from goatools.semantic import TermCounts, resnik_sim, lin_sim, semantic_similarity
from goatools.godag.go_tasks import get_go2parents
from goatools.goea.go_enrichment_ns import GOEnrichmentStudyNS
from goatools.godag.consts import NAMESPACE2NS

from findDescendants import getDescendants
from sklearn.decomposition import PCA

import numpy as np
import pandas as pd
import uuid
import os
import random
from collections import Counter

app = Flask(__name__)

godag = GODag("go-basic.obo")
optional_relationships = set()
ontologies = ["MF", "BP", "CC"]
parents = get_go2parents(godag, optional_relationships)


def MultiGO(goEnrichment, background, method):
    goEnrichment.sort_index(inplace=True)
    mask = goEnrichment[goEnrichment < float(request.form['pvalueFilter'])].isnull().all(axis=1)
    goEnrichment = goEnrichment[mask == False]
    goEnrichment = goEnrichment[goEnrichment.index.isin(godag.keys())]
    goTerms = goEnrichment.index.values
    matrix = np.array(createMatrix(goTerms, background, method), dtype=float)
    matrix = np.nan_to_num(matrix)
    return iterateMatrix(matrix, goTerms, goEnrichment, flattenBackground(background))


def createMatrix(goTerms, background, method):
    termcounts = TermCounts(godag, background)
    matrix = list()
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
                else:
                    sim = semantic_similarity(termA, termB, godag)
            row.append(sim)
            j += 1
        matrix.append(row)
        i += 1
    return matrix


def iterateMatrix(matrix, goTerms, goEnrichment, background):
    numGenes = len(list(dict.fromkeys(background[0])))
    max = goEnrichment.max().max()
    min = goEnrichment.min().min()
    maxDiff = (max - min) * 0.05
    frequencies = dict(Counter(background[1]))
    frequencies = {k: v / numGenes for k, v in frequencies.items()}
    avgs = dict()
    for index, term in enumerate(goTerms):
        col = matrix[:, index]
        row = matrix[index, :]
        col = col[col != -1]
        row = row[row != -1]
        avgs[term] = (col.sum() + row.sum()) / (len(goTerms) - 1)
    tree = dict()
    goList = dict()
    while len(goTerms) > 0:
        maxValue = np.amax(np.ravel(matrix))
        indices = np.where(matrix == maxValue)
        indices = list(zip(indices[0], indices[1]))[0]
        termA = goTerms[indices[0]]
        termB = goTerms[indices[1]]
        delete = testGoTerms(termA, termB, goEnrichment, background, frequencies, maxDiff)
        toDelete = delete["term"]
        if toDelete == termA:
            deleteIndex = indices[0]
            toKeep = termB
        else:
            deleteIndex = indices[1]
            toKeep = termA

        if toKeep != toDelete:
            if toDelete in tree:
                if toKeep in tree:
                    tree[toKeep][toDelete] = tree[toDelete]
                else:
                    tree[toKeep] = tree[toDelete]
            else:
                if toKeep in tree:
                    tree[toKeep][toDelete] = toDelete
                else:
                    tree[toKeep] = {toDelete: toDelete}
            tree.pop(toDelete, None)
        else:
            maxValue = 0
        goList[toDelete] = {
            "termID": toDelete,
            "description": godag[toDelete].name,
            "frequency": calculateFrequency(toDelete, frequencies),
            "rejection": delete["rejection"],
            "uniqueness": 1 - avgs[toDelete],
            "dispensability": maxValue,
            "pvalues": np.negative(np.log10(goEnrichment.loc[toDelete, :].values)).tolist()
        }
        goTerms = np.delete(goTerms, deleteIndex)
        matrix = np.delete(matrix, deleteIndex, 0)
        matrix = np.delete(matrix, deleteIndex, 1)
    return {"tree": tree, "data": goList}


def testGoTerms(termA, termB, goEnrichment, background, goCounts, maxDiff):
    # frequency check
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
        # p-value reject
        else:
            pvaluesA = np.array(goEnrichment.loc[termA, :].values.tolist())
            pvaluesB = np.array(goEnrichment.loc[termB, :].values.tolist())
            filterMask = (abs(pvaluesA - pvaluesB) * (1 - np.minimum(pvaluesA, pvaluesB))) > maxDiff
            filteredPvaluesA = pvaluesA[filterMask]
            filteredPvaluesB = pvaluesB[filterMask]
            if len(np.where(filteredPvaluesA < filteredPvaluesB)[0]) < len(
                    np.where(filteredPvaluesA > filteredPvaluesB)[0]):
                return {"rejection": "pval" + termB, "term": termA}
                # return termA
            else:
                if len(np.where(filteredPvaluesA < filteredPvaluesB)[0]) > len(
                        np.where(filteredPvaluesA > filteredPvaluesB)[0]):
                    return {"rejection": "pval" + termA, "term": termB}
                    # return termB
                # parent reject
                else:
                    parentsA = parents[termA]
                    parentsB = parents[termB]
                    genesA = getAssociatedGenes(termA, background)
                    genesB = getAssociatedGenes(termB, background)
                    intersection = np.intersect1d(genesA, genesB)
                    if termB in parentsA:
                        if len(genesB) * 0.75 < len(intersection):
                            return {"rejection": "parent" + termA, "term": termB}
                            # return termB
                        else:
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


def calculateFrequency(term, frequencies):
    descendants = getDescendants(term)
    frequency = 0
    for descendant in descendants:
        if descendant in frequencies:
            frequency = frequency + frequencies[descendant]
    if term in frequencies:
        frequency = frequency + frequencies[term]
    return frequency


def getAssociatedGenes(term, background):
    npBackground = np.array(background)
    associatedGenes = list()
    filteredBackground = npBackground[:, npBackground[1] == term]
    if len(filteredBackground) > 0:
        associatedGenes = filteredBackground[0, :]
    return associatedGenes


def readBackground(backgroundFile):
    helperFileName = uuid.uuid1().hex + ".txt"
    helperFile = open(helperFileName, "a")
    helperFile.write(StringIO(backgroundFile.stream.read().decode("UTF8"), newline=None).read())
    helperFile.close()
    objanno = get_objanno(helperFileName, 'id2gos', godag=godag)
    os.remove(helperFileName)
    return (objanno)


def flattenBackground(background):
    genes = list()
    terms = list()
    for gene in background:
        for term in background[gene]:
            terms.append(term)
            genes.append(gene)
    return [genes, terms]


def GOEA(genes, objanno):
    goeaobj = GOEnrichmentStudyNS(
        objanno.get_id2gos().keys(),  # List of mouse protein-coding genes
        objanno.get_ns2assc(),  # geneid/GO associations
        godag,  # Ontologies
        propagate_counts=True,
        alpha=0.05,  # default significance cut-off
        methods=['fdr_bh'])  # defult multipletest correction method
    goea_quiet_all = goeaobj.run_study(genes, prt=None)
    goea_results = dict((el, []) for el in ontologies)
    for r in goea_quiet_all:
        goea_results[r.NS].append([r.GO, r.p_fdr_bh])
    for ont in goea_results:
        goea_results[ont] = np.array(goea_results[ont])
        goea_results[ont] = goea_results[ont][goea_results[ont][:, 0].argsort()]
    return goea_results


@app.route('/pca', methods=["POST"])
def pca():
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


@app.route('/correlation', methods=["POST"])
def correlation():
    data = request.json["data"]
    df = pd.DataFrame(data)
    df.drop(["goTerm"], axis=1)
    corrMatrix = df.corr()
    return corrMatrix.to_json(orient="values")


@app.route("/MultiSpeciesREVIGO", methods=["POST"])
def MultiSpeciesREVIGO():
    backgroundFiles = request.files.getlist("backgrounds[]")
    geneListFiles = request.files.getlist("geneLists[]")
    conditions = request.form.getlist("conditions[]")
    backgroundMap = request.form.getlist("backgroundMap[]")
    backgroundAnno = dict()
    for index, file in enumerate(backgroundFiles):
        backgroundAnno[file.filename] = readBackground(file)
    enrichmentResults = dict((el, dict()) for el in ontologies)
    enrichedTerms = list()
    for index, file in enumerate(geneListFiles):
        geneList = file.stream.read().decode("utf-8").splitlines()
        result = GOEA(geneList, backgroundAnno[backgroundMap[index]])
        for ont in ontologies:
            if index == 0:
                for i, term in enumerate(result[ont][:, 0]):
                    enrichmentResults[ont][term] = [result[ont][i, 1]]
            else:
                for term in enrichmentResults[ont]:
                    if term in result[ont][:, 0]:
                        termIndex = result[ont][:, 0].tolist().index(term)
                        enrichmentResults[ont][term].append(result[ont][termIndex, 1])
                    else:
                        enrichmentResults[ont][term].append(1)
                for i, term in enumerate(result[ont][:, 0]):
                    if term not in enrichmentResults[ont]:
                        enrichmentResults[ont][term] = np.full(shape=index, fill_value=1, dtype=np.float64).tolist()
                        enrichmentResults[ont][term].append(result[ont][:, 1][i])
    print(enrichmentResults)
    multiGOresults = dict()
    for ont in ontologies:
        enrichmentDF = pd.DataFrame(enrichmentResults[ont]).T.astype("float64")
        enrichmentDF.columns = conditions
        if len(enrichmentDF) > 0:
            background = dict()
            for key in backgroundAnno:
                background.update(backgroundAnno[key].get_id2gos(ont))
            multiGOresults[ont] = MultiGO(enrichmentDF, background, request.form["method"])
    return {"results": multiGOresults, "conditions": conditions,
            "tableColumns": ["termID", "description", "frequency", "rejection", "uniqueness",
                             "dispensability"] + conditions}


@app.route("/GeneListsMultiREVIGO", methods=["POST"])
def GeneListsMultiREVIGO():
    backgroundFile = request.files["background"]
    geneListFiles = request.files.getlist("geneLists[]")
    conditions = request.form.getlist("conditions[]")
    objanno = readBackground(backgroundFile)
    enrichmentResults = dict((el, dict()) for el in ontologies)
    enrichedTerms = dict((el, []) for el in ontologies)
    for index, file in enumerate(geneListFiles):
        geneList = file.stream.read().decode("utf-8").splitlines()
        enrichmentResult = GOEA(geneList, objanno)
        for ont in ontologies:
            enrichmentResults[ont][conditions[index]] = enrichmentResult[ont][:, 1].astype(np.float64).tolist()
            if index == 0:
                enrichedTerms[ont] = enrichmentResult[ont][:, 0]
    multiGOresults = dict()
    for ont in ontologies:
        enrichmentDF = pd.DataFrame(enrichmentResults[ont])
        enrichmentDF.index = enrichedTerms[ont]
        if len(enrichmentDF) > 0:
            background = objanno.get_id2gos(namespace=ont)
            multiGOresults[ont] = MultiGO(enrichmentDF, background, request.form["method"])
    return {"results": multiGOresults, "conditions": conditions,
            "tableColumns": ["termID", "description", "frequency", "rejection", "uniqueness",
                             "dispensability"] + conditions}


@app.route("/GoListsMultiREVIGO", methods=["POST"])
def GoListsMultiREVIGO():
    backgroundFile = request.files["background"]
    goEnrichmentFile = request.files["goEnrichment"]
    objanno = readBackground(backgroundFile)
    goEnrichment = pd.read_csv(StringIO(goEnrichmentFile.stream.read().decode("UTF8"), newline=None), sep='\t',
                               index_col=0)
    multiGOresults = dict()
    conditions = []
    for ont in ontologies:
        filteredDAG = [d for d in godag if NAMESPACE2NS[godag[d].namespace] == ont]
        enrichmentDF = goEnrichment[goEnrichment.index.isin(filteredDAG)]
        if len(enrichmentDF) > 0:
            background = objanno.get_id2gos(namespace=ont)
            multiGOresults[ont] = MultiGO(enrichmentDF, background, request.form["method"])
        conditions = enrichmentDF.columns.values.tolist()
    return {"results": multiGOresults, "conditions": conditions,
            "tableColumns": ["termID", "description", "frequency", "rejection", "uniqueness",
                             "dispensability"] + conditions}


"""
ideas to speed up:
- precompute frequencies
- precompute parents
"""
