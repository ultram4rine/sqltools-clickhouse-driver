import { IBaseQueries, ContextValue } from "@sqltools/types";
import queryFactory from "@sqltools/base-driver/dist/lib/factory";

const describeTable: IBaseQueries["describeTable"] = queryFactory`
  DESCRIBE TABLE ${(p) => p.database}.${(p) => p.label}
`;

const fetchColumns: IBaseQueries["fetchColumns"] = queryFactory`
SELECT name AS label,
  c.type AS dataType,
  c.default_expression AS defaultValue,
  '${ContextValue.COLUMN}' AS type,
  c.is_in_primary_key AS isPk
FROM system.columns AS c
WHERE c.table == '${(p) => p.label}'
ORDER BY c.position ASC
`;

const fetchRecords: IBaseQueries["fetchRecords"] = queryFactory`
SELECT *
FROM ${(p) => p.table.label || p.table}
LIMIT ${(p) => p.limit || 50}
OFFSET ${(p) => p.offset || 0}
`;

const countRecords: IBaseQueries["countRecords"] = queryFactory`
SELECT count(1) AS total
FROM ${(p) => p.table.label || p.table}
`;

const fetchTables: IBaseQueries["fetchTables"] = queryFactory`
SELECT t.name AS label,
  t.database AS database,
  '${ContextValue.TABLE}' AS type
FROM system.tables AS t
WHERE t.database == '${(p) => p.database}'
  AND t.engine != 'View'
ORDER BY t.name
`;
const fetchViews: IBaseQueries["fetchTables"] = queryFactory`
SELECT t.name AS label,
  t.database AS database,
  '${ContextValue.VIEW}' AS type
FROM system.tables AS t
WHERE t.database == '${(p) => p.database}'
  AND t.engine == 'View'
ORDER BY t.name
`;

const searchTables: IBaseQueries["searchTables"] = queryFactory`
SELECT name AS label,
  t.engine AS type
FROM system.tables AS t
WHERE ${(p) =>
  p.search ? `WHERE LOWER(name) LIKE '%${p.search.toLowerCase()}%'` : ""}
  AND database == '${(p) => p.database}'
ORDER BY name
`;
const searchColumns: IBaseQueries["searchColumns"] = queryFactory`
SELECT c.name AS label,
  c.table AS table,
  c.type AS dataType,
  '${ContextValue.COLUMN}' as type
FROM system.columns AS c
WHERE database = ${(p) => p.database} AND table = ${(p) =>
  p.table.label || p.table}
ORDER BY c.name ASC
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
