import { FlinkPlugin, FlinkApp, log } from "@flink-app/flink";
import { Db } from "mongodb";
import { BankIdPluginOptions } from "./BankIdPluginOptions";
import { BankIdPluginContext } from "./BankIdPluginContext";

export function bankIdPlugin(options: BankIdPluginOptions): FlinkPlugin {
  if (!options.pfxBase64) {
    throw new Error("BankID Plugin: pfxBase64 is required");
  }
  
  if (!options.passphrase) {
    throw new Error("BankID Plugin: passphrase is required");
  }
  
  if (!options.authPlugin) {
    throw new Error("BankID Plugin: authPlugin is required");
  }
  
  if (!options.getUserByPersonalNumber) {
    throw new Error("BankID Plugin: getUserByPersonalNumber function is required");
  }

  return {
    id: "bankId",
    
    db: {
      useHostDb: true
    },
    
    async init(app: FlinkApp<any>, db?: Db) {
      log.info("Initializing BankID Plugin...");
      
      try {
        const { BankIdClient } = await import("bankid");
        
        const bankIdClient = new BankIdClient({
          production: options.production || false,
          pfx: Buffer.from(options.pfxBase64, "base64"),
          passphrase: options.passphrase
        });
        
        const context: BankIdPluginContext = {
          bankIdClient,
          options
        };
        
        app.getContext().bankId = context;
        
        log.info(`BankID Plugin initialized in ${options.production ? 'production' : 'test'} mode`);
      } catch (error) {
        log.error("Failed to initialize BankID Plugin:", error);
        throw error;
      }
    }
  };
}