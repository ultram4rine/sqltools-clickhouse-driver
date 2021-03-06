# SQLTools ClickHouse Driver

[![Visual Studio Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/ultram4rine.sqltools-clickhouse-driver?style=flat-square)](https://marketplace.visualstudio.com/items/ultram4rine.sqltools-clickhouse-driver/changelog) [![License](https://img.shields.io/github/license/ultram4rine/sqltools-clickhouse-driver?style=flat-square)](https://github.com/ultram4rine/sqltools-clickhouse-driver/blob/master/LICENSE) [![GitHub Workflow Status](https://img.shields.io/github/workflow/status/ultram4rine/sqltools-clickhouse-driver/CI?style=flat-square)](https://github.com/ultram4rine/sqltools-clickhouse-driver/actions?query=workflow%3ACI)

[ClickHouse](https://clickhouse.tech/) driver for [SQLTools](https://vscode-sqltools.mteixeira.dev/) VS Code extension.

## Installation

- Directly from VS Code by searching `@tag:sqltools clickhouse` or just `clickhouse`;
- From [marketplace](https://marketplace.visualstudio.com/items/ultram4rine.sqltools-clickhouse-driver).

## Usage

After installation you will be able to explore tables and views, run queries, etc. For more details see SQLTools [documentation](https://vscode-sqltools.mteixeira.dev/features/bookmarks).

## Limits

- Don't use `;` at the end of the query. Since that driver uses [@apla/clickhouse](https://www.npmjs.com/package/@apla/clickhouse) library it automatically adds the `FORMAT` statement after query. In this case SQLTools thinks that you are sending multiple queries, which not supported (yet).

- Use `LIMIT` when selecting from table which stores more than 100 000 (about) records.
