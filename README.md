# SQLTools ClickHouse Driver

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ultram4rine.sqltools-clickhouse-driver?style=flat-square)](https://marketplace.visualstudio.com/items/ultram4rine.sqltools-clickhouse-driver)
[![Open VSX Version](https://img.shields.io/open-vsx/v/ultram4rine/sqltools-clickhouse-driver?style=flat-square)](https://open-vsx.org/extension/ultram4rine/sqltools-clickhouse-driver)
[![License](https://img.shields.io/github/license/ultram4rine/sqltools-clickhouse-driver?style=flat-square)](https://github.com/ultram4rine/sqltools-clickhouse-driver/blob/master/LICENSE)
[![CI/CD](https://img.shields.io/github/actions/workflow/status/ultram4rine/sqltools-clickhouse-driver/cicd.yaml?label=CI%2FCD&logo=github&style=flat-square)](https://github.com/ultram4rine/sqltools-clickhouse-driver/actions/workflows/cicd.yaml)

[ClickHouse](https://clickhouse.com/) driver for
[SQLTools](https://vscode-sqltools.mteixeira.dev/) VS Code extension.

## Installation

- Directly from VS Code by searching `@tag:sqltools clickhouse` or just `clickhouse`;
- From [marketplace](https://marketplace.visualstudio.com/items/ultram4rine.sqltools-clickhouse-driver).

## Usage

After installation you will be able to explore tables and views, run queries, etc.
For more details see SQLTools [documentation](https://vscode-sqltools.mteixeira.dev/features/bookmarks).

## Limits

- According to the [doc](https://clickhouse.com/docs/en/integrations/language-clients/nodejs#compatibility-with-clickhouse)
  of official nodejs client, this extension should be compatible with ClickHouse
  version `22.8` and above.
- Don't use `FORMAT` clause. Driver already uses `JSON` format to show records
  and statistics.
- Don't send multiple queries, this is not supported
  by SQLTools (yet).
- Use `LIMIT` when selecting a large amount of data, otherwise the results may
  take a long time to load.
