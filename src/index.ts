import AppContext from "./AppContext";
import Flit from "./framework/Flit";

/**
 * Main entry point for starting the service.
 *
 * Must exit with an exit code greater than 1 in case app
 * could not be started.
 */
(async function () {
    new Flit<AppContext>({
        name: "Test app",
        db: {
            uri: "mongodb://localhost:27017/test-db"
        },
        debug: false,
        // mockApi: [{ method: HttpMethod.get, path: "/user/:id" }]
    }).start();
})();


export default () => { };


