export const testQueries = {
	good: {
		simple: {
			WHERE: {
				GT: {
					courses_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
			},
		},
		complex: {
			WHERE: {
				OR: [
					{
						AND: [
							{
								GT: {
									courses_avg: 90,
								},
							},
							{
								IS: {
									courses_dept: "cpsc",
								},
							},
						],
					},
					{
						EQ: {
							courses_avg: 95,
						},
					},
				],
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_id", "courses_avg"],
				ORDER: "courses_avg",
			},
		},
		multiple: {
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["small_dept", "small_avg"],
				ORDER: "small_avg",
			},
		},
	},

	bad: {
		multiple: {
			WHERE: {
				GT: {
					simple_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
				ORDER: "courses_avg",
			},
		},
	},

	tooLarge: [
		{
			WHERE: {
				LT: {
					courses_avg: 100,
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
				ORDER: "courses_avg",
			},
		},
		{
			WHERE: {},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
				ORDER: "courses_avg",
			},
		},
	],

	badQueryKeys: [
		// id does not exist
		{
			WHERE: {
				GT: {
					x_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["x_dept", "x_avg"],
				ORDER: "x_avg",
			},
		},
		// invalid idstring with underscore
		{
			WHERE: {
				GT: {
					courses_bad_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_bad_dept", "courses_bad_avg"],
				ORDER: "courses_bad_avg",
			},
		},
		// idstring not included
		{
			WHERE: {
				GT: {
					avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["dept", "avg"],
				ORDER: "avg",
			},
		},
		// Nonexistent dataset key
		{
			WHERE: {
				GT: {
					courses_hello: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
				ORDER: "courses_avg",
			},
		},
		// dataset key for "ORDER" does not exist in "COLUMNS"
		{
			WHERE: {
				LT: {
					courses_avg: 55,
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
				ORDER: "courses_audit",
			},
		},
	],

	badEBNF: [
		// Extra key in top level
		{
			WHERE: {
				GT: {
					courses_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
				ORDER: "courses_avg",
			},
			x: "dang",
		},
		// Missing WHERE
		{
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
				ORDER: "courses_avg",
			},
		},
		// Missing OPTIONS
		{
			WHERE: {
				GT: {
					courses_avg: 97,
				},
			},
		},
		// Invalid comparison key
		{
			WHERE: {
				GTE: {
					courses_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
				ORDER: "courses_avg",
			},
		},
		// Invalid option key
		{
			WHERE: {
				GT: {
					courses_avg: 97,
				},
			},
			OPTIONS: {
				xxCOLUMNSxx: ["courses_dept", "courses_avg"],
				xxORDERxx: "courses_avg",
			},
		},
		// EQ key wrong type
		{
			WHERE: {
				EQ: {
					courses_instructor: "*iczales*",
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
				ORDER: "courses_avg",
			},
		},
		// EQ val wrong type
		{
			WHERE: {
				EQ: {
					courses_avg: "*iczales*",
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
				ORDER: "courses_avg",
			},
		},
		// IS key wrong type
		{
			WHERE: {
				IS: {
					courses_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
				ORDER: "courses_avg",
			},
		},
		// IS val wrong type
		{
			WHERE: {
				IS: {
					courses_instructor: 99,
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
				ORDER: "courses_avg",
			},
		},
		// IS inputstring contains asterisk
		{
			WHERE: {
				IS: {
					courses_instructor: "*icza*les*",
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
				ORDER: "courses_avg",
			},
		},
		// NEGATION invalid
		{
			WHERE: {
				NOT: {
					courses_avg: 97,
				},
			},
			OPTIONS: {
				COLUMNS: ["courses_dept", "courses_avg"],
				ORDER: "courses_avg",
			},
		},
		// Empty COLUMNS
		{
			WHERE: {
				GT: {
					courses_avg: 98,
				},
			},
			OPTIONS: {
				COLUMNS: [],
			},
		},
	],
};
