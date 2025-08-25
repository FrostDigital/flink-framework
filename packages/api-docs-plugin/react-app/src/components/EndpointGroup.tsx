import { useState } from "react";
import { EndpointAccordion, Endpoint } from "./EndpointAccordion";
import { ChevronDownIcon, ChevronUpIcon } from "./icons";

interface EndpointGroupProps {
    name: string;
    endpoints: Endpoint[];
    defaultOpen?: boolean;
}

export const EndpointGroup: React.FC<EndpointGroupProps> = ({ name, endpoints, defaultOpen = true }) => {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="mb-8">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 mb-4 text-lg font-semibold text-gray-900 hover:text-gray-700"
            >
                {open ? (
                    <ChevronDownIcon className="w-5 h-5" />
                ) : (
                    <ChevronUpIcon className="w-5 h-5" />
                )}
                {name}
                <span className="ml-2 px-2 py-1 text-sm font-normal bg-gray-100 text-gray-600 rounded">
                    {endpoints.length}
                </span>
            </button>
            
            {open && (
                <div className="space-y-3">
                    {endpoints.map((endpoint, index) => (
                        <EndpointAccordion key={index} endpoint={endpoint} />
                    ))}
                </div>
            )}
        </div>
    );
};
