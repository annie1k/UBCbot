import {InsightError} from "./controller/IInsightFacade";
import DataType, {SchemaType} from "./dataObject/dataType";
import {isObject} from "./helpers/verifyInput";
import {
	Filter,
	LogicComparison,
	MComparison,
	Negation,
	SComparison,
	MComparator,
	Logic,
	DataObject,
	MComparisonObj,
} from "./types";

export default class QueryHandler {
	private dataType: DataType;
	constructor(dataType: DataType) {
		this.dataType = dataType;
	}

	/**
	 * @returns List of data objects after performing the specified.
	 */
	public performFilter(filter: Filter | Record<string, never>, dataset: DataObject[], id: string): DataObject[] {
		if (!isObject(filter)) {
			throw new InsightError("Filter is not an object");
		}
		if (Object.keys(filter).length === 0) {
			return dataset;
		}
		return dataset.filter((value) => {
			return this.handleFilter(filter as Filter, value as DataObject, id);
		});
	}

	private handleFilter(filter: Filter, data: DataObject, id: string): boolean {
		if (!isObject(filter) || Object.keys(filter).length !== 1) {
			throw new InsightError("Invalid filter");
		}
		if ("OR" in filter || "AND" in filter) {
			return this.handleLogicComparison(filter as LogicComparison, data, id);
		} else if ("LT" in filter || "GT" in filter || "EQ" in filter) {
			return this.handleMComparison(filter as MComparison, data, id);
		} else if ("IS" in filter) {
			return this.handleSComparison(filter as SComparison, data, id);
		} else if ("NOT" in filter) {
			return this.handleNegation(filter as Negation, data, id);
		} else {
			throw new InsightError("Invalid filter");
		}
	}

	private handleLogicComparison(filter: LogicComparison, data: DataObject, id: string): boolean {
		if (filter.AND) {
			if (!Array.isArray(filter.AND) || filter.AND.length < 1) {
				throw new InsightError("AND must be a non-empty array");
			}
			for (const subFilter of filter.AND) {
				if (!this.handleFilter(subFilter, data, id)) {
					return false;
				}
			}
			return true;
		} else {
			if (!Array.isArray(filter.OR) || filter.OR.length < 1) {
				throw new InsightError("OR must be a non-empty array");
			}
			for (const subFilter of filter.OR) {
				if (this.handleFilter(subFilter, data, id)) {
					return true;
				}
			}
			return false;
		}
	}

	private handleMComparison(filter: MComparison, data: DataObject, id: string): boolean {
		const comparisonType: MComparator = Object.keys(filter)[0] as MComparator;
		if (!(comparisonType in MComparisonObj)) {
			throw new InsightError("Invalid comparison type");
		}
		const queryKey = Object.keys(filter[comparisonType])[0];
		const value = data[queryKey];
		if (Object.keys(filter[comparisonType]).length !== 1) {
			throw new InsightError("filter requires one field");
		}
		if (!this.dataType.isValidKey(queryKey, id, SchemaType.Number)) {
			throw new InsightError("filter has invalid key");
		}
		if (typeof value !== "number" || typeof filter[comparisonType]?.[queryKey] !== "number") {
			throw new InsightError("Value is not of type number");
		}

		if (filter.LT) {
			return filter.LT[queryKey] > value;
		} else if (filter.GT) {
			return filter.GT[queryKey] < value;
		} else {
			return filter.EQ[queryKey] === value;
		}
	}

	private handleSComparison(filter: SComparison, data: DataObject, id: string): boolean {
		if (!isObject(filter.IS)) {
			throw new InsightError("IS filter should be an object");
		}
		if (Object.keys(filter.IS).length !== 1) {
			throw new InsightError("IS filter requires one field");
		}
		const queryKey = Object.keys(filter.IS)[0];
		if (!this.dataType.isValidKey(queryKey, id, SchemaType.String)) {
			throw new InsightError("IS filter has invalid key");
		}

		const filterString = filter.IS[queryKey];

		const dataString = data[queryKey];

		if (
			typeof dataString !== "string" ||
			typeof filterString !== "string" ||
			(filterString.length > 1 && filterString.substring(1, filterString.length - 1).includes("*"))
		) {
			throw new InsightError("Field is not of type string (or asterisk exists in the middle)");
		}

		if (filterString === "") {
			return dataString === "";
		}

		const filterStringWithoutAsterisk = filterString.replaceAll("*", "");
		if (filterString.startsWith("*") && filterString.endsWith("*")) {
			return dataString.includes(filterStringWithoutAsterisk);
		} else if (filterString.startsWith("*")) {
			return dataString.endsWith(filterStringWithoutAsterisk);
		} else if (filterString.endsWith("*")) {
			return dataString.startsWith(filterStringWithoutAsterisk);
		} else {
			return dataString === filterStringWithoutAsterisk;
		}
	}

	private handleNegation(filter: Negation, data: DataObject, id: string): boolean {
		return !this.handleFilter(filter.NOT, data, id);
	}
}
