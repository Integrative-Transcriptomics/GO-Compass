import os
import sys

import pandas as pd


def collapse_locus_tags(table):
    return table.groupby(['locus-tag'], as_index=False)[['class']].agg(';'.join)


def read_table(file):
    table = pd.read_table(file, sep="\t")
    print(table)
    table = table.drop("description", axis="columns")
    return table


def write_table(filename, table):
    table.to_csv(filename, sep="\t", header=None, index=None)


if __name__ == "__main__":
    print("hi")
    file_path = sys.argv[1]
    filename = os.path.basename(file_path)
    pure_fname, f_ext = os.path.splitext(filename)
    facop_anno = read_table(file_path)
    collapsed_anno = collapse_locus_tags(facop_anno)
    write_table(pure_fname + "_transformed.tsv", collapsed_anno)
