library(stringr)
table <- read.table("/Users/harbig/Downloads/pantherGeneList (1).txt", sep="\t", quote="")
table <- table[,c("V1","V6","V7","V8")]
colnames(table) <- c("geneID","MF","BP","CC")

MF <- sapply(table$MF,function(x) str_extract_all(string=x,pattern="GO:+[0-9]{7}"))
BP <- sapply(table$BP,function(x) str_extract_all(string=x,pattern="GO:+[0-9]{7}"))
CC <- sapply(table$C,function(x) str_extract_all(string=x,pattern="GO:+[0-9]{7}"))

names(BP)<-table$geneID
BP <- stack(BP)
GOfrequencies <- prop.table(table(BP$values))
