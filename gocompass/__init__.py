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


def MultiGO(goEnrichment, background, method, pvalue_filter):
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
    mask = goEnrichment[goEnrichment < pvalue_filter].isnull().all(axis=1)
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
    # print(termA, frequencyA)
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


def readBackground(backgroundFile, is_local):
    """ return a dictionary

    Keyword arguments:
    backgroundFile -- background as string
    reads background file
    """
    # helper file needs to be created since GOAtools method is only able to read files
    helperFile = tempfile.NamedTemporaryFile()
    if not is_local:
        helperFile.write(backgroundFile.stream.read())
    else:
        helperFile.write(backgroundFile.read())
    objanno = get_objanno(helperFile.name, 'id2gos', godag=godag)
    helperFile.close()
    return objanno


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
    goea_results = []
    for r in goea_quiet_all:
        direction = "+"
        if r.enrichment == "p":
            direction = "-"
        goea_results.append([r.GO, r.p_fdr_bh, direction, r.pop_count, r.study_items])
    goea_results = np.array(goea_results)
    goea_results = goea_results[goea_results[:, 0].argsort()]
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


@app.route("/MultiREVIGO", methods=["POST"])
def multi_revigo():
    background_files = request.files.getlist("backgrounds[]")
    gene_list_files = request.files.getlist("geneLists[]")
    background_map = request.form.getlist("backgroundMap[]")
    propagate_background = request.form["propagateBackground"] == "true"
    direction = request.form["direction"]
    method = request.form["method"]
    pvalue_filter = float(request.form['pvalueFilter'])
    background_anno = process_backgrounds(background_files, propagate_background, False)
    gene_lists = create_genes_dfs(gene_list_files, False)
    if "goEnrichment" in request.form:
        go_enrichment = request.form["goEnrichment"]
        return go_list_revigo(go_enrichment.stream, background_anno, gene_lists, method, pvalue_filter)
    else:
        conditions = request.form.getlist("conditions[]")
        return gene_list_revigo(background_anno, gene_lists, conditions, background_map, direction, method,
                                pvalue_filter)


def process_backgrounds(background_files, propagate_background, is_local):
    background_anno = dict()
    if not propagate_background:
        if not is_local:
            for index, file in enumerate(background_files):
                background_anno[file.filename] = readBackground(file, is_local)
        else:
            for index, file in enumerate(background_files):
                background_anno[os.path.basename(file.name)] = readBackground(file, is_local)
    else:
        for index, file in enumerate(background_files):
            if not is_local:
                objanno = readBackground(file, is_local)
            else:
                objanno = readBackground(file, is_local)
            background_semi_separated = {}
            background = {}
            for ont in ontologies:
                background_id2go = objanno.get_id2gos(ont)
                update_association(background_id2go, godag, None)
                for id in background_id2go:
                    if id in background:
                        background[id].update(background_id2go[id])
                    else:
                        background[id] = background_id2go[id]
            for id in background:
                background_semi_separated[id] = ";".join(background[id])
            background_df = pd.DataFrame.from_dict(background_semi_separated, orient="index")
            background_file = tempfile.NamedTemporaryFile()
            background_df.to_csv(background_file.name, sep="\t")
            background_anno[os.path.basename(file.name)] = get_objanno(background_file.name, 'id2gos', godag=godag)
            background_file.close()
    return background_anno


def create_genes_dfs(gene_list_files, is_local):
    genes_dfs = []
    for index, file in enumerate(gene_list_files):
        # print(type(file))
        if not is_local:
            genes_df = pd.read_csv(StringIO(file.stream.read().decode("utf-8"), newline=None), sep='\t', index_col=0,
                                   header=None)
        else:
            genes_df = pd.read_csv(StringIO(file.read().decode("utf-8"), newline=None), sep='\t', index_col=0,
                                   header=None)
        if len(genes_df.columns) > 0:
            genes_df.columns = [index]
            genes_dfs.append(genes_df)
        else:
            genes_df[index] = True
            genes_dfs.append(genes_df)
    return genes_dfs


def perform_enrichment(background, background_map, gene_lists, conditions, direction):
    enrichment_results = {}
    # for each file perform GOEA
    for index, list in enumerate(gene_lists):

        # print("------",str(index),"------")
        result = GOEA(list.index.tolist(), background[background_map[index]], False)
        # print(result)
        if index == 0:
            for i, term in enumerate(result[:, 0]):
                if result[i, 2] == direction:
                    enrichment_results[term] = [result[i, 1]]
        else:
            for term in enrichment_results:
                if term in result[:, 0]:
                    term_index = result[:, 0].tolist().index(term)
                    if result[term_index, 2] == direction:
                        enrichment_results[term].append(result[term_index, 1])
                    else:
                        enrichment_results[term].append(1)
                else:
                    enrichment_results[term].append(1)
            for i, term in enumerate(result[:, 0]):
                if result[i, 2] == direction:
                    if term not in enrichment_results:
                        enrichment_results[term] = np.full(shape=index, fill_value=1,
                                                           dtype=np.float64).tolist()
                        enrichment_results[term].append(result[:, 1][i])
    enrichment_df = pd.DataFrame(enrichment_results).T.astype("float64")
    enrichment_df.columns = conditions
    return enrichment_df


def perform_revigo(background_anno, go_enrichment, gene_lists, method, pvalue_filter):
    """ returns dict
           performs clustering for GO terms with associated p-values
           """
    has_genes = len(gene_lists) > 0
    genes = {}
    has_fc = False
    if has_genes:
        genes_dfs = []
        for index, genes_df in enumerate(gene_lists):
            # print(file.name)
            if len(genes_df.columns) > 0:
                genes_df.columns = [index]
                genes_dfs.append(genes_df)
                has_fc = True
            else:
                genes_df[index] = True
                genes_dfs.append(genes_df)
        genes = pd.concat(genes_dfs, axis=1)
        genes = genes.fillna(False).T.to_dict(orient="list")
    multi_go_results = dict()
    conditions = []
    go_set_size = {}
    for go in go_enrichment.index.tolist():
        go_set_size[go] = 0
    for ont in ontologies:
        filtered_dag = [d for d in godag if NAMESPACE2NS[godag[d].namespace] == ont]
        enrichment_df = go_enrichment[go_enrichment.index.isin(filtered_dag)]
        if len(enrichment_df) > 0:
            go2genes = {}
            for go in go_enrichment.index.tolist():
                go2genes[go] = set()
            background = {}
            for key in background_anno:
                background_ont = background_anno[key].get_id2gos(ont)
                background.update(background_ont)
            for gene in background:
                for term in background[gene]:
                    if term in go_enrichment.index.tolist():
                        if gene in genes:
                            go2genes[term].add(gene)
                        go_set_size[term] += 1
            multi_go_results[ont] = MultiGO(enrichment_df, background, method, pvalue_filter)
            for go in multi_go_results[ont]["data"]:
                multi_go_results[ont]["data"][go]["Genes"] = list(go2genes[go])
        conditions = enrichment_df.columns.values.tolist()
    table_columns = ["termID", "description", "frequency", "uniqueness", "dispensability"] + conditions
    if has_genes:
        table_columns.append("Genes")
    return {"results": multi_go_results, "conditions": conditions, "geneValues": genes, "hasFC": has_fc
        , "goSetSize": go_set_size, "tableColumns": table_columns}


def gene_list_revigo(background_anno, gene_list_files, conditions, background_map, direction, method, pvalue_filter):
    go_enrichment = perform_enrichment(background_anno, background_map, gene_list_files, conditions, direction)
    return perform_revigo(background_anno, go_enrichment, gene_list_files, method, pvalue_filter)


def go_list_revigo(go_enrichment_file, background_anno, gene_list_files, method, pvalue_filter):
    """ returns dict
        performs clustering for GO terms with associated p-values
        """
    go_enrichment = pd.read_csv(StringIO(go_enrichment_file.read().decode("UTF8"), newline=None), sep='\t',
                                index_col=0)
    return perform_revigo(background_anno, go_enrichment, gene_list_files, method, pvalue_filter)


@app.route("/load_mus_musculus", methods=["GET"])
def load_mus_musculus():
    folder = os.path.join(here, "data", "MusMusculus")
    background_files = [open(os.path.join(folder, "BackgroundMusMusculus.txt"), "rb")]
    go_enrichment_file = open(os.path.join(folder, "GO_enrichment_results.tsv"), "rb")
    gene_list_files = [open(os.path.join(folder, "D8vsD0.txt"), "rb"),
                       open(os.path.join(folder, "D11vsD0.txt"), "rb"),
                       open(os.path.join(folder, "D11vsD8.txt"), "rb"),
                       open(os.path.join(folder, "D18vsD0.txt"), "rb"),
                       open(os.path.join(folder, "D18vsD8.txt"), "rb")]
    pvalue_filter = 0.0005
    background_anno = process_backgrounds(background_files, True, True)
    gene_lists = create_genes_dfs(gene_list_files, True)
    return go_list_revigo(go_enrichment_file, background_anno, gene_lists, "Wang", pvalue_filter)


@app.route("/load_treponema_pallidum", methods=["GET"])
def load_treponema_pallidum():
    folder = os.path.join(here, "data", "TreponemaPallidum")
    background_files = [open(os.path.join(folder, "Background_TreponemaPallidum.csv"), "rb")]
    go_enrichment_file = open(os.path.join(folder, "GO_enrichment_results.csv"), "rb")
    gene_list_files = [open(os.path.join(folder, "SNPs_per_gene_SS14.tsv"), "rb"),
                       open(os.path.join(folder, "SNPs_per_gene_TEN.tsv"), "rb"),
                       open(os.path.join(folder, "SNPs_per_gene_TPE.tsv"), "rb")]
    pvalue_filter = 0.05
    background_anno = process_backgrounds(background_files, True, True)
    gene_lists = create_genes_dfs(gene_list_files, True)
    return go_list_revigo(go_enrichment_file, background_anno, gene_lists, "Wang", pvalue_filter)


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
