import { ILanguageServerPlugin } from "@sqltools/types";
import ClickHouseDriver from "./driver";
import { DRIVER_ALIASES } from "./../constants";

const ClickHouseDriverPlugin: ILanguageServerPlugin = {
  register(server) {
    DRIVER_ALIASES.forEach(({ value }) => {
      server.getContext().drivers.set(value, ClickHouseDriver as any);
    });
  },
};

export default ClickHouseDriverPlugin;
