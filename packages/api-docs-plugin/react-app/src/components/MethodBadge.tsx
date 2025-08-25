interface MethodStyles {
    bg: string;
    text: string;
}

const methodStyles: Record<string, MethodStyles> = {
    GET: { bg: 'bg-blue-600', text: 'text-white' },
    POST: { bg: 'bg-green-600', text: 'text-white' },
    PUT: { bg: 'bg-yellow-500', text: 'text-white' },
    DELETE: { bg: 'bg-red-600', text: 'text-white' },
    PATCH: { bg: 'bg-teal-600', text: 'text-white' },
    HEAD: { bg: 'bg-gray-600', text: 'text-white' },
    OPTIONS: { bg: 'bg-gray-600', text: 'text-white' },
};

export const MethodBadge: React.FC<{ method: string }> = ({ method }) => {
    const styles = methodStyles[method.toUpperCase()] || { bg: 'bg-purple-600', text: 'text-white' };
    
    return (
        <span className={`inline-flex items-center justify-center px-3 py-1 text-xs font-bold rounded ${styles.bg} ${styles.text} min-w-[4rem]`}>
            {method.toUpperCase()}
        </span>
    );
}; 