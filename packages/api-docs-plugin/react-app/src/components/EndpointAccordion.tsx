import { useState } from "react";
import { MethodBadge } from "./MethodBadge";
import { SchemaProperties, SchemaProperty } from "./SchemaProperties";
import { ChevronDownIcon, ChevronUpIcon } from "./icons";

export type Endpoint = {
    routeProps: {
        path: string;
        method: string;
        mockApi?: boolean;
    };
    schema?: {
        description?: string;
    };
    reqProps: SchemaProperty[];
    resProps: SchemaProperty[];
    queryMetadata?: Record<string, any>;
    paramsMetadata?: Array<{ name: string; description?: string }>;
};

export const EndpointAccordion: React.FC<{ endpoint: Endpoint }> = ({ endpoint }) => {
    const [open, setOpen] = useState(false);
    
    // Get method-specific styling
    const getMethodStyles = (method: string) => {
        switch (method.toUpperCase()) {
            case 'GET':
                return 'border-blue-500 bg-blue-50';
            case 'POST':
                return 'border-green-500 bg-green-50';
            case 'PUT':
                return 'border-yellow-500 bg-yellow-50';
            case 'DELETE':
                return 'border-red-500 bg-red-50';
            case 'PATCH':
                return 'border-teal-500 bg-teal-50';
            default:
                return 'border-purple-500 bg-purple-50';
        }
    };

    const methodStyles = getMethodStyles(endpoint.routeProps.method);

    return (
        <div className={`border-l-4 border ${methodStyles} rounded-lg overflow-hidden`}>
            <button
                className="w-full p-4 flex items-center justify-between hover:bg-opacity-75 transition-colors"
                onClick={() => setOpen(!open)}
            >
                <div className="flex items-center gap-3">
                    <MethodBadge method={endpoint.routeProps.method} />
                    <code className="text-sm font-medium text-gray-900">{endpoint.routeProps.path}</code>
                    {endpoint.routeProps.mockApi && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                            Mocked
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {endpoint.schema?.description && (
                        <span className="text-sm text-gray-600 hidden md:inline">
                            {endpoint.schema.description}
                        </span>
                    )}
                    {open ? (
                        <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                    ) : (
                        <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                    )}
                </div>
            </button>

            {open && (
                <div className="border-t bg-white p-6">
                    {/* Description */}
                    {endpoint.schema?.description && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                            <p className="text-sm text-gray-600">{endpoint.schema.description}</p>
                        </div>
                    )}

                    {/* Parameters */}
                    {endpoint.paramsMetadata && endpoint.paramsMetadata.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Path Parameters</h3>
                            <div className="bg-gray-50 rounded-md p-4">
                                {endpoint.paramsMetadata.map((param, index) => (
                                    <div key={index} className="flex items-start mb-2 last:mb-0">
                                        <code className="text-sm font-mono text-red-600 mr-2">{param.name}</code>
                                        <span className="text-sm text-red-600 font-semibold mr-2">*</span>
                                        {param.description && (
                                            <span className="text-sm text-gray-600">{param.description}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Query Parameters */}
                    {endpoint.queryMetadata && Object.keys(endpoint.queryMetadata).length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Query Parameters</h3>
                            <div className="bg-gray-50 rounded-md p-4">
                                {Object.entries(endpoint.queryMetadata).map(([key, value], index) => (
                                    <div key={index} className="flex items-start mb-2 last:mb-0">
                                        <code className="text-sm font-mono text-blue-600 mr-2">{key}</code>
                                        {value.required && (
                                            <span className="text-sm text-red-600 font-semibold mr-2">*</span>
                                        )}
                                        <span className="text-sm text-gray-600 mr-2">({value.type || 'string'})</span>
                                        {value.description && (
                                            <span className="text-sm text-gray-600">{value.description}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Request Body */}
                    {endpoint.reqProps && endpoint.reqProps.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Request Body</h3>
                            <SchemaProperties properties={endpoint.reqProps} />
                        </div>
                    )}

                    {/* Response */}
                    {endpoint.resProps && endpoint.resProps.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Response</h3>
                            <div className="mb-2">
                                <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                                    200 OK
                                </span>
                            </div>
                            <SchemaProperties properties={endpoint.resProps} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}; 