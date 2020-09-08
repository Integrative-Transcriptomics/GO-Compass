from flask import Flask
from flask import jsonify
from flask import request
from io import StringIO

from goatools.obo_parser import GODag
from goatools.anno.factory import get_objanno
from goatools.semantic import TermCounts, resnik_sim, lin_sim, semantic_similarity
from goatools.gosubdag.gosubdag import GoSubDag
from goatools.godag.go_tasks import get_go2parents
from goatools.goea.go_enrichment_ns import GOEnrichmentStudyNS

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
parents = get_go2parents(godag, optional_relationships)

def MultiGO(goEnrichment, objanno, ontology, method):
    background = objanno.get_id2gos(namespace=ontology)
    goEnrichment.sort_index(inplace= True)
    mask = goEnrichment[goEnrichment < float(request.form['pvalueFilter'])].isnull().all(axis=1)
    goEnrichment = goEnrichment[mask == False]
    goTerms = goEnrichment.index.values
    matrix = np.array(createMatrix(goTerms, background, method))
    matrix[matrix == None] = 0
    return(iterateMatrix(matrix, goTerms, goEnrichment, flattenBackground(background)))

def createMatrix(goTerms, background, method):
    termcounts = TermCounts(godag, background)
    matrix=list()
    # only create half of matrix, fill rest with -inf
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
    maxDiff = (max - min)*0.05
    frequencies = dict(Counter(background[1]))
    frequencies = {k: v / numGenes for k, v in frequencies.items()}
    avgs = dict()
    for index, term in enumerate(goTerms):
        col = matrix[:,index]
        row = matrix[index,:]
        col = col[col != -1]
        row = row[row != -1]
        avgs[term] = (col.sum() + row.sum())/(len(goTerms)-1)
    tree = dict()
    tree2 = dict()
    goList = dict()
    while(len(goTerms)) > 0:
        maxValue = np.amax(np.ravel(matrix))
        indices = np.where(matrix == maxValue)
        indices = list(zip(indices[0], indices[1]))[0]
        termA = goTerms[indices[0]]
        termB = goTerms[indices[1]]
        delete = testGoTerms(termA, termB, goEnrichment, background, frequencies, maxDiff)
        toDelete=delete["term"]
        if toDelete == termA:
            deleteIndex = indices[0]
            toKeep = termB
        else:
            deleteIndex = indices[1]
            toKeep = termA

        if toKeep != toDelete:
            if toDelete in tree2:
                if toKeep in tree2:
                    tree2[toKeep][toDelete] = tree2[toDelete]
                else:
                    tree2[toKeep] = tree2[toDelete]
            else:
                if toKeep in tree2:
                    tree2[toKeep][toDelete] = toDelete
                else:
                    tree2[toKeep] = {toDelete: toDelete}
            tree2.pop(toDelete, None)

        if toKeep != toDelete:
            if toDelete in tree:
                if toKeep in tree:
                    tree[toKeep] = {toKeep: tree[toKeep], toDelete: tree[toDelete]}
                else:
                    tree[toKeep] = {toDelete: tree[toDelete],toKeep: toKeep}
            else:
                if toKeep in tree:
                    tree[toKeep] = {toKeep: tree[toKeep], toDelete: toDelete}
                else:
                    tree[toKeep] = [toKeep, toDelete]
            tree.pop(toDelete, None)
        else:
            maxValue = 0
        goList[toDelete] ={
            "termID": toDelete,
            "description": godag[toDelete].name,
            "frequency": calculateFrequency(toDelete, frequencies),
            "rejection": delete["rejection"],
            "uniqueness": 1- avgs[toDelete],
            "dispensability": maxValue,
            "pvalues": np.negative(np.log10(goEnrichment.loc[toDelete,:].values)).tolist()
        }
        goTerms = np.delete(goTerms, deleteIndex)
        matrix = np.delete(matrix, deleteIndex, 0)
        matrix = np.delete(matrix, deleteIndex, 1)
    return {"tree": tree, "data": goList, "conditions": list(goEnrichment.columns), "tree2": tree2}

def testGoTerms(termA, termB, goEnrichment, background, goCounts, maxDiff):
    #frequency check
    frequencyA=calculateFrequency(termA, goCounts)
    frequencyB=calculateFrequency(termB, goCounts)
    if frequencyA > 0.05:
        if frequencyB > 0.05:
            if frequencyB > frequencyA:
                return {"rejection": "frequency" + termA, "term": termB}
                #return termB
            else:
                return {"rejection": "frequency" + termB, "term": termA}
                #return termA
        else:
            return {"rejection": "frequency" + termB, "term": termA}
            #return termA
    else:
        if frequencyB > 0.05:
            return {"rejection": "frequency" + termA, "term": termB}
            #return termB
        # p-value reject
        else:
            pvaluesA = np.array(goEnrichment.loc[termA,:].values.tolist())
            pvaluesB = np.array(goEnrichment.loc[termB,:].values.tolist())
            filterMask = (abs(pvaluesA -  pvaluesB)*(1- np.minimum(pvaluesA, pvaluesB)))>maxDiff
            filteredPvaluesA = pvaluesA[filterMask]
            filteredPvaluesB = pvaluesB[filterMask]
            if len(np.where(filteredPvaluesA < filteredPvaluesB)[0])< len(np.where(filteredPvaluesA > filteredPvaluesB)[0]):
                return {"rejection": "pval" + termB, "term": termA}
                #return termA
            else:
                if len(np.where(filteredPvaluesA < filteredPvaluesB)[0])> len(np.where(filteredPvaluesA > filteredPvaluesB)[0]):
                    return {"rejection": "pval" + termA, "term": termB}
                    #return termB
                # parent reject
                else:
                    parentsA = parents[termA]
                    parentsB = parents[termB]
                    genesA = getAssociatedGenes(termA, background)
                    genesB = getAssociatedGenes(termB, background)
                    intersection = np.intersect1d(genesA,genesB)
                    if termB in parentsA:
                        if len(genesB) * 0.75 < len(intersection):
                            return {"rejection": "parent" + termA, "term": termB}
                            #return termB
                        else:
                            return {"rejection": "child" + termB, "term": termA}
                            #return termA
                    else:
                        if termA in parentsB:
                            if len(genesA) * 0.75 < len(intersection):
                                return {"rejection": "parent" + termB, "term": termA}
                                #return termA
                            else:
                                return {"rejection": "child" + termA, "term": termB}
                                #return termB
                        # pseudo random reject
                        else:
                            seed = int(termA[3:-1])
                            random.seed(seed)
                            if bool(random.getrandbits(1)):
                                return {"rejection": "random" + termB, "term": termA}
                                #return termA
                            else:
                                return {"rejection": "random" + termA, "term": termB}
                                #return termB

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
    filteredBackground = npBackground[:,npBackground[1] == term]
    if len(filteredBackground) > 0:
        associatedGenes = filteredBackground[0,:]
    return associatedGenes

def readBackground(backgroundFile,ontology):
    helperFileName= uuid.uuid1().hex + ".txt"
    helperFile= open(helperFileName, "a")
    helperFile.write(StringIO(backgroundFile.stream.read().decode("UTF8"), newline=None).read())
    helperFile.close()
    objanno = get_objanno(helperFileName, 'id2gos', godag=godag)
    os.remove(helperFileName)
    return(objanno)

def flattenBackground(background):
    genes = list()
    terms = list()
    for gene in background:
        for term in background[gene]:
            terms.append(term)
            genes.append(gene)
    return [genes, terms]

def GOEA(genes, objanno, ontology):
    goeaobj = GOEnrichmentStudyNS(
            objanno.get_id2gos().keys(), # List of mouse protein-coding genes
            objanno.get_ns2assc(), # geneid/GO associations
            godag, # Ontologies
            propagate_counts = True,
            alpha = 0.05, # default significance cut-off
            methods = ['fdr_bh']) # defult multipletest correction method
    goea_quiet_all = goeaobj.run_study(genes, prt=None)
    goea_results = list()
    for r in goea_quiet_all:
        if r.NS== ontology:
            goea_results.append([r.GO, r.p_fdr_bh])
    goea_results = np.array(goea_results)
    goea_results = goea_results[goea_results[:,0].argsort()]
    return goea_results


@app.route('/pca', methods=["POST"])
def pca():
    data = request.json["data"]
    pvalues= list()
    for key in data:
        if key != "goTerm":
            pvalues.append(data[key])
    pca = PCA(n_components=2)
    pca.fit(pvalues)
    X_pca = pca.fit_transform(pvalues)
    coords = list()
    for dp in X_pca:
        coords.append({"PC1": dp[0], "PC2": dp[1]})
    return {"coords": coords, "percentage": np.round(pca.explained_variance_ratio_*100).tolist()}

@app.route('/correlation', methods=["POST"])
def correlation():
    data = request.json["data"]
    df=pd.DataFrame(data)
    df.drop(["goTerm"], axis=1)
    corrMatrix = df.corr()
    return corrMatrix.to_json(orient="values")

@app.route("/GeneListsMultiREVIGO", methods=["POST"])
def GeneListsMultiREVIGO():
    backgroundFile = request.files["background"]
    geneListFiles = request.files.getlist("geneLists[]")
    ontology = request.form["ontology"]
    conditions = request.form.getlist("conditions[]")
    objanno = readBackground(backgroundFile, ontology)
    enrichmentResults=dict()
    enrichedTerms = list()
    for index, file in enumerate(geneListFiles):
        geneList=file.stream.read().decode("utf-8").splitlines()
        enrichmentResult = GOEA(geneList, objanno, ontology)
        enrichmentResults[conditions[index]] = enrichmentResult[:,1].astype(np.float64).tolist()
        if index == 0:
            enrichedTerms = enrichmentResult[:,0]
    enrichmentDF = pd.DataFrame(enrichmentResults)
    enrichmentDF.index = enrichedTerms
    return MultiGO(enrichmentDF,objanno, ontology, request.form["method"])

@app.route("/GoListsMultiREVIGO", methods=["POST"])
def GoListsMultiREVIGO():
    backgroundFile = request.files["background"]
    ontology = request.form["ontology"]
    objanno = readBackground(backgroundFile, ontology)
    goEnrichmentFile = request.files["goEnrichment"]
    goEnrichment = pd.read_csv(StringIO(goEnrichmentFile.stream.read().decode("UTF8"), newline=None), sep='\t', index_col =0)
    return MultiGO(goEnrichment,objanno, ontology, request.form["method"])

"""
ideas to speed up:
- precompute frequencies
- precompute parents
"""