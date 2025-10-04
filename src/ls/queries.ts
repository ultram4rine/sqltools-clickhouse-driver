import {
  IBaseQueries,
  ContextValue,
  QueryBuilder,
  NSDatabase,
} from "@sqltools/types";
import queryFactory from "@sqltools/base-driver/dist/lib/factory";

const describeTable: IBaseQueries["describeTable"] = queryFactory`
  DESCRIBE TABLE ${(p) => p.database}.\`${(p) => p.label}\`
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
FROM ${(p) => p.table.database}.\`${(p) => p.table.label || p.table}\`
LIMIT ${(p) => p.limit || 50}
OFFSET ${(p) => p.offset || 0}
`;

const countRecords: IBaseQueries["countRecords"] = queryFactory`
SELECT count(1) AS total
FROM ${(p) => p.table.database}.\`${(p) => p.table.label || p.table}\`
`;

const fetchDatabases: IBaseQueries["fetchDatabases"] = queryFactory`
SELECT d.name AS label,
  d.name AS database,
  '${ContextValue.DATABASE}' AS type,
  d.engine AS detail
FROM system.databases AS d
ORDER BY d.name
`;

const fetchTables: IBaseQueries["fetchTables"] = queryFactory`
SELECT t.name AS label,
  t.database AS database,
  '${ContextValue.TABLE}' AS type,
  false AS isView,
  t.engine AS detail
FROM system.tables AS t
WHERE t.database == '${(p) => p.database}'
  AND t.engine != 'View'
  AND t.engine != 'MaterializedView'
ORDER BY t.name
`;
const fetchViews: IBaseQueries["fetchTables"] = queryFactory`
SELECT t.name AS label,
  t.database AS database,
  '${ContextValue.VIEW}' AS type,
  true AS isView
FROM system.tables AS t
WHERE t.database == '${(p) => p.database}'
  AND t.engine == 'View'
ORDER BY t.name
`;
const fetchMaterializedViews: IBaseQueries["fetchTables"] = queryFactory`
SELECT t.name AS label,
  t.database AS database,
  '${ContextValue.MATERIALIZED_VIEW}' AS type,
  'view' AS iconName
FROM system.tables AS t
WHERE t.database == '${(p) => p.database}'
  AND t.engine == 'MaterializedView'
ORDER BY t.name
`;

const searchDatabases: QueryBuilder<
  { search: string; limit?: number },
  NSDatabase.IDatabase
> = queryFactory`
SELECT d.name AS label,
  '${ContextValue.DATABASE}' AS type
FROM system.databases AS d
WHERE d.name NOT IN ('INFORMATION_SCHEMA', 'information_schema', 'system')
  ${(p) => (p.search ? `AND d.name ILIKE '%${p.search}%'` : "")}
ORDER BY d.name
${(p) => (p.limit ? `LIMIT ${p.limit}` : "")}
`;
const searchTables: IBaseQueries["searchTables"] = queryFactory`
SELECT t.name AS label,
  t.database AS database,
  if(t.engine in ('View', 'MaterializedView'), true, false) AS isView,
  if(t.engine = 'View',
    '${ContextValue.VIEW}',
    if(t.engine = 'MaterializedView',
      '${ContextValue.MATERIALIZED_VIEW}',
      '${ContextValue.TABLE}'
    )
  ) AS type
FROM system.tables AS t
WHERE t.database NOT IN ('INFORMATION_SCHEMA', 'information_schema', 'system')
  ${(p) => (p.search ? `AND t.name ILIKE '%${p.search}%'` : "")}
ORDER BY t.name
${(p) => (p.limit ? `LIMIT ${p.limit}` : "")}
`;
const searchColumns: IBaseQueries["searchColumns"] = queryFactory`
SELECT c.name AS label,
  c.table AS table,
  c.database AS database,
  c.type AS dataType,
  '${ContextValue.COLUMN}' as type
FROM system.columns AS c
WHERE c.database NOT IN ('INFORMATION_SCHEMA', 'information_schema', 'system')
  ${(p) =>
    p.tables.filter((t) => !!t.label).length
      ? `AND lower(c.table) IN (${p.tables
          .filter((t) => !!t.label)
          .map((t) => `'${t.label}'`.toLowerCase())
          .join(", ")})`
      : ""}
${(p) =>
  p.search
    ? `AND (
    (c.table || '.' || c.name) ILIKE '%${p.search}%'
    OR c.name ILIKE '%${p.search}%'
  )`
    : ""}
ORDER BY c.name ASC
LIMIT ${(p) => p.limit || 100}
`;

export default {
  describeTable,
  countRecords,
  fetchColumns,
  fetchRecords,
  fetchDatabases,
  fetchTables,
  fetchViews,
  fetchMaterializedViews,
  searchDatabases,
  searchTables,
  searchColumns,
};
