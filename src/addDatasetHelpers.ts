import {CourseZipData, CourseZipDataSchema, DataObject} from "./types";

const hasValidCourseFields = (course: CourseZipData): boolean => {
	const courseObj: {[key: string]: string | number} = {...course};
	return Object.entries(CourseZipDataSchema).every(([key, type]) => {
		return typeof courseObj[key] === type;
	});
};
const convertToCourse = (course: CourseZipData, databaseId: string): DataObject => ({
	[`${databaseId}_dept`]: course.Subject,
	[`${databaseId}_id`]: course.Course,
	[`${databaseId}_avg`]: course.Avg,
	[`${databaseId}_instructor`]: course.Professor,
	[`${databaseId}_title`]: course.Title,
	[`${databaseId}_pass`]: course.Pass,
	[`${databaseId}_fail`]: course.Fail,
	[`${databaseId}_audit`]: course.Audit,
	[`${databaseId}_uuid`]: course.id.toString(),
	[`${databaseId}_year`]: course.Section === "overall" ? 1900 : parseInt(course.Year, 10),
});

export const getDatasetObjects = (dataString: string, databaseId: string): DataObject[] => {
	let zipData: {result: CourseZipData[]};
	const courses: DataObject[] = [];
	try {
		zipData = JSON.parse(dataString);
	} catch (err) {
		return [];
	}
	if (!Array.isArray(zipData.result)) {
		return [];
	}
	zipData.result.forEach((zipCourseData) => {
		if (!hasValidCourseFields(zipCourseData)) {
			return;
		}
		courses.push(convertToCourse(zipCourseData, databaseId));
	});

	return courses;
};

export const isValidId = (id: string): boolean => id !== "" && !id.includes("_") && id.trim().length !== 0;
