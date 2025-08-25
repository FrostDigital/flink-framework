export type SchemaProperty = {
    name: string;
    type: string;
    description?: string;
    required?: boolean;
};

export const SchemaProperties: React.FC<{ properties: SchemaProperty[] }> = ({ properties }) => (
    <div className="bg-gray-50 rounded-md p-4 font-mono text-sm">
        <table className="w-full">
            <thead>
                <tr className="text-left border-b border-gray-200">
                    <th className="pb-2 pr-4 font-semibold text-gray-700">Name</th>
                    <th className="pb-2 pr-4 font-semibold text-gray-700">Type</th>
                    <th className="pb-2 font-semibold text-gray-700">Description</th>
                </tr>
            </thead>
            <tbody>
                {properties.map((prop, index) => (
                    <tr key={prop.name} className={index > 0 ? "border-t border-gray-200" : ""}>
                        <td className="py-2 pr-4">
                            <span className="text-blue-600">{prop.name}</span>
                            {prop.required && (
                                <span className="ml-1 text-red-600">*</span>
                            )}
                        </td>
                        <td className="py-2 pr-4 text-gray-600">{prop.type}</td>
                        <td className="py-2 text-gray-600 font-sans">
                            {prop.description || "-"}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
); 