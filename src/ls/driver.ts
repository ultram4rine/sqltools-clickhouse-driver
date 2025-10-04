import { readFileSync } from "fs";
import {
  createClient,
  ClickHouseClient,
  ResponseJSON,
  ClickHouseClientConfigOptions,
} from "@clickhouse/client";
import AbstractDriver from "@sqltools/base-driver";
import {
  IConnectionDriver,
  MConnectionExplorer,
  NSDatabase,
  ContextValue,
  Arg0,
} from "@sqltools/types";
import { v4 as generateId } from "uuid";

import queries from "./queries";
import keywordsCompletion from "./keywords";

export default class ClickHouseDriver
  extends AbstractDriver<ClickHouseClient, ClickHouseClientConfigOptions>
  implements IConnectionDriver
{
  queries = queries;

  public async open() {
    if (this.connection) {
      return this.connection;
    }

    // If all three files provided, create mutual TLS configuration,
    // else if only CA file provided, create basic TLS configuration.
    const tlsConfig =
      this.credentials.enableTls &&
      this.credentials.tls &&
      this.credentials.tls.ca_cert &&
      this.credentials.tls.cert &&
      this.credentials.tls.key
        ? {
            ca_cert: readFileSync(this.credentials.tls.ca_cert),
            cert: readFileSync(this.credentials.tls.cert),
            key: readFileSync(this.credentials.tls.key),
          }
        : this.credentials.enableTls &&
          this.credentials.tls &&
          this.credentials.tls.ca_cert
        ? {
            ca_cert: readFileSync(this.credentials.tls.ca_cert),
          }
        : undefined;

    let server = this.credentials.server;
    if (!server.startsWith("http://") && !server.startsWith("https://")) {
      server = "http://" + server;
    }

    const url = new URL(server);
    url.port = this.credentials.port.toString();

    const opts = {
      url: url,
      role: this.credentials.role,
      request_timeout: this.credentials.requestTimeout,
      application: "sqltools-clickhouse-driver",
      database: this.credentials.database,
      tls: tlsConfig,
    } as ClickHouseClientConfigOptions;

    if (this.credentials.useJWT) {
      opts.access_token = this.credentials.password;
    } else {
      opts.username = this.credentials.username;
      opts.password = this.credentials.password;
    }

    this.connection = Promise.resolve(createClient(opts));
    return this.connection;
  }

  public async close() {
    if (!this.connection) {
      return Promise.resolve();
    }

    return (await this.connection).close();
  }

  public query: (typeof AbstractDriver)["prototype"]["query"] = async (
    query,
    opt = {}
  ) => {
    const ch = await this.open();

    return new Promise<NSDatabase.IResult[]>(async (resolve) => {
      const { requestId } = opt;

      // Handle comments https://clickhouse.com/docs/sql-reference/syntax#comments
      const onlyQuery = query
        .toString()
        .replace(/(?:^--.*?$)|(?:^#.*?$)|(?:\/\*(?:[^*]|\*(?!\/))*\*\/)/gm, "")
        .trimStart()
        .toUpperCase();

      const method =
        onlyQuery.startsWith("SELECT") ||
        onlyQuery.startsWith("SHOW") ||
        onlyQuery.startsWith("WITH") ||
        onlyQuery.startsWith("DESC")
          ? "query"
          : "command";

      try {
        if (method === "query") {
          const result = await (
            await ch.query({
              query: query.toString(),
              format: "JSON",
            })
          ).json<ResponseJSON>();

          return resolve([
            <NSDatabase.IResult>{
              requestId,
              connId: this.getId(),
              resultId: generateId(),
              cols: result.meta?.map((v) => v.name) ?? [],
              results: result.data,
              pageSize: result.data.length,
              query,
              messages: [
                this.prepareMessage([
                  `Elapsed: ${result.statistics.elapsed} sec, read ${result.statistics.rows_read} rows, ${result.statistics.bytes_read} B.`,
                ]),
              ],
            },
          ]);
        } else {
          await ch.command({
            query: query.toString(),
          });

          return resolve([
            <NSDatabase.IResult>{
              requestId,
              connId: this.getId(),
              resultId: generateId(),
              cols: [],
              results: [],
              pageSize: 0,
              query,
              messages: [this.prepareMessage([`Done.`])],
            },
          ]);
        }
      } catch (err) {
        return resolve([
          <NSDatabase.IResult>{
            requestId,
            connId: this.getId(),
            resultId: generateId(),
            error: true,
            rawError: err,
            cols: [],
            results: [],
            query,
            messages: [
              this.prepareMessage(
                [err.message.replace(/\n/g, " ")].filter(Boolean).join(" ")
              ),
            ],
          },
        ]);
      }
    });
  };

  public async testConnection() {
    try {
      const ch = await this.open();

      // Try ping
      const pingResult = await ch.ping();
      if (!pingResult.success) {
        throw "Failed to ping ClickHouse server";
      }

      // Try "select 1"
      await ch.query({
        query: "SELECT 1",
        format: "JSON",
      });
    } catch (err) {
      return Promise.reject(err);
    } finally {
      await this.close();
    }
  }

  private async getColumns(
    parent: NSDatabase.ITable
  ): Promise<NSDatabase.IColumn[]> {
    const results = await this.queryResults(this.queries.fetchColumns(parent));
    return results.map((col) => ({
      ...col,
      iconName: col.isPk ? "pk" : null,
      childType: ContextValue.NO_CHILD,
      table: parent,
    }));
  }

  /**
   * This method is a helper to generate the connection explorer tree.
   * it gets the child items based on current item
   */
  public async getChildrenForItem({
    item,
    parent,
  }: Arg0<IConnectionDriver["getChildrenForItem"]>) {
    switch (item.type) {
      case ContextValue.CONNECTION:
      case ContextValue.CONNECTED_CONNECTION:
        return (await this.queryResults(this.queries.fetchDatabases()))
          .map((d) => {
            return {
              ...d,
              iconName:
                this.credentials.database === d.label
                  ? "database-active"
                  : "database",
            };
          })
          .sort((x, y) => {
            return x.label === this.credentials.database
              ? -1
              : y.label === this.credentials.database
              ? 1
              : 0;
          });
      case ContextValue.DATABASE:
        return <MConnectionExplorer.IChildItem[]>[
          {
            label: "Tables",
            type: ContextValue.RESOURCE_GROUP,
            iconId: "folder",
            childType: ContextValue.TABLE,
          },
          {
            label: "Materialized Views",
            type: ContextValue.RESOURCE_GROUP,
            iconId: "folder",
            childType: ContextValue.MATERIALIZED_VIEW,
          },
          {
            label: "Views",
            type: ContextValue.RESOURCE_GROUP,
            iconId: "folder",
            childType: ContextValue.VIEW,
          },
        ];
      case ContextValue.TABLE:
      case ContextValue.VIEW:
      case ContextValue.MATERIALIZED_VIEW:
        return this.getColumns(item as NSDatabase.ITable);
      case ContextValue.RESOURCE_GROUP:
        return this.getChildrenForGroup({ item, parent });
    }
    return [];
  }

  /**
   * This method is a helper to generate the connection explorer tree.
   * It gets the child based on child types
   */
  private async getChildrenForGroup({
    parent,
    item,
  }: Arg0<IConnectionDriver["getChildrenForItem"]>) {
    switch (item.childType) {
      case ContextValue.TABLE:
        return this.queryResults(
          this.queries.fetchTables(parent as NSDatabase.ISchema)
        );
      case ContextValue.VIEW:
        return this.queryResults(
          this.queries.fetchViews(parent as NSDatabase.ISchema)
        );
      case ContextValue.MATERIALIZED_VIEW:
        return this.queryResults(
          this.queries.fetchMaterializedViews(parent as NSDatabase.ISchema)
        );
    }
    return [];
  }

  public async getInsertQuery(params: {
    item: NSDatabase.ITable;
    columns: Array<NSDatabase.IColumn>;
  }) {
    const { item, columns } = params;
    let insertQuery = `INSERT INTO ${item.database}.\`${item.label}\` (${columns
      .map((col) => col.label)
      .join(", ")}) VALUES (`;
    columns.forEach((col, index) => {
      insertQuery = insertQuery.concat(
        `'\${${index + 1}:${col.label}:${col.dataType}}', `
      );
    });
    return insertQuery;
  }

  /**
   * This method is a helper for intellisense and quick picks.
   */
  public async searchItems(
    itemType: ContextValue,
    search: string,
    extraParams: any = {}
  ): Promise<NSDatabase.SearchableItem[]> {
    switch (itemType) {
      case ContextValue.DATABASE:
        return this.queryResults(
          this.queries.searchDatabases({ search, ...extraParams })
        );
      case ContextValue.TABLE:
        return this.queryResults(
          this.queries.searchTables({ search, ...extraParams })
        );
      case ContextValue.COLUMN:
        return this.queryResults(
          this.queries.searchColumns({ search, ...extraParams })
        );
    }
    return [];
  }

  private completionsCache: {
    [w: string]: NSDatabase.IStaticCompletion;
  } = null;
  public getStaticCompletions = async () => {
    if (this.completionsCache) {
      return this.completionsCache;
    }

    try {
      this.completionsCache = keywordsCompletion;

      const functions = await this.queryResults(
        "SELECT name AS label FROM system.functions ORDER BY name ASC"
      );
      const dataTypes = await this.queryResults(
        "SELECT name AS label, alias_to AS desc FROM system.data_type_families ORDER BY name ASC"
      );

      functions.concat(dataTypes).forEach((item: any) => {
        this.completionsCache[item.label] = {
          label: item.label,
          detail: item.label,
          filterText: item.label,
          sortText: "" + item.label,
          documentation: {
            value: `\`\`\`yaml\nWORD: ${item.label}\nTYPE: ${item.desc}\n\`\`\``,
            kind: "markdown",
          },
        };
      });
    } catch (error) {
      // use default reserved words
      this.completionsCache = keywordsCompletion;
    }

    return this.completionsCache;
  };
}
