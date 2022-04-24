const validFilters = {
	LT: "number",
	GT: "number",
	EQ: "number",
	IS: "string",
};

export type Filter = {[key: string]: {[key: string]: number | string}};

export abstract class Query {
	private validKeys: Record<string, string>;
	private datasetId: string;
	protected constructor(validKeys: Record<string, string>, datasetId: string) {
		this.validKeys = validKeys;
		this.datasetId = datasetId;
	}

	public getOptions() {
		return this.validKeys;
	}

	public buildFilter(filterType: string | null, value: string | number | null, key: string | null): Filter | null {
		console.log(filterType, value, key);
		if (filterType === null || value === null || key === null) return null;
		// if (typeof value !== validFilters[filterType as keyof typeof validFilters]) return null;
		return {
			[filterType]: {
				[`${this.datasetId}_${key}`]: value,
			},
		};
	}

	public buildQuery(filter: Filter | null, select: string[], order: string | null) {
		return {
			WHERE: filter ?? {},
			OPTIONS: {
				COLUMNS: select.map((field) => `${this.datasetId}_${field}`),
				...(order && {ORDER: `${this.datasetId}_${order}`}),
			},
		};
	}
}

export class CourseQuery extends Query {
	public constructor(datasetId: string) {
		super(
			{
				dept: "string",
				id: "string",
				instructor: "string",
				uuid: "string",
				title: "string",
				avg: "number",
				pass: "number",
				fail: "number",
				audit: "number",
				year: "number",
			},
			datasetId
		);
	}
}

export class RoomsQuery extends Query {
	public constructor(datasetId: string) {
		super(
			{
				fullname: "string",
				shortname: "string",
				number: "string",
				name: "string",
				address: "string",
				type: "string",
				furniture: "string",
				href: "string",
				lat: "number",
				lon: "number",
				seats: "number",
			},
			datasetId
		);
	}
}
