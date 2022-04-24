import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import JSZip from "jszip";
import {existsSync, mkdirSync, readdirSync, readJsonSync, removeSync, writeJsonSync} from "fs-extra";
import {Dataset, Query, DataObject} from "../types";
import {orderQueries, selectQueryFields} from "../querySelection";
import {checkQuery, getDatasetIdForQuery, getDataType} from "../helpers/helpers";
import {isValidId} from "../addDatasetHelpers";
import QueryHandler from "../queryHandlers";
import {groupAndApply} from "../query/queryGroup";
import {checkIsValidQuery} from "../helpers/verifyInput";

const DATA_DIRECTORY = "data";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	private datasets: Record<string, Dataset>;

	constructor() {
		console.log("InsightFacadeImpl::init()");
		this.datasets = {};

		if (!existsSync(DATA_DIRECTORY)) {
			return;
		}

		const dataIDs = readdirSync(DATA_DIRECTORY);
		const size = dataIDs.length;
		for (let i = 0; i < size; i++) {
			let path = DATA_DIRECTORY + "/" + String(dataIDs[i]);
			const dataset: Dataset = readJsonSync(path);
			this.datasets[dataIDs[i]] = dataset;
		}
	}

	//
	public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		const dataType = getDataType(kind);

		if (!isValidId(id)) {
			return Promise.reject(new InsightError("Invalid ID"));
		}
		if (!existsSync(DATA_DIRECTORY)) {
			mkdirSync(DATA_DIRECTORY);
		}
		if (readdirSync(DATA_DIRECTORY).includes(id)) {
			return Promise.reject(new InsightError("Database ID already exists"));
		}

		return JSZip.loadAsync(content, {base64: true})
			.then((zip) => {
				return dataType.loadDataFromZip(zip, id);
			})
			.then((data) => {
				const datasetObject: Dataset = {
					data: data,
					type: kind,
					numRows: data.length,
				};

				writeJsonSync(`${DATA_DIRECTORY}/${id}`, datasetObject);
				this.datasets[id] = datasetObject;
				return readdirSync(DATA_DIRECTORY);
			})
			.catch((error) => {
				return Promise.reject(new InsightError(error));
			});
	}

	public removeDataset(id: string): Promise<string> {
		if (!isValidId(id)) {
			return Promise.reject(new InsightError("Invalid ID"));
		}
		if (!existsSync(DATA_DIRECTORY) || !readdirSync(DATA_DIRECTORY).includes(id)) {
			return Promise.reject(new NotFoundError("Dataset not found"));
		}
		removeSync(`${DATA_DIRECTORY}/${id}`);
		if (id in this.datasets) {
			delete this.datasets[id];
		}

		return Promise.resolve(id);
	}

	public performQuery(query: unknown): Promise<InsightResult[]> {
		const err = checkQuery(query);
		if (err !== undefined) {
			return err;
		}
		const q = query as Query;
		const id = getDatasetIdForQuery(q);
		if (id === undefined) {
			return Promise.reject(new InsightError("No valid course key found"));
		}

		let dataset: Dataset;
		if (id in this.datasets) {
			dataset = this.datasets[id];
		} else {
			if (!existsSync(DATA_DIRECTORY) || !readdirSync(DATA_DIRECTORY).includes(id)) {
				return Promise.reject(new InsightError("Dataset with given ID was not added yet"));
			}
			dataset = readJsonSync(`${DATA_DIRECTORY}/${id}`);
			this.datasets[id] = dataset;
		}
		const dataType = getDataType(dataset.type);

		try {
			checkIsValidQuery(q, id, dataType);
		} catch (e) {
			return Promise.reject(e);
		}

		let returnedDataset: DataObject[] = [];
		try {
			const queryHandler = new QueryHandler(dataType);
			returnedDataset = queryHandler.performFilter(q.WHERE, dataset.data as DataObject[], id);
			if (q.TRANSFORMATIONS) {
				returnedDataset = groupAndApply(returnedDataset, q.TRANSFORMATIONS, id, dataType);
			}
			returnedDataset = selectQueryFields(returnedDataset, q.OPTIONS.COLUMNS, id, dataType, q.TRANSFORMATIONS);
			if (q.OPTIONS.ORDER) {
				returnedDataset = orderQueries(returnedDataset, q.OPTIONS.ORDER, id, dataType, q.TRANSFORMATIONS);
			}
		} catch (e) {
			return Promise.reject(e);
		}
		if (returnedDataset.length > 5000) {
			return Promise.reject(new ResultTooLargeError("Query result too large"));
		}
		return Promise.resolve(returnedDataset);
	}

	// List all currently added datasets, their types, and #rows
	public listDatasets(): Promise<InsightDataset[]> {
		if (!existsSync(DATA_DIRECTORY)) {
			return Promise.resolve([]);
		}

		const dataIDs = readdirSync(DATA_DIRECTORY);
		const size = dataIDs.length;

		const insightDataset: InsightDataset[] = [];
		for (let i = 0; i < size; i++) {
			let path = DATA_DIRECTORY + "/" + String(dataIDs[i]);
			const dataset: Dataset = readJsonSync(path);
			const collection: InsightDataset = {
				id: dataIDs[i],
				kind: dataset.type,
				numRows: dataset.numRows,
			};
			insightDataset.push(collection);
			this.datasets[dataIDs[i]] = dataset;
		}
		return Promise.resolve(insightDataset);
	}
}
