import { useEffect, useState } from "react";
import { Endpoint } from "./components/EndpointAccordion";
import { EndpointGroup } from "./components/EndpointGroup";
import { SchemaProperty } from "./components/SchemaProperties";
import { ServerInfo } from "./components/ServerInfo";
import "./index.css";

interface SchemaPropertyDefinition {
  type: string;
  description?: string;
  properties?: Record<string, SchemaPropertyDefinition>;
  required?: string[];
  items?: SchemaPropertyDefinition;
}

// Helper to flatten properties for dot notation
function flattenProperties(properties: Record<string, SchemaPropertyDefinition>, required: string[] = [], parent = ""): SchemaProperty[] {
  let result: SchemaProperty[] = [];
  for (const [key, value] of Object.entries(properties || {})) {
    const path = parent ? `${parent}.${key}` : key;
    result.push({
      name: path,
      type: value.type,
      description: value.description,
      required: required.includes(key),
    });
    if (value.type === "object" && value.properties) {
      result = result.concat(flattenProperties(value.properties, value.required || [], path));
    }
    if (
      value.type === "array" &&
      value.items &&
      value.items.type === "object" &&
      value.items.properties
    ) {
      result = result.concat(
        flattenProperties(value.items.properties, value.items.required || [], `${path}[]`)
      );
    }
  }
  return result;
}

// Helper to group endpoints by path segments
function groupEndpointsByResource(endpoints: Endpoint[]): Record<string, Endpoint[]> {
  const groups: Record<string, Endpoint[]> = {};
  
  endpoints.forEach(endpoint => {
    // Extract the resource name from the path
    const pathParts = endpoint.routeProps.path.split('/').filter(Boolean);
    const groupName = pathParts[0] || 'default';
    
    if (!groups[groupName]) {
      groups[groupName] = [];
    }
    groups[groupName].push(endpoint);
  });
  
  return groups;
}

function App() {
  const [endpoints, setEndpoints] = useState<Endpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/docs/api")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const endpoints: Endpoint[] = data.routes.map((handler: any) => ({
          ...handler,
          reqProps:
            handler.schema && handler.schema.reqSchema && handler.schema.reqSchema.properties
              ? flattenProperties(
                handler.schema.reqSchema.properties,
                handler.schema.reqSchema.required || []
              )
              : [],
          resProps:
            handler.schema && handler.schema.resSchema && handler.schema.resSchema.properties
              ? flattenProperties(
                handler.schema.resSchema.properties,
                handler.schema.resSchema.required || []
              )
              : [],
        }));
        setEndpoints(endpoints);
        setLoading(false);
      })
      .catch(error => {
        console.error('Failed to fetch API documentation:', error);
        setError('Failed to load API documentation. Please try again later.');
        setLoading(false);
      });
  }, []);

  const groupedEndpoints = groupEndpointsByResource(endpoints);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
              <p className="text-sm text-gray-600 mt-1">REST API reference documentation</p>
            </div>
            <div className="text-sm text-gray-500">
              {endpoints.length} endpoints
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading API documentation...</div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        
        {!loading && !error && endpoints.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            No API endpoints found.
          </div>
        )}
        
        {!loading && !error && endpoints.length > 0 && (
          <>
            <ServerInfo />
            <div className="space-y-8">
              {Object.entries(groupedEndpoints).map(([groupName, groupEndpoints]) => (
                <EndpointGroup
                  key={groupName}
                  name={groupName}
                  endpoints={groupEndpoints}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
