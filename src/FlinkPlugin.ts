import mongodb, { Db } from "mongodb";
import { FlinkApp } from "./FlinkApp";
import { log } from "./FlinkLog";

export interface FlinkPluginOptions {
  /**
   * Name of plugin
   */
  name: string;

  /**
   * Configuration related to database.
   * Leave empty if no database is needed.
   */
  db?: {
    /**
     * If plugin should use host apps database instead of having one
     * one its own.
     */
    useHostDb?: boolean;

    /**
     * Uri to mongodb including any username and password.
     *
     * Set `useHostDb` instead if host app database should be used.
     *
     * @example mongodb://localhost:27017/my-db
     */
    uri?: string;
  };

  /**
   * Initializes the plugin. Is invoked when host app is initialized.
   */
  init: (app: FlinkApp<any>) => void | Promise<void>;
}

export class FlinkPlugin {
  /**
   * Name of plugin
   */
  name: string;

  /**
   * The host flink app, from which the plugin is invoked
   */
  private app: FlinkApp<any>;

  private db?: Db;

  private dbOpts: FlinkPluginOptions["db"];

  constructor(app: FlinkApp<any>, options: FlinkPluginOptions) {
    this.name = options.name;
    this.app = app;
    this.dbOpts = options.db;
  }

  async init() {
    await this.initDb();
    return this;
  }

  /**
   * Connects to database.
   */
  private async initDb() {
    if (this.dbOpts) {
      if (this.dbOpts.useHostDb) {
        if (!this.app.db) {
          log.error(
            `Plugin '${this.name} configured to use host app db, but no db exists'`
          );
        } else {
          this.db = this.app.db;
        }
      } else if (this.dbOpts.uri) {
        try {
          log.debug(`Connecting to '${this.name}' db`);
          const client = await mongodb.connect(this.dbOpts.uri, {
            useUnifiedTopology: true,
          });
          this.db = client.db();
        } catch (err) {
          log.error(`Failed to connect to plugin '${this.name}' db: ` + err);
        }
      }
    }
  }
}

/**
 * Returns function which creates the plugin.
 */
export type FlinkPluginFactory = (
  pluginOptions: any
) => (app: FlinkApp<any>) => FlinkPlugin;
