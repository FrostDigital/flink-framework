import FlitRepo from "./FlitRepo";

interface FlitContext {
    repos: {
        [x: string]: FlitRepo<any>
    }
}

export default FlitContext;