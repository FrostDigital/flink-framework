import { SchemaProperty } from '../components/SchemaProperties';

interface TreeNode {
    type?: string;
    required?: boolean;
    isArray?: boolean;
    description?: string;
    children?: { [key: string]: TreeNode };
}

export function generateTypeScriptInterface(properties: SchemaProperty[], interfaceName: string): string {
    if (!properties || properties.length === 0) {
        return `interface ${interfaceName} {}`;
    }

    // Group properties by base name for nested structures
    const tree: { [key: string]: TreeNode } = {};
    
    properties.forEach(prop => {
        const parts = prop.name.split('.');
        let current = tree;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isArray = part.endsWith('[]');
            const cleanPart = isArray ? part.slice(0, -2) : part;
            
            if (i === parts.length - 1) {
                // Last part - add the property
                current[cleanPart] = {
                    type: prop.type,
                    required: prop.required,
                    isArray: isArray || prop.type === 'array',
                    description: prop.description
                };
            } else {
                // Intermediate part - create nested structure
                if (!current[cleanPart]) {
                    current[cleanPart] = { 
                        children: {},
                        isArray,
                        required: true // Intermediate objects are usually required
                    };
                } else if (!current[cleanPart].children) {
                    current[cleanPart].children = {};
                }
                
                current = current[cleanPart].children!;
            }
        }
    });

    // Convert tree to TypeScript interface
    function renderInterface(obj: { [key: string]: TreeNode }, indent: string = '  '): string {
        let result = '';
        
        Object.entries(obj).forEach(([key, value]) => {
            if (value.children) {
                // This is a nested object (possibly an array of objects)
                const childInterface = renderInterface(value.children, indent + '  ');
                const optional = value.required === false ? '?' : '';
                
                if (value.isArray) {
                    // Array of objects
                    result += `${indent}${key}${optional}: {\n${childInterface}${indent}}[];\n`;
                } else {
                    // Single nested object
                    result += `${indent}${key}${optional}: {\n${childInterface}${indent}};\n`;
                }
            } else {
                // Simple property
                let tsType = mapToTypeScriptType(value.type || 'any');
                
                // If the property itself is marked as array, add array brackets
                if (value.isArray) {
                    if (tsType === 'any[]') {
                        // Already an array type from mapToTypeScriptType
                    } else {
                        tsType += '[]';
                    }
                }
                
                const optional = value.required ? '' : '?';
                const comment = value.description ? `${indent}/** ${value.description} */\n` : '';
                result += `${comment}${indent}${key}${optional}: ${tsType};\n`;
            }
        });
        
        return result;
    }

    const interfaceBody = renderInterface(tree);
    return `interface ${interfaceName} {\n${interfaceBody}}`;
}

function mapToTypeScriptType(schemaType: string): string {
    switch (schemaType.toLowerCase()) {
        case 'string':
            return 'string';
        case 'number':
        case 'integer':
        case 'float':
        case 'double':
            return 'number';
        case 'boolean':
            return 'boolean';
        case 'array':
            return 'any[]';
        case 'object':
            return 'Record<string, any>';
        case 'null':
            return 'null';
        case 'any':
            return 'any';
        default:
            // Might be a custom type or unknown
            return 'any';
    }
}

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        return false;
    }
}
