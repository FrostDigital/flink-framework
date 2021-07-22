import { mock, SchemaLike } from "mock-json-schema";
import { Definition } from "ts-json-schema-generator";

const generateMockData = (schema: Definition) => {
  // TODO: mock-json-schema does not seem to handle `examples` array, might want to switch to json-schema-faker
  const mockData = mock(schema as SchemaLike);
  return mockData;
};

export default generateMockData;
