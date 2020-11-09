import { IBaseQueries, ContextValue } from "@sqltools/types";
import queryFactory from "@sqltools/base-driver/dist/lib/factory";

const describeTable: IBaseQueries["describeTable"] = queryFactory`
  DESCRIBE TABLE ${(p) => p.database}.${(p) => p.label}
`;

const fetchColumns: IBaseQueries["fetchColumns"] = queryFactory`
SELECT name AS label,
  type AS dataType,
  default_expression AS "defaultValue",
  '${ContextValue.COLUMN}' as type
FROM system.columns
ORDER BY position ASC
`;

const fetchRecords: IBaseQueries["fetchRecords"] = queryFactory`
SELECT *
FROM ${(p) => p.table.label || p.table}
LIMIT ${(p) => p.limit || 50}
OFFSET ${(p) => p.offset || 0};
`;

const countRecords: IBaseQueries["countRecords"] = queryFactory`
SELECT count(1) AS total
FROM ${(p) => p.table.label || p.table};
`;

const fetchTables: IBaseQueries["fetchTables"] = queryFactory`
SELECT name AS label,
  'table' AS type
FROM system.tables
WHERE database == '${(p) => p.database}'
  AND engine != 'View'
ORDER BY name
`;
const fetchViews: IBaseQueries["fetchTables"] = queryFactory`
SELECT name AS label,
  'view' AS type
FROM system.tables
WHERE database == '${(p) => p.database}'
  AND engine == 'View'
ORDER BY name
`;

const searchTables: IBaseQueries["searchTables"] = queryFactory`
SELECT name AS label,
  type
FROM system.tables
WHERE ${(p) =>
  p.search ? `WHERE LOWER(name) LIKE '%${p.search.toLowerCase()}%'` : ""}
  AND database == '${(p) => p.datavase}'
ORDER BY name
`;
const searchColumns: IBaseQueries["searchColumns"] = queryFactory`
SELECT name AS label,
  table,
  type AS dataType,
  C."notnull" AS isNullable,
  '${ContextValue.COLUMN}' as type
FROM system.columns
WHERE database = ${(p) => p.database} AND table = ${(p) =>
  p.table.label || p.table}
ORDER BY name ASC
LIMIT ${(p) => p.limit || 100}
`;

export default {
  describeTable,
  countRecords,
  fetchColumns,
  fetchRecords,
  fetchTables,
  fetchViews,
  searchTables,
  searchColumns,
};
