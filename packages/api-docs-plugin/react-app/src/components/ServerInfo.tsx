interface ServerInfoProps {
    baseUrl?: string;
    description?: string;
}

export const ServerInfo: React.FC<ServerInfoProps> = ({ 
    baseUrl = window.location.origin, 
    description = "Production server" 
}) => {
    return (
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Server</h2>
            <div className="flex items-center gap-4">
                <select className="block w-full max-w-md rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    <option value={baseUrl}>{baseUrl} - {description}</option>
                </select>
            </div>
            <p className="mt-2 text-sm text-gray-500">
                Base URL for all API endpoints
            </p>
        </div>
    );
};
