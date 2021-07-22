import { JSONSchema7Definition } from "json-schema";
import { mock, SchemaLike } from "mock-json-schema";

const generateMockData = (schema: JSONSchema7Definition) => {
  // TODO: mock-json-schema does not seem to handle `examples` array, might want to switch to json-schema-faker
  const mockData = mock(schema as SchemaLike);
  return mockData;
};

export default generateMockData;
