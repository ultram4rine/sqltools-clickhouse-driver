import AbstractDriver from "@sqltools/base-driver";
import queries from "./queries";
import {
  IConnectionDriver,
  MConnectionExplorer,
  NSDatabase,
  ContextValue,
  Arg0,
} from "@sqltools/types";
import ClickHouse from "@apla/clickhouse";

type ClickHouseLib = any;
type ClickHouseOptions = any;

export default class ClickHouseDriver
  extends AbstractDriver<ClickHouseLib, ClickHouseOptions>
  implements IConnectionDriver {
  queries = queries;

  public async open() {
    if (this.connection) {
      return this.connection;
    }

    let opts: ClickHouseOptions = {
      host: this.credentials.host,
      port: this.credentials.port,
      user: this.credentials.user,
      password: this.credentials.password,
      protocol: this.credentials.useHTTPS ? "https:" : "http:",
      readonly: this.credentials.readonly,
      dataObjects: true,
    };

    this.connection = new ClickHouse(opts);
    return this.connection;
  }

  public async close() {
    if (!this.connection) return Promise.resolve();

    // ClickHouse connection is a http client, so we can just make it null.
    this.connection = null;
  }

  public query: typeof AbstractDriver["prototype"]["query"] = async (query) => {
    return this.open().then((ch) => {
      return new Promise<NSDatabase.IResult[]>((resolve) => {
        const cols: string[] = [];
        const rows: string[] = [];

        const stream = ch.query(query, {
          queryOptions: {
            database: this.credentials.database,
          },
        });

        stream.on("metadata", (columns) => {
          for (const col of columns) {
            cols.push(col.name);
          }
        });
        stream.on("data", (row) => rows.push(row));
        stream.on("error", (err) => {
          const messages: string[] = [];
          if (err.message) {
            messages.push(err.message);
          }

          return resolve([
            {
              connId: this.getId(),
              error: err,
              results: [],
              cols: [],
              query: query,
              messages: messages,
            } as NSDatabase.IResult,
          ]);
        });
        stream.on("end", () => {
          const res = {
            connId: this.getId(),
            cols: cols,
            results: rows,
            query: query,
            messages: [],
          } as NSDatabase.IResult;

          return resolve([res]);
        });
      });
    });
  };

  public async testConnection() {
    await this.open();

    const db = this.credentials.database;
    const dbFound = await this.query(
      `SELECT name FROM system.databases WHERE name LIKE '${db}'`,
      {}
    );
    if (dbFound[0].error) {
      return Promise.reject({
        message: `Cannot get database list: ${dbFound[0].error}`,
      });
    }
    /*if (dbFound[0].results.length !== 1) {
      return Promise.reject({
        message: `Cannot find ${db} database: ${dbFound[0]}`,
      });
    }*/
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
        return <NSDatabase.IDatabase[]>[
          {
            label: this.credentials.database,
            database: this.credentials.database,
            type: ContextValue.DATABASE,
            detail: "database",
          },
        ];
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

  public getStaticCompletions: IConnectionDriver["getStaticCompletions"] = async () => {
    return {};
  };
}
