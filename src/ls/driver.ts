import { ClickHouse } from "@apla/clickhouse";
import AbstractDriver from "@sqltools/base-driver";
import queries from "./queries";
import {
  IConnectionDriver,
  MConnectionExplorer,
  NSDatabase,
  ContextValue,
  Arg0,
} from "@sqltools/types";
import { v4 as generateId } from "uuid";

type ClickHouseOptions = any;

export default class ClickHouseDriver
  extends AbstractDriver<ClickHouse, ClickHouseOptions>
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
      protocol: this.credentials.protocol,
    };

    this.connection = new ClickHouse(opts);
    return this.connection;
  }

  public async close() {
    if (!this.connection) return Promise.resolve();

    // ClickHouse connection is a http client, so we can just make it null.
    this.connection = null;
  }

  public query: typeof AbstractDriver["prototype"]["query"] = async (
    queries,
    opt = {}
  ) => {
    const db = await this.open();
    const queriesResults = await db.query(queries);
    const resultsAgg: NSDatabase.IResult[] = [];
    queriesResults.forEach((queryResult) => {
      resultsAgg.push({
        cols: Object.keys(queryResult[0]),
        connId: this.getId(),
        messages: [
          {
            date: new Date(),
            message: `Query ok with ${queriesResults.length} results`,
          },
        ],
        results: queryResult,
        query: queries.toString(),
        requestId: opt.requestId,
        resultId: generateId(),
      });
    });
    /**
     * write the method to execute queries here!!
     */
    return resultsAgg;
  };

  /** if you need a different way to test your connection, you can set it here.
   * Otherwise by default we open and close the connection only
   */
  public async testConnection() {
    await this.open();
    await this.query("SELECT 1", {});
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
        let i = 0;
        return <NSDatabase.IColumn[]>[
          {
            database: "fakedb",
            label: `column${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: parent,
          },
          {
            database: "fakedb",
            label: `column${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: parent,
          },
          {
            database: "fakedb",
            label: `column${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: parent,
          },
          {
            database: "fakedb",
            label: `column${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: parent,
          },
          {
            database: "fakedb",
            label: `column${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: parent,
          },
        ];
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
    console.log({ item, parent });
    switch (item.childType) {
      case ContextValue.TABLE:
      case ContextValue.VIEW:
        let i = 0;
        return <MConnectionExplorer.IChildItem[]>[
          {
            database: "fakedb",
            label: `${item.childType}${i++}`,
            type: item.childType,
            schema: "fakeschema",
            childType: ContextValue.COLUMN,
          },
          {
            database: "fakedb",
            label: `${item.childType}${i++}`,
            type: item.childType,
            schema: "fakeschema",
            childType: ContextValue.COLUMN,
          },
          {
            database: "fakedb",
            label: `${item.childType}${i++}`,
            type: item.childType,
            schema: "fakeschema",
            childType: ContextValue.COLUMN,
          },
        ];
    }
    return [];
  }

  /**
   * This method is a helper for intellisense and quick picks.
   */
  public async searchItems(
    itemType: ContextValue,
    search: string,
    _extraParams: any = {}
  ): Promise<NSDatabase.SearchableItem[]> {
    switch (itemType) {
      case ContextValue.TABLE:
      case ContextValue.VIEW:
        let j = 0;
        return [
          {
            database: "fakedb",
            label: `${search || "table"}${j++}`,
            type: itemType,
            schema: "fakeschema",
            childType: ContextValue.COLUMN,
          },
          {
            database: "fakedb",
            label: `${search || "table"}${j++}`,
            type: itemType,
            schema: "fakeschema",
            childType: ContextValue.COLUMN,
          },
          {
            database: "fakedb",
            label: `${search || "table"}${j++}`,
            type: itemType,
            schema: "fakeschema",
            childType: ContextValue.COLUMN,
          },
        ];
      case ContextValue.COLUMN:
        let i = 0;
        return [
          {
            database: "fakedb",
            label: `${search || "column"}${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: "fakeTable",
          },
          {
            database: "fakedb",
            label: `${search || "column"}${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: "fakeTable",
          },
          {
            database: "fakedb",
            label: `${search || "column"}${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: "fakeTable",
          },
          {
            database: "fakedb",
            label: `${search || "column"}${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: "fakeTable",
          },
          {
            database: "fakedb",
            label: `${search || "column"}${i++}`,
            type: ContextValue.COLUMN,
            dataType: "faketype",
            schema: "fakeschema",
            childType: ContextValue.NO_CHILD,
            isNullable: false,
            iconName: "column",
            table: "fakeTable",
          },
        ];
    }
    return [];
  }

  public getStaticCompletions: IConnectionDriver["getStaticCompletions"] = async () => {
    return {};
  };
}
