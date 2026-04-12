import pandas as pd

df1 = pd.read_csv("data/ds1.csv", encoding="latin1", nrows=5)
print("DS1:", df1.columns.tolist())

df2 = pd.read_csv("data/ds2.csv", nrows=5)
print("DS2:", df2.columns.tolist())

df3 = pd.read_csv("data/ds3.csv", nrows=5)
print("DS3:", df3.columns.tolist())

df4 = pd.read_csv("data/ds4.csv", nrows=5)
print("DS4:", df4.columns.tolist())

df5 = pd.read_csv("data/ds5.csv", encoding="latin1", nrows=5)
print("DS5:", df5.columns.tolist())

df6 = pd.read_csv("data/ds6.tsv", sep="\t", nrows=5, on_bad_lines="skip")
print("DS6:", df6.columns.tolist())