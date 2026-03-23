interface SortConfigItem {
    field: string;
    order?: 'asc' | 'desc';
}

type SortByOption<T> = string | ((item: T) => any) | SortConfigItem[];

const arraySort = <T = any>(
    options: {
        array?: T[];
        order?: 'asc' | 'desc';
        sortBy?: SortByOption<T> | null;
    } = {},
): T[] => {
    const { array = [], order = 'asc', sortBy = null } = options;

    const getValue = (obj: any, path: string | string[]): any => {
        if (typeof path === 'string') {
            path = path.split('.');
        }
        return path.reduce((acc, part) => acc && acc[part], obj);
    };

    return array.sort((a: T, b: T) => {
        if (Array.isArray(sortBy)) {
            return sortBy.reduce((result: number, current: SortConfigItem) => {
                const { field, order = 'asc' } = current;
                let comparison = 0;

                if (result !== 0) return result;

                const valueA = getValue(a, field);
                const valueB = getValue(b, field);

                if (valueA > valueB) comparison = 1;
                else if (valueA < valueB) comparison = -1;

                if (order === 'desc') comparison *= -1;

                return comparison;
            }, 0);
        }

        let valueA: any, valueB: any;

        if (typeof sortBy === 'string') {
            valueA = getValue(a, sortBy);
            valueB = getValue(b, sortBy);
        } else if (typeof sortBy === 'function') {
            valueA = sortBy(a);
            valueB = sortBy(b);
        } else {
            valueA = a;
            valueB = b;
        }

        // Mantener la lógica original de comparación
        if (order === 'desc') {
            return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
        }

        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    });
};

export default arraySort;

/*
    Usos:

    // Ordenar por propiedad de primer nivel
    sortFunc({
        array: <array>,
        sortBy: '<field>' // Ordenar por la propiedad <field>
        order: <orientation> // default 'asc'
    });

    // Ordenar por propiedad anidada
    sortFunc({
        array: <array>,
        sortBy: '<obj>.<obj_field>.<field>' // Ordenar por la propiedad '<field>' dentro de '<obj>.<obj_field>'
        order: <orientation> // default 'asc'
    });

    // Ordenar por varias propiedades (anidadas y de primer nivel)
    sortFunc({
        array: <array>,
        sortBy: [
            { field: '<obj>.<field_m>', order: 'desc' }, // Ordenar por la propiedad <obj>.<field_m>
            { field: '<field_n>' } // Luego por la propiedad '<field_n>' con orientacion por defecto 'asc'
        ]
    });

    // Ordenar con una función personalizada
    sortFunc({
        array: <array>,
        sortBy: e => e.<obj>.<obj_field>.<field> // Ordenar por ciudad usando una función
    });
*/
