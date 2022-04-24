import {CourseMKeySchema, CourseSKeySchema, DataObject} from "../types";
import DataType from "./dataType";
import JSZip from "jszip";
import {getDatasetObjects} from "../addDatasetHelpers";
import {InsightError} from "../controller/IInsightFacade";

export default class DataCourse extends DataType {
	constructor() {
		super(CourseMKeySchema, CourseSKeySchema);
	}

	public loadDataFromZip(zip: JSZip, databaseId: string): Promise<DataObject[]> {
		const files = zip.file(/courses\/.+/);
		return Promise.all(files.map((zipFile) => zipFile.async("string"))).then((dataStrings) => {
			const courses: DataObject[] = [];
			dataStrings.forEach((dataString) => {
				courses.push(...getDatasetObjects(dataString, databaseId));
			});
			if (courses.length === 0) {
				return Promise.reject(new InsightError("No valid course section detected."));
			}
			return courses;
		});
	}
}
