import os
import random
import json
import tempfile
from collections import Counter
from io import StringIO

import numpy as np
import pandas as pd
from flask import Flask
from flask import request
from goatools.anno.factory import get_objanno
from goatools.anno.update_association import update_association
from goatools.godag.consts import NAMESPACE2NS
from goatools.godag.go_tasks import get_go2parents
from goatools.goea.go_enrichment_ns import GOEnrichmentStudyNS
from goatools.obo_parser import GODag
from goatools.semantic import TermCounts, resnik_sim, lin_sim, semantic_similarity
from goatools.semsim.termwise.wang import SsWang

from gocompass.findDescendants import get_descendants

app = Flask(__name__, static_folder='../build', static_url_path='/')
here = os.path.dirname(__file__)

godag = GODag(os.path.join(here, "go-basic.obo"))
optional_relationships = set()
ontologies = ["MF", "BP", "CC"]
parents = get_go2parents(godag, optional_relationships)


def multi_go(go_enrichment, background, method, pvalue_filter):
    """ Return a dictionary

    Keyword arguments:
    go_enrichment -- dataframe with go terms and p-values
    background -- backgound (objanno)
    method -- semantic similarity method, either "Lin", "Resnik", "Wang" or "Edge distance"
    pvalue_filter -- only consider p-values lower than filter
    Creates semantic similarity matrix
    Performs clustering
    """
    go_enrichment.sort_index(inplace=True)

    # filter GO enrichment by p-values
    mask = go_enrichment[go_enrichment < pvalue_filter].isnull().all(axis=1)
    go_enrichment = go_enrichment[mask == False]
    go_enrichment = go_enrichment[go_enrichment.index.isin(godag.keys())]

    goTerms = go_enrichment.index.values
    matrix = np.array(create_matrix(goTerms, background, method))
    matrix[matrix == None] = 0
    return iterate_matrix(matrix, goTerms, go_enrichment, flatten_background(background))


def create_matrix(go_terms, background, method):
    """ Return a numerical matrix

    Keyword arguments:
    go_terms -- list of go terms
    background -- flattened background: lists of genes and GO Terms
    method -- semantic similarity method, either "Lin", "Resnik", "Wang" or "Edge distance"
    Creates semantic similarity matrix
    """
    termcounts = TermCounts(godag, background)
    matrix = list()
    wang_r1 = None
    if method == "Wang":
        wang_r1 = SsWang(go_terms, godag)
    # only create half of matrix, fill rest with -1
    i = 0
    for termA in go_terms:
        j = 0
        row = list()
        for termB in go_terms:
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


def iterate_matrix(matrix, go_terms, go_enrichment, background):
    """ return a dictionary

    Keyword arguments:
    matrix -- numerical matrix of semantic similarities
    go_terms -- list of goTerms
    go_enrichment -- GO enrichment result
    background -- flattened background: lists of genes and GO Terms
    iterates through semantic similarity matrix in decreasing ss order
    """
    num_genes = len(list(dict.fromkeys(background[0])))
    max = go_enrichment.max().max()
    min = go_enrichment.min().min()

    # p-values are considered similar if they have a maximum difference of 5%
    maxDiff = (max - min) * 0.05

    # frequencies of GO temrs
    frequencies = dict(Counter(background[1]))
    frequencies = {k: v / num_genes for k, v in frequencies.items()}
    avgs = dict()

    # calculate averages for each term for uniqueness value
    for index, term in enumerate(go_terms):
        col = matrix[:, index]
        row = matrix[index, :]
        col = col[col != -1]
        row = row[row != -1]
        avgs[term] = (col.sum() + row.sum()) / (len(go_terms) - 1)

    # stores tree structure
    tree = dict()
    # stores additional data for each GO term
    go_list = dict()
    if len(go_terms) == 1:
        tree[go_terms[0]] = {}
    while len(go_terms) > 0:
        max_value = np.amax(np.ravel(matrix))

        # get most similar pair of GO terms
        indices = np.where(matrix == max_value)
        indices = list(zip(indices[0], indices[1]))[0]
        term_a = go_terms[indices[0]]
        term_b = go_terms[indices[1]]

        # calculate which GO term is rejected
        delete = test_go_terms(term_a, term_b, go_enrichment, background, frequencies, maxDiff)
        to_delete = delete["term"]
        if to_delete == term_a:
            delete_index = indices[0]
            to_keep = term_b
        else:
            delete_index = indices[1]
            to_keep = term_a

        # add GO terms to current tree dict
        if to_keep != to_delete:
            if to_delete in tree:
                if to_keep in tree:
                    # if both terms are in the tree dict, it means that they form non-connected subtrees.
                    # The tree dict of the rejected term is placed as the child of the kept term
                    tree[to_keep][to_delete] = tree[to_delete]
                else:
                    # if the kept term is not in the tree dict but the rejected is,
                    # the kept term will be placed as the parent of the rejected term
                    tree[to_keep] = {}
                    tree[to_keep][to_delete] = tree[to_delete]
            else:
                if to_keep in tree:
                    # if the kept term is in the tree dict, but the rejected is not,
                    # the rejected term is added as a child of the kept term
                    tree[to_keep][to_delete] = to_delete
                else:
                    # if none of the terms are in the tree dict, a new entry is created
                    tree[to_keep] = {to_delete: to_delete}
            # not connected trees that have the rejected term as a parent are deleted
            # as the rejected term is now incorporated in the final tree dict structure
            tree.pop(to_delete, None)
        else:
            max_value = 0
        uniqueness = 1
        if len(avgs) > 0:
            uniqueness = 1 - avgs[to_delete]
        go_list[to_delete] = {
            "termID": to_delete,
            "description": godag[to_delete].name,
            "frequency": calculate_frequency(to_delete, frequencies),
            "uniqueness": uniqueness,
            "dispensability": max_value,
            "pvalues": np.negative(np.log10(go_enrichment.loc[to_delete, :].values)).tolist()
        }
        # delete rejected term from list of GO terms and from ss matrix
        go_terms = np.delete(go_terms, delete_index)
        matrix = np.delete(matrix, delete_index, 0)
        matrix = np.delete(matrix, delete_index, 1)
    return {"tree": tree, "data": go_list}


def test_go_terms(term_a, term_b, go_enrichment, background, go_counts, max_diff):
    """ returns a dictionary

    Keyword arguments:
    term_a -- goTerm
    term_b -- goTerm
    go_enrichment -- GO enrichment result
    background -- flattened background: lists of genes and GO Terms
    go_counts -- number of times a go term appears in backgound
    max_diff -- maximum differce in p-values
    applies rejection criteria to pairs of GO terms
    """
    # frequency check: Reject very general GO terms
    frequency_a = calculate_frequency(term_a, go_counts)
    frequency_b = calculate_frequency(term_b, go_counts)
    # print(termA, frequencyA)
    if frequency_a > 0.05:
        if frequency_b > 0.05:
            if frequency_b > frequency_a:
                return {"rejection": "frequency" + term_a, "term": term_b}
                # return termB
            else:
                return {"rejection": "frequency" + term_b, "term": term_a}
                # return termA
        else:
            return {"rejection": "frequency" + term_b, "term": term_a}
            # return termA
    else:
        if frequency_b > 0.05:
            return {"rejection": "frequency" + term_a, "term": term_b}
            # return termB
        # p-value reject: Reject GO terms with lower p-values
        else:
            pvalues_a = np.array(go_enrichment.loc[term_a, :].values.tolist())
            pvalues_b = np.array(go_enrichment.loc[term_b, :].values.tolist())
            filter_mask = (abs(pvalues_a - pvalues_b) * (1 - np.minimum(pvalues_a, pvalues_b))) > max_diff
            filtered_pvalues_a = pvalues_a[filter_mask]
            filtered_pvalues_b = pvalues_b[filter_mask]
            bbiggera = len(np.where(filtered_pvalues_a < filtered_pvalues_b)[0])
            abiggerb = len(np.where(filtered_pvalues_a > filtered_pvalues_b)[0])
            if bbiggera < abiggerb:
                return {"rejection": "pval" + term_b, "term": term_a}
                # return termA
            else:
                if bbiggera > abiggerb:
                    return {"rejection": "pval" + term_a, "term": term_b}
                    # return termB
                else:
                    if bbiggera != 0 and abiggerb != 0:
                        if np.average(filtered_pvalues_a) < np.average(filtered_pvalues_b):
                            return {"rejection": "pval" + term_a, "term": term_b}
                        else:
                            return {"rejection": "pval" + term_b, "term": term_a}
                    # parent reject: Reject terms based on their relationship in the GO dag
                    else:
                        parents_a = parents[term_a]
                        parents_b = parents[term_b]
                        genes_a = get_associated_genes(term_a, background)
                        genes_b = get_associated_genes(term_b, background)
                        intersection = np.intersect1d(genes_a, genes_b)
                        if term_b in parents_a:
                            # if the parent term is composed almost exclusively of the child term, reject parent
                            if len(genes_b) * 0.75 < len(intersection):
                                return {"rejection": "parent" + term_a, "term": term_b}
                                # return termB
                            else:
                                # if not, reject child
                                return {"rejection": "child" + term_b, "term": term_a}
                                # return termA
                        else:
                            if term_a in parents_b:
                                if len(genes_a) * 0.75 < len(intersection):
                                    return {"rejection": "parent" + term_b, "term": term_a}
                                    # return termA
                                else:
                                    return {"rejection": "child" + term_a, "term": term_b}
                                    # return termB
                            # pseudo random reject
                            else:
                                seed = int(term_a[3:-1])
                                random.seed(seed)
                                if bool(random.getrandbits(1)):
                                    return {"rejection": "random" + term_b, "term": term_a}
                                    # return termA
                                else:
                                    return {"rejection": "random" + term_a, "term": term_b}
                                    # return termB


# calculates frequency of a go Term (including its descendants)
def calculate_frequency(term, frequencies):
    """ returns a float

    Keyword arguments:
    term -- GO term
    frequencies -- dictionary of frequencies

    calculates frequency of a go Term (including its descendants)
    """
    descendants = get_descendants(term)
    frequency = 0
    for descendant in descendants:
        if descendant in frequencies:
            frequency = frequency + frequencies[descendant]
    if term in frequencies:
        frequency = frequency + frequencies[term]
    return frequency


def get_associated_genes(term, background):
    """ returns list of genes

    Keyword arguments:
    term -- GO term
    background -- flattened background: lists of genes and GO terms
    gets genes associated with a GO term
    """
    np_background = np.array(background)
    associated_genes = list()
    filtered_background = np_background[:, np_background[1] == term]
    if len(filtered_background) > 0:
        associated_genes = filtered_background[0, :]
    return associated_genes


def read_background(background_file, is_local):
    """ return a dictionary

    Keyword arguments:
    backgroundFile -- background as string
    reads background file
    """
    # helper file needs to be created since GOAtools method is only able to read files
    helper_file = tempfile.NamedTemporaryFile()
    if not is_local:
        helper_file.write(background_file.stream.read())
    else:
        helper_file.write(background_file.read())
    objanno = get_objanno(helper_file.name, 'id2gos', godag=godag)
    helper_file.close()
    return objanno


def flatten_background(background):
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


def goea(genes, objanno, propagateBackground):
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


@app.route('/readFileHeader', methods=["POST"])
def read_file_header():
    """
    reads file header of enrichment file
    """
    go_enrichment_file = request.files["goEnrichment"]
    columns = pd.read_csv(StringIO(go_enrichment_file.stream.read().decode("UTF8"), newline=None), sep='\t',
                          index_col=0,
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
    corr_matrix = df.corr()
    return corr_matrix.to_json(orient="values")


@app.route("/MultiREVIGO", methods=["POST"])
def multi_revigo():
    """
    Performs multi revigo for custom input files
    """
    background_files = request.files.getlist("backgrounds[]")
    gene_list_files = request.files.getlist("geneLists[]")
    background_map = request.form.getlist("backgroundMap[]")
    propagate_background = request.form["propagateBackground"] == "true"
    direction = request.form["direction"]
    method = request.form["method"]
    pvalue_filter = float(request.form['pvalueFilter'])
    background_anno = process_backgrounds(background_files, propagate_background, False)
    gene_lists = create_genes_dfs(gene_list_files, False)
    go_enrichment = request.files.get('goEnrichment', None)
    if go_enrichment is not None:
        return go_list_revigo(go_enrichment.stream, background_anno, gene_lists, method, pvalue_filter)
    else:
        conditions = request.form.getlist("conditions[]")
        return gene_list_revigo(background_anno, gene_lists, conditions, background_map, direction, method,
                                pvalue_filter)


def process_backgrounds(background_files, propagate_background, is_local):
    """ returns dict of objannos
    propagates background files

    Keyword arguments:
        background_files -- File objects
        propagate_background -- true if background should be propagated
        is_local -- true if local files are used (example data)
    """
    # print(background_files)
    background_anno = dict()
    if not propagate_background:
        if not is_local:
            for index, file in enumerate(background_files):
                background_anno[file.filename] = read_background(file, is_local)
        else:
            for index, file in enumerate(background_files):
                background_anno[os.path.basename(file.name)] = read_background(file, is_local)
    else:
        for index, file in enumerate(background_files):
            # print(index,file)
            if not is_local:
                objanno = read_background(file, is_local)
            else:
                objanno = read_background(file, is_local)
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
            if is_local:
                background_anno[os.path.basename(file.name)] = get_objanno(background_file.name, 'id2gos', godag=godag)
            else:
                background_anno[os.path.basename(file.filename)] = get_objanno(background_file.name, 'id2gos',
                                                                               godag=godag)
            background_file.close()
    return background_anno


def create_genes_dfs(gene_list_files, is_local):
    """ returns array of DataFrames

    Keyword arguments:
        gene_list_files -- File objects containing genes
        is_local -- true if local files are used (example data)
    """
    genes_dfs = []
    for index, file in enumerate(gene_list_files):
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


def perform_enrichment(backgrounds, background_map, gene_lists, conditions, direction):
    """ returns DataFrame

    Keyword arguments:
        backgrounds -- background objects
        background_map -- dict that maps background to condition index
        gene_lists -- DataFrame of genes (+ optional p-values)
        conditions -- conditions in data set
        direction -- overrepresentation or underrepresentation
    """
    enrichment_results = {}
    # for each file perform GOEA
    for index, gene_list in enumerate(gene_lists):

        # print("------",str(index),"------")
        result = goea(gene_list.index.tolist(), backgrounds[background_map[index]], False)
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

    Keyword arguments:
        background_anno -- background objects
        go_enrichment -- dataframe containing enrichment results
        method -- semantic similarity method, either "Lin", "Resnik", "Wang" or "Edge distance"
        pvalue_filter -- only consider p-values lower than filter
        performs clustering for GO terms with associated p-values
    """
    has_genes = len(gene_lists) > 0
    genes = {}
    has_fc = False
    if has_genes:
        genes_dfs = []
        for index, genes_df in enumerate(gene_lists):
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
            multi_go_results[ont] = multi_go(enrichment_df, background, method, pvalue_filter)
            for go in multi_go_results[ont]["data"]:
                multi_go_results[ont]["data"][go]["Genes"] = list(go2genes[go])
        conditions = enrichment_df.columns.values.tolist()
    table_columns = ["termID", "description", "frequency", "uniqueness", "dispensability"] + conditions
    if has_genes:
        table_columns.append("Genes")
    return {"results": multi_go_results, "conditions": conditions, "geneValues": genes, "hasFC": has_fc
        , "goSetSize": go_set_size, "tableColumns": table_columns}


def gene_list_revigo(background_anno, gene_list_files, conditions, background_map, direction, method, pvalue_filter):
    """ returns revigo dict

    Keyword arguments:
        background_anno -- background objects
        gene_list_files -- lists of genes (+ optionally p-values)
        conditions -- conditions in dataset
        background_map -- dict that maps background to condition index
        direction -- overrepresentation/underrepresentation
        method -- semantic similarity method, either "Lin", "Resnik", "Wang" or "Edge distance"
        pvalue_filter -- only consider p-values lower than filter
        Performs multi REVIGO fo gene lists

    """
    go_enrichment = perform_enrichment(background_anno, background_map, gene_list_files, conditions, direction)
    return perform_revigo(background_anno, go_enrichment, gene_list_files, method, pvalue_filter)


def go_list_revigo(go_enrichment_file, background_anno, gene_list_files, method, pvalue_filter):
    """ returns REVIGO dict

    Keyword arguments:
        go_enrichment_file -- file containing go enrichment results
        background_anno -- background objects
        gene_list_files -- lists of genes (+ optionally p-values)
        method -- semantic similarity method, either "Lin", "Resnik", "Wang" or "Edge distance"
        pvalue_filter -- only consider p-values lower than filter
        performs clustering for GO terms with associated p-values
    """
    go_enrichment = pd.read_csv(StringIO(go_enrichment_file.read().decode("UTF8"), newline=None), sep='\t',
                                index_col=0)
    return perform_revigo(background_anno, go_enrichment, gene_list_files, method, pvalue_filter)


@app.route("/load_mus_musculus", methods=["GET"])
def load_mus_musculus():
    """
    Loads mouse example data
    """
    folder = os.path.join(here, "data", "MusMusculus")
    background_files = [open(os.path.join(folder, "BackgroundMusMusculus.tsv"), "rb")]
    go_enrichment_file = open(os.path.join(folder, "GO_enrichment_results.tsv"), "rb")
    gene_list_files = [open(os.path.join(folder, "D8vsD0.tsv"), "rb"),
                       open(os.path.join(folder, "D11vsD8.tsv"), "rb"),
                       open(os.path.join(folder, "D11vsD0.tsv"), "rb"),
                       open(os.path.join(folder, "D18vsD8.tsv"), "rb"),
                       open(os.path.join(folder, "D18vsD0.tsv"), "rb")]
    pvalue_filter = 0.00001
    background_anno = process_backgrounds(background_files, True, True)
    gene_lists = create_genes_dfs(gene_list_files, True)
    return go_list_revigo(go_enrichment_file, background_anno, gene_lists, "Wang", pvalue_filter)


@app.route("/load_treponema_pallidum", methods=["GET"])
def load_treponema_pallidum():
    """
    Loads evidente example data
    """
    folder = os.path.join(here, "data", "TreponemaPallidum")
    background_files = [open(os.path.join(folder, "Background_TreponemaPallidum.tsv"), "rb")]
    go_enrichment_file = open(os.path.join(folder, "GO_enrichment_results.tsv"), "rb")
    gene_list_files = [open(os.path.join(folder, "SNPs_per_gene_SS14.tsv"), "rb"),
                       open(os.path.join(folder, "SNPs_per_gene_TEN.tsv"), "rb"),
                       open(os.path.join(folder, "SNPs_per_gene_TPE.tsv"), "rb")]
    pvalue_filter = 0.05
    background_anno = process_backgrounds(background_files, True, True)
    gene_lists = create_genes_dfs(gene_list_files, True)
    return go_list_revigo(go_enrichment_file, background_anno, gene_lists, "Wang", pvalue_filter)


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
