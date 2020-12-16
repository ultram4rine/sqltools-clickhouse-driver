import { NSDatabase } from "@sqltools/types";

// TODO: more keywods!
const keywordsArr = [
  "ALL",
  "ALTER",
  "ANTI",
  "ANY",
  "ARRAY JOIN",
  "ASOF",
  "CREATE",
  "CROSS",
  "DISTINCT",
  "DROP",
  "FINAL",
  "FROM",
  "FULL",
  "GLOBAL",
  "GROUP BY",
  "HAVING",
  "INNER",
  "INSERT INTO",
  "LEFT",
  "LIMIT",
  "LIMIT BY",
  "ON",
  "ORDER BY",
  "OUTER",
  "PREWHERE",
  "RIGHT",
  "SAMPLE",
  "SELECT",
  "SEMI",
  "STEP",
  "TABLE",
  "TO",
  "UNION",
  "USING",
  "VALUES",
  "WITH",
  "WITH CUBE",
  "WITH FILL",
  "WITH ROLLUP",
  "WITH TIES",
  "WITH TOTALS",
];

const keywordsCompletion: {
  [w: string]: NSDatabase.IStaticCompletion;
} = keywordsArr.reduce((agg, word) => {
  agg[word] = {
    label: word,
    detail: word,
    filterText: word,
    sortText:
      (["SELECT", "CREATE", "UPDATE"].includes(word) ? "2:" : "") + word,
    documentation: {
      value: `\`\`\`yaml\nWORD: ${word}\n\`\`\``,
      kind: "markdown",
    },
  };
  return agg;
}, {});

export default keywordsCompletion;
