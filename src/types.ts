import {InsightDatasetKind} from "./controller/IInsightFacade";

// DATA
export interface CourseZipData {
	Section: string; // For determining whether the year is 1900
	Subject: string;
	Course: string;
	Avg: number;
	Professor: string;
	Title: string;
	Pass: number;
	Fail: number;
	Audit: number;
	id: number;
	Year: string;
}
export const CourseZipDataSchema = {
	Subject: "string",
	Course: "string",
	Avg: "number",
	Professor: "string",
	Title: "string",
	Pass: "number",
	Fail: "number",
	Audit: "number",
	id: "number",
	Year: "string",
};

export const CourseSKeySchema = {
	dept: "string",
	id: "string",
	instructor: "string",
	uuid: "string",
	title: "string",
};

export const CourseMKeySchema = {
	avg: "number",
	pass: "number",
	fail: "number",
	audit: "number",
	year: "number",
};

export const CourseDataSchema = {...CourseSKeySchema, ...CourseMKeySchema};

export const RoomSKeySchema = {
	fullname: "string",
	shortname: "string",
	number: "string",
	name: "string",
	address: "string",
	type: "string",
	furniture: "string",
	href: "string",
};

export const RoomMKeySchema = {
	lat: "number",
	lon: "number",
	seats: "number",
};

export const RoomDataSchema = {...RoomSKeySchema, ...RoomMKeySchema};

export type DataObject = Record<string, string | number>;

export interface Dataset {
	data: DataObject[];
	type: InsightDatasetKind;
	numRows: number;
}

export interface Order {
	// TODO: double check if both of them can be skipped or they much appear together
	dir: Direction;
	keys: string[];
}

// QUERY
export interface Query {
	WHERE: Filter | Record<string, never>;
	OPTIONS: {
		COLUMNS: string[];
		ORDER?: Order | string;
	};
	TRANSFORMATIONS?: Transformation;
}

export const validApplyTokens = {
	MAX: ["number"],
	MIN: ["number"],
	AVG: ["number"],
	COUNT: ["number", "string"],
	SUM: ["number"],
};
export type ApplyToken = keyof typeof validApplyTokens;

export interface Transformation {
	GROUP: string[];
	APPLY: Apply[];
}
export type Apply = Record<string, Record<ApplyToken, string>>;

export type Filter = LogicComparison | MComparison | SComparison | Negation;

type AllLogicComparison = {
	[key in Logic]: Filter[];
};

export type LogicComparison = Explode<AllLogicComparison>;

type AllMComparison = {
	[key in MComparator]: {[key: string]: number};
};

export type MComparison = Explode<AllMComparison>;

export interface SComparison {
	IS: {[key: string]: string};
}

export interface Negation {
	NOT: Filter;
}

export const LogicObj = {AND: true, OR: true};
export type Logic = keyof typeof LogicObj;

export const MComparisonObj = {LT: true, GT: true, EQ: true};
export type MComparator = keyof typeof MComparisonObj;

// For selecting a single key out of an enum
// Reference: https://stackoverflow.com/questions/62158066/typescript-type-where-an-object-consists-of-exactly-a-single-property-of-a-set-o
type Explode<T> = keyof T extends infer K
	? K extends unknown
		? {[I in keyof T]: I extends K ? T[I] : never}
		: never
	: never;

export type Direction = "UP" | "DOWN";
