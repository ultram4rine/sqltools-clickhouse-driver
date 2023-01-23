import {
  createClient,
  ClickHouseClient,
  ClickHouseClientConfigOptions,
  Row,
} from "@clickhouse/client";
import queries from "./queries";
import keywordsCompletion from "./keywords";
import AbstractDriver from "@sqltools/base-driver";
import {
  IConnectionDriver,
  MConnectionExplorer,
  NSDatabase,
  ContextValue,
  Arg0,
} from "@sqltools/types";
import { v4 as generateId } from "uuid";

export default class ClickHouseDriver
  extends AbstractDriver<ClickHouseClient, ClickHouseClientConfigOptions>
  implements IConnectionDriver
{
  queries = queries;

  public async open() {
    if (this.connection) {
      return this.connection;
    }

    let opts: ClickHouseClientConfigOptions = {
      host: this.credentials.host,
      username: this.credentials.username,
      password: this.credentials.password,
      application: "sqltools-clickhouse-driver",
      database: this.credentials.database,
    };

    this.connection = Promise.resolve(createClient(opts));
    return this.connection;
  }

  public async close() {
    if (!this.connection) {
      return Promise.resolve();
    }

    return (await this.connection).close();
  }

  public query: typeof AbstractDriver["prototype"]["query"] = async (
    query,
    opt = {}
  ) => {
    return this.open().then((ch) => {
      return new Promise<NSDatabase.IResult[]>(async (resolve) => {
        const { requestId } = opt;
        const messages = [];
        const rows = [];

        const stream = (
          await ch.query({
            query: String(query),
            format: "JSONEachRow",
          })
        ).stream();

        stream.on("data", (res: Row[]) => {
          res.forEach((r: Row) => {
            rows.push(JSON.parse(r.text));
          });
        });
        stream.on("error", (err) => {
          return resolve([
            <NSDatabase.IResult>{
              requestId: requestId,
              connId: this.getId(),
              resultId: generateId(),
              error: true,
              rawError: err,
              cols: [],
              results: [],
              query: query,
              messages: messages.concat([
                this.prepareMessage(
                  [err.message.replace(/\n/g, " ")].filter(Boolean).join(" ")
                ),
              ]),
            },
          ]);
        });
        stream.on("end", () => {
          return resolve([
            <NSDatabase.IResult>{
              requestId: requestId,
              connId: this.getId(),
              resultId: generateId(),
              cols: Object.keys(rows[0]),
              results: rows,
              query: query,
              messages: messages.concat([
                this.prepareMessage([
                  `Query successfully executed. ${rows.length} rows were affected.`,
                ]),
              ]),
            },
          ]);
        });
      });
    });
  };

  public async testConnection() {
    await this.open();
    const isAlive = await (await this.connection).ping();
    if (!isAlive) {
      return Promise.reject("Cannot ping ClickHouse server");
    }
    await this.close();
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
        return this.queryResults(this.queries.fetchDatabases());
      case ContextValue.DATABASE:
        return <MConnectionExplorer.IChildItem[]>[
          {
            label: "Tables",
            type: ContextValue.RESOURCE_GROUP,
            iconId: "folder",
            childType: ContextValue.TABLE,
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
    }
    return [];
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
      case ContextValue.TABLE:
        return this.queryResults(this.queries.searchTables({ search }));
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
