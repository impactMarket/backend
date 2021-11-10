interface IField {
    [key: string]: string[] | [];
}

export const fetchData = (queryString: string): IField => {
    const fields = queryString.split(';');

    const result = fields.reduce((acc, el) => {
        const value = el.trim();
        if (value) {
            const splitedValue = value.split('.');
            if (splitedValue.length > 1) {
                if (splitedValue[1] === '*') {
                    acc[splitedValue[0]] = [];
                } else if (acc[splitedValue[0]]) {
                    (acc[splitedValue[0]] as string[]).push(splitedValue[1]);
                } else {
                    acc[splitedValue[0]] = [splitedValue[1]];
                }
            } else {
                if (splitedValue[0] === '*') {
                    acc.root = [];
                } else if (acc.root) {
                    (acc.root as string[]).push(splitedValue[0]);
                } else {
                    acc.root = splitedValue;
                }
            }
        }
        return acc;
    }, {} as IField);

    return result;
};
