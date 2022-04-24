import {InsightError} from "./controller/IInsightFacade";
import DataType from "./dataObject/dataType";
import {isValidKeyOrApplyField} from "./helpers/helpers";
import {Order, Transformation, DataObject} from "./types";

export const selectQueryFields = (
	filteredData: DataObject[],
	fields: string[],
	id: string,
	dataType: DataType,
	transformation?: Transformation
): DataObject[] => {
	if (fields.length === 0 || !fields.every((field) => isValidKeyOrApplyField(field, id, dataType, transformation))) {
		throw new InsightError("Invalid SELECT field");
	}

	const ret = filteredData.map((data) =>
		Object.assign(
			{},
			...fields.map((field) => {
				return {[field]: data[field]};
			})
		)
	);
	return ret;
};

export const orderQueries = (
	data: DataObject[],
	order: Order | string,
	id: string,
	dataType: DataType,
	transformation?: Transformation
) => {
	if (typeof order === "string") {
		if (!isValidKeyOrApplyField(order, id, dataType, transformation)) {
			throw new InsightError(`Invalid Order key ${order}`);
		}
		data.sort(function (a: DataObject, b: DataObject) {
			const af = a[order];
			const bf = b[order];
			if (af === undefined || bf === undefined || typeof af !== typeof bf) {
				throw new InsightError("Not a sortable key");
			}
			// sort them in order believe this works no matter numbers or strings
			if (af < bf) {
				return -1;
			} else if (af > bf) {
				return 1;
			}
			return 0;
		});
		return data;
	} else if (order.keys) {
		let i = 0;
		order.keys.forEach((key) => {
			if (!isValidKeyOrApplyField(key, id, dataType, transformation)) {
				throw new InsightError(`Invalid Order key ${key}`);
			}
		});
		const objects = sortingHelper(data, i, order, dataType, transformation);
		if (order.dir === "DOWN") {
			objects.reverse();
		}
		return objects;
	} else {
		throw new InsightError("Not sortable key");
	}
};

function sortingHelper(
	data: DataObject[],
	i: number,
	order: Order,
	dataType: DataType,
	transformation: Transformation | undefined
) {
	if (i >= order.keys.length) {
		return data;
	}
	const g = groupBy(data, order.keys[i]);
	Object.entries(g).forEach(([k, group]) => {
		g[k] = sortingHelper(group, i + 1, order, dataType, transformation);
	});

	let groupedData: string[] | number[] = Object.keys(g);

	let isAggregateKey = false;
	if (transformation) {
		const apply = transformation.APPLY.find((applyObj) => {
			return Object.keys(applyObj)[0] === order.keys[i];
		});
		if (apply) {
			isAggregateKey = true;
		}
	}
	if (dataType.mKeySchema[order.keys[i]] || isAggregateKey) {
		groupedData = groupedData.map((key) => Number(key));
	}
	groupedData.sort((a, b) => {
		if (a < b) {
			return -1;
		} else if (a > b) {
			return 1;
		}
		return 0;
	});

	let sortedData: DataObject[] = [];
	groupedData.forEach((key) => {
		sortedData.push(...g[key]);
	});
	return sortedData;
}

function groupBy(data: DataObject[], sortingKey: string) {
	const map: Record<string, DataObject[]> = {};
	data.forEach((item) => {
		const collection = map[item[sortingKey]];
		if (!collection) {
			map[item[sortingKey]] = [item];
		} else {
			collection.push(item);
		}
	});
	return map;
}
