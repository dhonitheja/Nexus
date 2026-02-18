

type SplunkData = Record<string, any>;

export const processSPL = (data: SplunkData[], query: string): SplunkData[] => {
    if (!query) return data;

    const parts = query.split('|').map(p => p.trim());
    let result = [...data];

    for (const part of parts) {
        if (part.startsWith('search ') || !part.startsWith('')) {
            const searchTerms = part.replace(/^search\s+/, '').split(/\s+/);
            result = result.filter(item => {
                return searchTerms.every(term => {
                    if (term.includes('=')) {
                        const [key, value] = term.split('=');
                        // Remove quotes if present
                        const cleanValue = value.replace(/^"|"$/g, '');
                        return String(item[key]) === cleanValue;
                    } else {
                        // Free text search
                        return Object.values(item).some(val =>
                            String(val).toLowerCase().includes(term.toLowerCase())
                        );
                    }
                });
            });
        }

        if (part.startsWith('stats ')) {
            // Basic support for: stats count by key
            // or: stats avg(field) by key
            const args = part.replace('stats ', '');
            if (args.includes('count by')) {
                const [, field] = args.split('count by').map(s => s.trim());
                const groups: Record<string, number> = {};
                result.forEach(item => {
                    const key = item[field] || 'null';
                    groups[key] = (groups[key] || 0) + 1;
                });
                result = Object.entries(groups).map(([name, count]) => ({
                    [field]: name,
                    count
                }));
            } else if (args === 'count') {
                result = [{ count: result.length }];
            }
        }

        if (part.startsWith('head ')) {
            const count = parseInt(part.replace('head ', ''), 10);
            result = result.slice(0, count);
        }

        if (part.startsWith('sort ')) {
            const args = part.replace('sort ', '').trim();
            const desc = args.startsWith('-');
            const field = desc ? args.substring(1) : args;

            result.sort((a, b) => {
                if (a[field] < b[field]) return desc ? 1 : -1;
                if (a[field] > b[field]) return desc ? -1 : 1;
                return 0;
            });
        }

        if (part.startsWith('fields ')) {
            const fields = part.replace('fields ', '').split(',').map(s => s.trim());
            // Handle + (inclusion only) or - (exclusion) syntax strictly roughly
            // For now, assume pure inclusion list
            result = result.map(item => {
                const newItem: any = {};
                fields.forEach(f => {
                    const cleanF = f.replace('+', '').replace('-', ''); // simple strip
                    if (item[cleanF] !== undefined) newItem[cleanF] = item[cleanF];
                });
                return newItem;
            });
        }
    }

    return result;
};
