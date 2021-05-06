import { mock, SchemaLike } from "mock-json-schema";
import { Definition } from "typescript-json-schema";


const generateMockData = (schema: Definition) => {
    const mockData = mock(schema as SchemaLike);
    return mockData;
};

export default generateMockData;