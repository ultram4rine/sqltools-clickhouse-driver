import { NSDatabase } from "@sqltools/types";

const keywordsArr = [
  "ALTER",
  "CREATE",
  "DROP",
  "FROM",
  "SELECT",
  "TABLE",
  "INSERT",
  "INTO",
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
