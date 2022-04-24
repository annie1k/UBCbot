import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import DataCourse from "../dataObject/dataCourse";
import DataType from "../dataObject/dataType";
import DataRoom from "../dataObject/dataRoom";
import {CourseDataSchema, Query, Transformation} from "../types";

export const isValidKeyOrApplyField = (
	key: string,
	id: string,
	dataType: DataType,
	transformation?: Transformation
) => {
	if (transformation) {
		return (
			dataType.isValidKey(key, id) ||
			Object.values(transformation.APPLY).find((val) => Object.keys(val)[0] === key) !== undefined
		);
	} else {
		return dataType.isValidKey(key, id);
	}
};

/**
 * Checks to ensure that a query has its top level fields (WHERE and COLUMNS)
 */
export const checkQuery = (query: unknown): Promise<never> | undefined => {
	const q = query as Query;
	if (typeof query !== "object" || query === null) {
		return Promise.reject(new InsightError("Query is not an object"));
	}
	if (Object.keys(query).length !== 2 && Object.keys(query).length !== 3) {
		return Promise.reject(new InsightError("Query has missing/too many fields: " + Object.keys(query).length));
	}
	if (Object.keys(query).length === 3 && !q.TRANSFORMATIONS) {
		return Promise.reject(new InsightError("Missing transformation"));
	}

	if (!q.WHERE || typeof q.WHERE !== "object") {
		return Promise.reject(new InsightError("Invalid WHERE field"));
	}
	// TODO: figure out the typescript (currently using "as")
	if (!q.OPTIONS || typeof q.OPTIONS !== "object") {
		return Promise.reject(new InsightError("Invalid OPTIONS field"));
	}
	if (!q.OPTIONS.COLUMNS || !Array.isArray(q.OPTIONS.COLUMNS) || q.OPTIONS.COLUMNS.length === 0) {
		return Promise.reject(new InsightError("Invalid COLUMNS field"));
	}
	return;
};

/**
 *
 * @returns null if invalid
 */
export const getDataType = (kind: InsightDatasetKind): DataType => {
	switch (kind) {
		case InsightDatasetKind.Courses:
			return new DataCourse();
		case InsightDatasetKind.Rooms:
			return new DataRoom();
		default:
			// Should never reach here
			return new DataCourse();
	}
};

export const getDatasetIdForQuery = (query: Query) => {
	let id = query.OPTIONS.COLUMNS.find((str) => str.split("_").length === 2)?.split("_")[0];
	if (id === undefined) {
		const group = query.TRANSFORMATIONS?.GROUP;
		if (Array.isArray(group)) {
			id = group.find((str) => str.split("_").length === 2)?.split("_")[0];
		}
	}
	return id;
};
