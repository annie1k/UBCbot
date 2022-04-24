import {InsightResult} from "../../../src/controller/IInsightFacade";

interface TestQueryType {
	WHERE: unknown;
	OPTIONS: {
		COLUMNS: string[];
		ORDER?: string;
	};
}

interface QueryObjectOptions {
	checkOrderOnly?: boolean;
}

interface QueryObject {
	query: TestQueryType;
	result: InsightResult[];
	options: QueryObjectOptions;
}

export const exactMatchQueries: QueryObject[] = [
	// Simple query
	{
		query: {
			WHERE: {
				GT: {
					courses_avg: 98,
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg", "courses_uuid"],
				ORDER: "courses_uuid",
			},
		},
		result: [
			{courses_dept: "eece", courses_avg: 98.75, courses_uuid: "10235"},
			{courses_dept: "eece", courses_avg: 98.75, courses_uuid: "10236"},
			{courses_dept: "nurs", courses_avg: 98.71, courses_uuid: "15343"},
			{courses_dept: "nurs", courses_avg: 98.71, courses_uuid: "15344"},
			{courses_dept: "cnps", courses_avg: 99.19, courses_uuid: "26777"},
			{courses_dept: "epse", courses_avg: 98.58, courses_uuid: "29255"},
			{courses_dept: "epse", courses_avg: 98.58, courses_uuid: "29256"},
			{courses_dept: "epse", courses_avg: 98.08, courses_uuid: "33779"},
			{courses_dept: "epse", courses_avg: 98.7, courses_uuid: "33780"},
			{courses_dept: "epse", courses_avg: 98.36, courses_uuid: "33781"},
			{courses_dept: "epse", courses_avg: 98.76, courses_uuid: "44816"},
			{courses_dept: "epse", courses_avg: 98.76, courses_uuid: "44817"},
			{courses_dept: "epse", courses_avg: 98.45, courses_uuid: "49677"},
			{courses_dept: "epse", courses_avg: 98.45, courses_uuid: "49678"},
			{courses_dept: "math", courses_avg: 99.78, courses_uuid: "5373"},
			{courses_dept: "math", courses_avg: 99.78, courses_uuid: "5374"},
			{courses_dept: "epse", courses_avg: 98.8, courses_uuid: "6320"},
			{courses_dept: "spph", courses_avg: 98.98, courses_uuid: "65069"},
			{courses_dept: "spph", courses_avg: 98.98, courses_uuid: "65070"},
			{courses_dept: "nurs", courses_avg: 98.21, courses_uuid: "73638"},
			{courses_dept: "nurs", courses_avg: 98.21, courses_uuid: "73639"},
			{courses_dept: "nurs", courses_avg: 98.5, courses_uuid: "88151"},
			{courses_dept: "nurs", courses_avg: 98.5, courses_uuid: "88152"},
			{courses_dept: "nurs", courses_avg: 98.58, courses_uuid: "96250"},
			{courses_dept: "nurs", courses_avg: 98.58, courses_uuid: "96251"},
		],
		options: {},
	},
	// String search
	{
		query: {
			WHERE: {
				IS: {
					courses_instructor: "kiczales*",
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_id", "courses_avg", "courses_instructor"],
				ORDER: "courses_avg",
			},
		},
		result: [
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 70.11,
				courses_instructor: "kiczales, gregor",
			},
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 70.75,
				courses_instructor: "kiczales, gregor",
			},
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 70.78,
				courses_instructor: "kiczales, gregor",
			},
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 71.07,
				courses_instructor: "kiczales, gregor",
			},
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 71.4,
				courses_instructor: "kiczales, gregor",
			},
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 72.58,
				courses_instructor: "kiczales, gregor",
			},
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 73.13,
				courses_instructor: "kiczales, gregor",
			},
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 73.53,
				courses_instructor: "kiczales, gregor",
			},
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 74.24,
				courses_instructor: "kiczales, gregor",
			},
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 76.98,
				courses_instructor: "kiczales, gregor",
			},
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 77.11,
				courses_instructor: "kiczales, gregor",
			},
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 77.43,
				courses_instructor: "kiczales, gregor",
			},
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 77.69,
				courses_instructor: "kiczales, gregor",
			},
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 84.91,
				courses_instructor: "kiczales, gregor",
			},
			{
				courses_dept: "cpsc",
				courses_id: "110",
				courses_avg: 85.11,
				courses_instructor: "kiczales, gregor",
			},
		],
		options: {},
	},
	// Complex
	{
		query: {
			WHERE: {
				AND: [
					{
						NOT: {
							IS: {
								courses_instructor: "*a*",
							},
						},
					},
					{
						NOT: {
							IS: {
								courses_instructor: "*e*",
							},
						},
					},
					{
						NOT: {
							IS: {
								courses_instructor: "*i*",
							},
						},
					},
					{
						NOT: {
							IS: {
								courses_instructor: "*s*",
							},
						},
					},
					{
						NOT: {
							IS: {
								courses_instructor: "*u*",
							},
						},
					},
					{
						NOT: {
							IS: {
								courses_instructor: "",
							},
						},
					},
					{
						EQ: {
							courses_fail: 0,
						},
					},
				],
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_id", "courses_avg", "courses_fail"],
				ORDER: "courses_avg",
			},
		},
		result: [
			{courses_dept: "geog", courses_id: "318", courses_avg: 72.72, courses_fail: 0},
			{
				courses_dept: "geog",
				courses_id: "316",
				courses_avg: 73.04,
				courses_fail: 0,
			},
			{
				courses_dept: "engl",
				courses_id: "110",
				courses_avg: 73.17,
				courses_fail: 0,
			},
			{
				courses_dept: "geog",
				courses_id: "316",
				courses_avg: 73.69,
				courses_fail: 0,
			},
			{
				courses_dept: "engl",
				courses_id: "110",
				courses_avg: 73.78,
				courses_fail: 0,
			},
			{
				courses_dept: "geog",
				courses_id: "319",
				courses_avg: 73.86,
				courses_fail: 0,
			},
			{
				courses_dept: "geog",
				courses_id: "316",
				courses_avg: 74.51,
				courses_fail: 0,
			},
			{
				courses_dept: "geog",
				courses_id: "318",
				courses_avg: 75.89,
				courses_fail: 0,
			},
			{
				courses_dept: "geog",
				courses_id: "318",
				courses_avg: 75.97,
				courses_fail: 0,
			},
			{
				courses_dept: "geog",
				courses_id: "446",
				courses_avg: 77.47,
				courses_fail: 0,
			},
			{courses_dept: "geog", courses_id: "410", courses_avg: 78.12, courses_fail: 0},
			{
				courses_dept: "geog",
				courses_id: "446",
				courses_avg: 79.72,
				courses_fail: 0,
			},
			{courses_dept: "geog", courses_id: "446", courses_avg: 81.25, courses_fail: 0},
			{courses_dept: "phys", courses_id: "508", courses_avg: 92.2, courses_fail: 0},
		],
		options: {},
	},
];
