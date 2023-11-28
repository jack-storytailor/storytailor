export const objectToString = (obj: any, separator?: string) => {
	if (obj === undefined || obj === null) {
		return '';
	}

	separator = separator || '';

	if (obj.__text instanceof Array) {
		let result = obj.__text.join(separator);
		return result;
	}

	if (obj instanceof Array) {
		let result = obj.join(separator);
		return result;
	}

	if (obj instanceof Object) {
		return '';
	}

	return obj.toString();
}

export const testFunction = (param1, param2) => {
	return `param1: ${objectToString(param1)}, param2: ${objectToString(param2)}`;
}

export const getSerializer = () => {
	return {
		serialize: (obj, separator) => {
			return objectToString(obj, separator);
		}
	}
}

export const subitemsToString = (obj, separator, headerTag, headerAttr, contentTag, contentAttr) => {
	if (!obj) {
		return undefined;
	}

	let serializer = getSerializer();

	let headerPrefix = '';
	let headerPostfix = '';
	if (headerTag) {
		headerPrefix = `<${headerTag} ${headerAttr || ''}>`;
		headerPostfix = `</${headerTag}>`;
	}

	let contentPrefix = '';
	let contentPostfix = '';
	if (contentTag) {
		contentPrefix = `<${contentTag} ${contentAttr || ''}>`;
		contentPostfix = `</${contentTag}>`;
	}

	let result = [];
	for (const key in obj) {
		if (!obj.hasOwnProperty(key) || key === "__text") {
			continue;
		}

		const item = obj[key];
		const contentText = `${contentPrefix}${serializer.serialize(item, separator)}${contentPostfix}`;
		const headerText = `${headerPrefix}${key}${headerPostfix}`;

		const itemText = `${headerText}${separator || ''}${contentText}`;
		result = [...result, itemText];
	}

	let resultText = result.join(separator);
	return resultText;
}

export const clearText = (context) => {
	if (!context || !context.__text) {
		return context;
	}

	return {
		...context,
		__text: []
	};
}
