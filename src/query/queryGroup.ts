import Decimal from "decimal.js";
import {InsightError} from "../controller/IInsightFacade";
import DataType, {SchemaType} from "../dataObject/dataType";
import {Apply, ApplyToken, Transformation, DataObject} from "../types";

export const groupAndApply = (
	dataObjects: DataObject[],
	transformation: Transformation,
	id: string,
	dataType: DataType
): DataObject[] => {
	const dataBuckets: Record<string, DataObject[]> = {};
	const newDataObject: DataObject[] = [];

	for (const data of dataObjects) {
		const stringifiedGroupFields = getStringifiedGroupFields(data, transformation, id, dataType);
		if (dataBuckets[stringifiedGroupFields]) {
			dataBuckets[stringifiedGroupFields].push(data);
		} else {
			dataBuckets[stringifiedGroupFields] = [data];
		}
	}
	for (const [key, vals] of Object.entries(dataBuckets)) {
		const newFields: DataObject = JSON.parse(key);
		for (const apply of transformation.APPLY) {
			newFields[Object.keys(apply)[0]] = aggregate(vals, apply, dataType, id);
		}
		newDataObject.push(newFields);
	}
	return newDataObject;
};

const aggregate = (vals: DataObject[], apply: Apply, dataType: DataType, id: string): string | number => {
	const applyName = Object.keys(apply)[0];
	const operation = Object.keys(apply[applyName])[0] as ApplyToken;
	const refKey = apply[applyName][operation];
	if (!dataType.isValidKey(refKey, id, operation === "COUNT" ? SchemaType.All : SchemaType.Number)) {
		throw new InsightError("Invalid reference key for apply");
	}
	const countSet = new Set<string | number>();
	switch (operation) {
		case "MAX":
			return vals.map((val) => val[refKey]).reduce((acc, val) => (acc > val ? acc : val));
		case "MIN":
			return vals.map((val) => val[refKey]).reduce((acc, val) => (acc < val ? acc : val));
		case "AVG":
			return getAverage(vals, refKey);
		case "COUNT":
			vals.forEach((val) => countSet.add(val[refKey]));
			return countSet.size;
		case "SUM":
			return Number(
				vals
					.map((val) => val[refKey] as number)
					.reduce((acc, val) => acc + val)
					.toFixed(2)
			);
		default:
			throw new InsightError("Invalid operation for APPLY");
	}
};

const getAverage = (vals: DataObject[], refKey: string) => {
	if (vals.length === 0) {
		return 0;
	}
	const sum = vals.map((val) => new Decimal(val[refKey])).reduce((acc, val) => acc.add(val));
	const avg = sum.toNumber() / vals.length;
	return Number(avg.toFixed(2));
};

const getStringifiedGroupFields = (
	data: DataObject,
	transformation: Transformation,
	id: string,
	dataType: DataType
) => {
	const groupedFields: DataObject = {};
	transformation.GROUP.forEach((name) => {
		if (!dataType.isValidKey(name, id)) {
			throw new InsightError("Group name does not exist in data");
		}
		groupedFields[name] = data[name];
	});
	return JSON.stringify(groupedFields); //
};
