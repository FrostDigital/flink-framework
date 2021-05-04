import Flit from "./flit/Flit";



/**
 * Main entry point for starting the service.
 *
 * Must exit with an exit code greater than 1 in case app
 * could not be started.
 */
(async function () {
    new Flit({
        name: "Test app",
    }).start();
})();


export default () => { };


