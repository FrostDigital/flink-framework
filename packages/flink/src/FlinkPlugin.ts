import { Db } from "mongodb";
import { FlinkApp } from "./FlinkApp";

export interface FlinkPlugin {
  /**
   * Unique key/id which is used when accessing plugin in application context.
   *
   * Should ideally be camelCase as this is used to access plugin from context like so `ctx.myPlugin`.
   */
  id: string;

  /**
   * If plugin should expose *anything* on application context.
   * The `key` is used as property to access plugins context.
   */
  ctx?: any;

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
  init?: (app: FlinkApp<any>, db?: Db) => void | Promise<void>;

  handlers?: any[];
}
