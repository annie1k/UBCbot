import {InsightError} from "../controller/IInsightFacade";
import DataType from "../dataObject/dataType";
import {ApplyToken, Query, validApplyTokens} from "../types";

export const checkIsValidQuery = (query: unknown, databaseId: string, dataType: DataType): void => {
	if (!isObject(query)) {
		throw new InsightError("Query is not an object");
	}
	if (!("WHERE" in query) || !("OPTIONS" in query)) {
		throw new InsightError("WHERE or OPTIONS does not exist in query");
	}
	if (Object.keys(query).length !== 2) {
		if (Object.keys(query).length === 3 && !("TRANSFORMATIONS" in query)) {
			throw new InsightError("Invalid number of keys in QUERY");
		} else if (Object.keys(query).length !== 3) {
			throw new InsightError("Invalid number of keys in QUERY");
		}
	}

	const q = query as unknown as Query;

	const transKeys = new Set<string>();
	if (q.TRANSFORMATIONS?.APPLY && Array.isArray(q.TRANSFORMATIONS.APPLY)) {
		q.TRANSFORMATIONS.APPLY.forEach((applyObj) => {
			if (Object.keys(applyObj).length === 1) {
				if (transKeys.has(Object.keys(applyObj)[0])) {
					throw new InsightError("Repeated Apply key");
				}
				transKeys.add(Object.keys(applyObj)[0]);
			}
		});
	}

	isValidWHERE(q.WHERE, databaseId, dataType, transKeys);
	isValidOPTIONS(q.OPTIONS, databaseId, dataType, transKeys);
	if ("TRANSFORMATIONS" in query) {
		const columns = q.OPTIONS.COLUMNS;
		isValidTRANSFORMATIONS(q.TRANSFORMATIONS, databaseId, dataType);
		for (const key of columns) {
			if (!transKeys.has(key) && !q.TRANSFORMATIONS?.GROUP.includes(key)) {
				throw new InsightError("All column terms must correspond to either GROUP keys or applykeys");
			}
		}
	}
};

const isValidWHERE = (query: unknown, databaseId: string, dataType: DataType, transKeys: Set<string>): void => {
	if (!isObject(query)) {
		throw new InsightError("WHERE is not an object");
	}
};

const isValidOPTIONS = (query: unknown, databaseId: string, dataType: DataType, transKeys: Set<string>): void => {
	if (!isObject(query)) {
		throw new InsightError("OPTIONS is not an object");
	}
	if (!("COLUMNS" in query) || !Array.isArray(query.COLUMNS)) {
		throw new InsightError("Invalid COLUMNS");
	}
	if (Object.keys(query).length !== 1) {
		if (Object.keys(query).length === 2 && !("ORDER" in query)) {
			throw new InsightError("Invalid number of keys in OPTIONS");
		} else if (Object.keys(query).length !== 2) {
			throw new InsightError("Invalid number of keys in OPTIONS");
		}
	}
	for (const key of query.COLUMNS) {
		if (!dataType.isValidKey(key, databaseId) && !transKeys.has(key)) {
			throw new InsightError("Invalid key in COLUMNS");
		}
	}
	if ("ORDER" in query) {
		if (typeof query.ORDER === "string") {
			if (!query.COLUMNS.includes(query.ORDER)) {
				throw new InsightError("Invalid ORDER key");
			}
		} else if (typeof query.ORDER === "object") {
			if (!isObject(query.ORDER)) {
				throw new InsightError("ORDER is not an object or string");
			}
			if (!("dir" in query.ORDER) || !("keys" in query.ORDER) || Object.keys(query.ORDER).length !== 2) {
				throw new InsightError("Invalid COLUMNS fields");
			}
			if (typeof query.ORDER.dir !== "string" || !Array.isArray(query.ORDER.keys)) {
				throw new InsightError("Invalid COLUMN field types");
			}
			if (query.ORDER.dir !== "DOWN" && query.ORDER.dir !== "UP") {
				throw new InsightError("Invalid ORDER direction");
			}
			for (const key of query.ORDER.keys) {
				if (typeof key !== "string" || !query.COLUMNS.includes(key)) {
					throw new InsightError("Invalid ORDER key");
				}
			}
		} else {
			throw new InsightError("Invalid ORDER type");
		}
	}
};

const isValidTRANSFORMATIONS = (query: unknown, databaseId: string, dataType: DataType): void => {
	if (!isObject(query)) {
		throw new InsightError("TRANSFORMATIONS is not an object");
	}
	if (!("GROUP" in query) || !("APPLY" in query) || Object.keys(query).length !== 2) {
		throw new InsightError("TRANSFORMATIONS missing GROUP or APPLY");
	}
	if (!Array.isArray(query.GROUP) || !Array.isArray(query.APPLY)) {
		throw new InsightError("GROUP or APPLY is not an array");
	}
	if (query.GROUP.length < 1) {
		throw new InsightError("GROUP should have at least one entry");
	}

	for (const str of query.GROUP) {
		if (typeof str !== "string" || !dataType.isValidKey(str, databaseId)) {
			throw new InsightError("Item in GROUP is not valid");
		}
	}
	for (const obj of query.APPLY) {
		if (!isObject(obj) || Object.keys(obj).length !== 1) {
			throw new InsightError("Item in APPLY is not an object with one key");
		}
		const applyTokenObj = obj[Object.keys(obj)[0]];
		if (!isObject(applyTokenObj) || Object.keys(applyTokenObj).length !== 1) {
			throw new InsightError("Aggregation in APPLY is not an object with one key");
		}
		const applyToken = Object.keys(applyTokenObj)[0];
		const validTypes = validApplyTokens[applyToken as ApplyToken];
		if (!validTypes) {
			throw new InsightError("Aggregation in APPLY has invalid ApplyToken");
		}
		const refDataKey = applyTokenObj[applyToken];
		if (
			typeof refDataKey !== "string" ||
			!dataType.isValidKey(refDataKey, databaseId) ||
			!validTypes.includes(dataType.getType(refDataKey))
		) {
			throw new InsightError("Aggregation in APPLY refers to invalid key");
		}
	}
};

export const isObject = (obj: unknown): obj is Record<string, unknown> =>
	typeof obj === "object" && !Array.isArray(obj) && obj !== null;
