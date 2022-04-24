import {
	IInsightFacade,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	ResultTooLargeError,
	NotFoundError,
	InsightDataset,
} from "../../src/controller/IInsightFacade";
import {Query} from "../../src/types";
import InsightFacade from "../../src/controller/InsightFacade";
import {clearDisk, getContentFromArchives, isSortedByField} from "../resources/TestUtil";
import * as fs from "fs-extra";
import chaiAsPromised from "chai-as-promised";
import {folderTest} from "@ubccpsc310/folder-test";
import chai, {expect} from "chai";
import {testQueries} from "../resources/queries_1/testQueries";
import {exactMatchQueries} from "../resources/queries_1/expected";
chai.use(chaiAsPromised);

// free
describe("free InsightFacade", function () {
	let insightFacade: InsightFacade;

	const persistDir = "./data";
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		courses: "./test/resources/archives/courses.zip",
	};

	before(function () {
		// This section runs once and loads all datasets specified in the datasetsToLoad object
		for (const key of Object.keys(datasetsToLoad)) {
			const content = fs.readFileSync(datasetsToLoad[key]).toString("base64");
			datasetContents.set(key, content);
		}
		// Just in case there is anything hanging around from a previous run
		fs.removeSync(persistDir);
	});

	describe("Add/Remove/List Dataset", function () {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);
		});

		beforeEach(function () {
			// This section resets the insightFacade instance
			// This runs before each test
			console.info(`BeforeTest: ${this.currentTest?.title}`);
			insightFacade = new InsightFacade();
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
		});

		afterEach(function () {
			// This section resets the data directory (removing any cached data)
			// This runs after each test, which should make each test independent from the previous one
			console.info(`AfterTest: ${this.currentTest?.title}`);
			fs.removeSync(persistDir);
		});

		// This is a unit test. You should create more like this!
		it("Should add a valid dataset", function () {
			const id: string = "courses";
			const content: string = datasetContents.get("courses") ?? "";
			const expected: string[] = [id];
			return insightFacade.addDataset(id, content, InsightDatasetKind.Courses).then((result: string[]) => {
				expect(result).to.deep.equal(expected);
			});
		});
	});

	/*
	 * This test suite dynamically generates tests from the JSON files in test/queries.
	 * You should not need to modify it; instead, add additional files to the queries directory.
	 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
	 */
	describe("PerformQuery", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);

			insightFacade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				insightFacade.addDataset("courses", datasetContents.get("courses") ?? "", InsightDatasetKind.Courses),
			];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			fs.removeSync(persistDir);
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade PerformQuery tests",
			(input) => insightFacade.performQuery(input),
			"./test/resources/queries",
			{
				assertOnResult: (actual: any, expected: InsightResult[], input: unknown): void => {
					expect(actual).to.have.deep.members(expected);
					expect(actual).to.have.same.length(expected.length);
					const orderedBy = (input as Query)?.OPTIONS?.ORDER;
					if (orderedBy) {
						expect(isSortedByField(actual, orderedBy)).to.be.true;
					}
				},
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError(actual, expected) {
					if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect(actual).to.be.instanceof(InsightError);
					}
				},
			}
		);
	});
});

// annie
describe("performQuery", function () {
	let courses: string;
	let incorrectzip: string;
	let facade: IInsightFacade;
	type Input = unknown;
	type Output = Promise<InsightResult[]>;
	type Error = "ResultTooLargeError" | "InsightError";

	before(async function () {
		courses = getContentFromArchives("courses.zip");
		incorrectzip = getContentFromArchives("incorrectDirName.zip");
		facade = new InsightFacade();
		await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
		await facade.addDataset("courses2", courses, InsightDatasetKind.Courses);
	});
});

describe("InsightFacade", function () {
	let courses: string;
	let emptyzip: string;
	let incorrectzip: string;
	let facade: IInsightFacade;

	before(function () {
		courses = getContentFromArchives("courses.zip");
		emptyzip = getContentFromArchives("empty.zip");
		incorrectzip = getContentFromArchives("incorrectDirName.zip");
	});

	beforeEach(function () {
		clearDisk();
		facade = new InsightFacade();
	});

	describe("List Datasets", function () {
		it("should list no datasets", function () {
			return facade.listDatasets().then((insightDatasets) => {
				const futureInsightDatasets = facade.listDatasets();
				return expect(futureInsightDatasets).to.eventually.deep.equal([]);
			});
		});

		it("should list 1 dataset", function () {
			return facade
				.addDataset("courses", courses, InsightDatasetKind.Courses)
				.then((addedIds) => {
					return facade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([
						{
							id: "courses",
							kind: InsightDatasetKind.Courses,
							numRows: 64612,
						},
					]);

					expect(insightDatasets).to.be.an.instanceOf(Array);
					expect(insightDatasets).to.have.length(1);
					const [insightDataset] = insightDatasets;
					expect(insightDataset).to.have.property("id");
					expect(insightDataset.id).to.equal("courses");
				});
		});

		it("should list multiple dataset", function () {
			return facade
				.addDataset("courses1", courses, InsightDatasetKind.Courses)
				.then(() => {
					return facade.addDataset("courses2", courses, InsightDatasetKind.Courses).then(() => {
						return facade.addDataset("courses3", courses, InsightDatasetKind.Courses);
					});
				})
				.then((insightDatasets) => {
					return facade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceOf(Array);
					expect(insightDatasets).to.have.length(3);
					const insightDatasetCourses1 = insightDatasets.find((dataset1) => dataset1.id === "courses1");
					expect(insightDatasetCourses1).to.exist;
					expect(insightDatasetCourses1).to.deep.equal({
						id: "courses1",
						kind: InsightDatasetKind.Courses,
						numRows: 64612,
					});
					const insightDatasetCourses2 = insightDatasets.find((dataset2) => dataset2.id === "courses2");
					expect(insightDatasetCourses2).to.exist;
					expect(insightDatasetCourses2).to.deep.equal({
						id: "courses2",
						kind: InsightDatasetKind.Courses,
						numRows: 64612,
					});
					const insightDatasetCourses3 = insightDatasets.find((dataset3) => dataset3.id === "courses3");
					expect(insightDatasetCourses3).to.exist;
					expect(insightDatasetCourses3).to.deep.equal({
						id: "courses3",
						kind: InsightDatasetKind.Courses,
						numRows: 64612,
					});
				});
		});
	});

	describe("Add Dataset", function () {
		it("add valid course zip", function () {
			return facade
				.addDataset("success", courses, InsightDatasetKind.Courses)
				.then((addedIds) => {
					return facade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([
						{
							id: "success",
							kind: InsightDatasetKind.Courses,
							numRows: 64612,
						},
					]);

					expect(insightDatasets).to.be.an.instanceOf(Array);
					expect(insightDatasets).to.have.length(1);
					const [insightDataset] = insightDatasets;
					expect(insightDataset).to.have.property("id");
					expect(insightDataset.id).to.equal("success");
				});
		});

		it("unable to add empty course zip", function () {
			const result = facade.addDataset("empty", emptyzip, InsightDatasetKind.Courses);
			return expect(result).eventually.to.be.rejectedWith(InsightError);
		});

		it("unable to add incorrect course zip", function () {
			const result = facade.addDataset("incorrect", incorrectzip, InsightDatasetKind.Courses);
			return expect(result).eventually.to.be.rejectedWith(InsightError);
		});
	});

	describe("remove Dataset", function () {
		it("remove 1 valid course zip from 1", function () {
			return facade
				.addDataset("courses", courses, InsightDatasetKind.Courses)
				.then((addedIds) => {
					return facade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([
						{
							id: "courses",
							kind: InsightDatasetKind.Courses,
							numRows: 64612,
						},
					]);
					expect(insightDatasets).to.be.an.instanceOf(Array);
					expect(insightDatasets).to.have.length(1);
				})
				.then((insightDatasets) => {
					return facade.removeDataset("courses");
				})
				.then((addedIds) => {
					return facade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([]);
					expect(insightDatasets).to.be.an.instanceOf(Array);
					expect(insightDatasets).to.have.length(0);
				});
		});

		it("remove 1 valid course zip from 3", function () {
			return facade
				.addDataset("courses-1", courses, InsightDatasetKind.Courses)
				.then(() => {
					return facade.addDataset("courses-2", courses, InsightDatasetKind.Courses).then(() => {
						return facade.addDataset("courses-3", courses, InsightDatasetKind.Courses);
					});
				})
				.then((insightDatasets) => {
					return facade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceOf(Array);
					expect(insightDatasets).to.have.length(3);
					const insightDatasetCourses1 = insightDatasets.find((dataset1) => dataset1.id === "courses-1");
					expect(insightDatasetCourses1).to.exist;
					expect(insightDatasetCourses1).to.deep.equal({
						id: "courses-1",
						kind: InsightDatasetKind.Courses,
						numRows: 64612,
					});
					const insightDatasetCourses2 = insightDatasets.find((dataset2) => dataset2.id === "courses-2");
					expect(insightDatasetCourses2).to.exist;
					expect(insightDatasetCourses2).to.deep.equal({
						id: "courses-2",
						kind: InsightDatasetKind.Courses,
						numRows: 64612,
					});
					const insightDatasetCourses3 = insightDatasets.find((dataset3) => dataset3.id === "courses-3");
					expect(insightDatasetCourses3).to.exist;
					expect(insightDatasetCourses3).to.deep.equal({
						id: "courses-3",
						kind: InsightDatasetKind.Courses,
						numRows: 64612,
					});
				})
				.then((insightDatasets) => {
					return facade.removeDataset("courses-1");
				})
				.then((addedIds) => {
					return facade.listDatasets();
				})
				.then((insightDatasets) => {
					expect(insightDatasets).to.be.an.instanceOf(Array);
					expect(insightDatasets).to.have.length(2);

					const insightDatasetCourses2 = insightDatasets.find((dataset2) => dataset2.id === "courses-2");
					expect(insightDatasetCourses2).to.exist;
					expect(insightDatasetCourses2).to.deep.equal({
						id: "courses-2",
						kind: InsightDatasetKind.Courses,
						numRows: 64612,
					});
					const insightDatasetCourses3 = insightDatasets.find((dataset3) => dataset3.id === "courses-3");
					expect(insightDatasetCourses3).to.exist;
					expect(insightDatasetCourses3).to.deep.equal({
						id: "courses-3",
						kind: InsightDatasetKind.Courses,
						numRows: 64612,
					});
				});
		});

		it("remove 1 valid course zip from 0", function () {
			const result = facade.removeDataset("courses");
			return expect(result).eventually.to.be.rejectedWith(NotFoundError);
		});
	});
});

// Justin
describe("Justin InsightFacade", function () {
	let courses: string;

	before(function () {
		courses = getContentFromArchives("courses.zip");
	});

	describe("List Datasets", function () {
		let facade: IInsightFacade = new InsightFacade();

		this.beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("should list no datasets", function () {
			return facade.listDatasets().then((insightDatasets) => {
				expect(insightDatasets).to.be.an.instanceOf(Array);
				expect(insightDatasets.length).to.equal(0);
			});
		});
		it("should list one dataset", function () {
			const content = getContentFromArchives("courses.zip");
			return facade
				.addDataset("courses", content, InsightDatasetKind.Courses)
				.then(() => facade.listDatasets())
				.then((insightDatasets) => {
					expect(insightDatasets).to.deep.equal([
						{
							id: "courses",
							kind: InsightDatasetKind.Courses,
							numRows: 64612,
						},
					]);
				});
		});
		it("should list multiple datasets", function () {
			return facade
				.addDataset("courses", courses, InsightDatasetKind.Courses)
				.then(() => facade.addDataset("rooms", getContentFromArchives("rooms.zip"), InsightDatasetKind.Rooms))
				.then(() => facade.listDatasets())
				.then((insightDatasets) => {
					const expectedDatasets: InsightDataset[] = [
						{
							id: "courses",
							kind: InsightDatasetKind.Courses,
							numRows: 64612,
						},
						{
							id: "rooms",
							kind: InsightDatasetKind.Rooms,
							numRows: 364,
						},
					];
					expect(insightDatasets).to.deep.equal(expectedDatasets);
				});
		});
	});

	describe("Add Datasets", function () {
		let facade: IInsightFacade = new InsightFacade();

		this.beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("addDatasets return info", function () {
			return facade
				.addDataset("courses", courses, InsightDatasetKind.Courses)
				.then((results) => {
					expect(results).to.deep.equal(["courses"]);
					return facade.addDataset("courses2", courses, InsightDatasetKind.Courses);
				})
				.then((results) => {
					expect(results).to.contain("courses");
					expect(results).to.contain("courses2");
				});
		});
		it("addDatasets small", function () {
			return facade
				.addDataset("small", getContentFromArchives("small.zip"), InsightDatasetKind.Courses)
				.then((results) => {
					expect(results).to.deep.equal(["small"]);
				});
		});
		it("addDatasets fail underscore", function () {
			const add = facade.addDataset("_nice", courses, InsightDatasetKind.Courses);
			return expect(add).eventually.to.be.rejectedWith(InsightError);
		});
		it("addDatasets fail spaces only", function () {
			const add = facade.addDataset("   ", courses, InsightDatasetKind.Courses);
			return expect(add).eventually.to.be.rejectedWith(InsightError);
		});
		it("addDatasets fail empty id", function () {
			const add = facade.addDataset("", courses, InsightDatasetKind.Courses);
			return expect(add).eventually.to.be.rejectedWith(InsightError);
		});
		it("addDatasets fail invalid data", function () {
			const add = facade.addDataset("bad", getContentFromArchives("fail.zip"), InsightDatasetKind.Courses);
			return expect(add).eventually.to.be.rejectedWith(InsightError);
		});
		it("addDatasets fail bad zip folder structure", function () {
			const add = facade.addDataset(
				"bad",
				getContentFromArchives("badStructure.zip"),
				InsightDatasetKind.Courses
			);
			return expect(add).eventually.to.be.rejectedWith(InsightError);
		});
		it("addDatasets fail id already exists", async function () {
			await facade.addDataset("hi", getContentFromArchives("small.zip"), InsightDatasetKind.Courses);
			const add = facade.addDataset("hi", getContentFromArchives("small.zip"), InsightDatasetKind.Courses);
			return expect(add).eventually.to.be.rejectedWith(InsightError);
		});
	});

	describe("Remove Datasets", function () {
		let facade: IInsightFacade = new InsightFacade();

		this.beforeEach(function () {
			clearDisk();
			facade = new InsightFacade();
		});

		it("removeDatasets from single", function () {
			return facade
				.addDataset("d1", courses, InsightDatasetKind.Courses)
				.then(() => facade.removeDataset("d1"))
				.then((id) => {
					expect(id).to.equal("d1");
					return facade.listDatasets();
				})
				.then((insightDatsets) => {
					expect(insightDatsets.length).to.equal(0);
				});
		});
		it("removeDatasets from multiple", function () {
			return facade
				.addDataset("d1", courses, InsightDatasetKind.Courses)
				.then(() => facade.addDataset("d2", courses, InsightDatasetKind.Courses))
				.then(() => facade.removeDataset("d1"))
				.then((id) => {
					expect(id).to.equal("d1");
					return facade.listDatasets();
				})
				.then((insightDatsets) => {
					expect(insightDatsets).to.deep.equal([
						{
							id: "d2",
							kind: InsightDatasetKind.Courses,
							numRows: 64612,
						},
					]);
				});
		});
		it("removeDatasets fail underscore", function () {
			const remove = facade
				.addDataset("d1", courses, InsightDatasetKind.Courses)
				.then(() => facade.removeDataset("d_"));
			return expect(remove).eventually.to.be.rejectedWith(InsightError);
		});
		it("removeDatasets fail spaces", function () {
			const remove = facade
				.addDataset("d1", courses, InsightDatasetKind.Courses)
				.then(() => facade.removeDataset("  "));
			return expect(remove).eventually.to.be.rejectedWith(InsightError);
		});
		it("removeDatasets fail empty id", function () {
			const remove = facade
				.addDataset("d1", courses, InsightDatasetKind.Courses)
				.then(() => facade.removeDataset(""));
			return expect(remove).eventually.to.be.rejectedWith(InsightError);
		});
		it("removeDatasets fail empty", function () {
			const remove = facade.removeDataset("courses");
			return expect(remove).eventually.to.be.rejectedWith(NotFoundError);
		});
		it("removeDatasets fail id DNE", function () {
			const remove = facade
				.addDataset("d1", courses, InsightDatasetKind.Courses)
				.then(() => facade.removeDataset("d2"));
			return expect(remove).eventually.to.be.rejectedWith(NotFoundError);
		});
	});

	describe("Query Datasets", function () {
		let facade: IInsightFacade = new InsightFacade();

		describe("Query on DEFAULT courses dataset", function () {
			this.beforeAll(async function () {
				clearDisk();
				facade = new InsightFacade();
				await facade.addDataset("courses", courses, InsightDatasetKind.Courses);
			});

			it("performQuery simple", function () {
				return facade.performQuery(testQueries.good.simple).then((result) => {
					expect(result.length).to.equal(49);
				});
			});
			it("performQuery complex", function () {
				return facade.performQuery(testQueries.good.complex).then((result) => {
					expect(result.length).to.equal(83);
				});
			});
			it("performQuery empty", function () {
				const query = facade.performQuery({});
				return expect(query).eventually.to.be.rejectedWith(InsightError);
			});

			// Results are too large
			const tooLarge = testQueries.tooLarge;
			for (const index in tooLarge) {
				it("performQuery result large " + index, function () {
					const query = facade.performQuery(tooLarge[index]);
					return expect(query).eventually.to.be.rejectedWith(ResultTooLargeError);
				});
			}

			// Bad query keys
			const badKeys = testQueries.badQueryKeys;
			for (const index in badKeys) {
				it("performQuery bad query key " + index, function () {
					const query = facade.performQuery(badKeys[index]);
					return expect(query).eventually.to.be.rejectedWith(InsightError);
				});
			}

			const ebnf = testQueries.badEBNF;
			for (const index in ebnf) {
				it("performQuery ebnf " + index, function () {
					const query = facade.performQuery(ebnf[index]);
					return expect(query).eventually.to.be.rejectedWith(InsightError);
				});
			}

			for (const index in exactMatchQueries) {
				const queryObj = exactMatchQueries[index];
				it("performQuery exact match " + index, function () {
					return facade.performQuery(queryObj.query).then((result) => {
						if (queryObj.options.checkOrderOnly && queryObj.query?.OPTIONS?.ORDER) {
							const orderKey = queryObj.query["OPTIONS"]["ORDER"];
							expect(typeof orderKey).to.equal("string");
							expect(result.map((row) => row[orderKey])).to.deep.equal(
								queryObj.result.map((row) => row[orderKey])
							);
						} else {
							expect(result).to.deep.equal(queryObj.result);
						}
					});
				});
			}
		});

		it("performQuery multiple datasets", function () {
			clearDisk();
			facade = new InsightFacade();
			return facade
				.addDataset("courses", courses, InsightDatasetKind.Courses)
				.then(() =>
					facade.addDataset("simple", getContentFromArchives("small.zip"), InsightDatasetKind.Courses)
				)
				.then(() => facade.performQuery(testQueries.good.multiple))
				.then((result) => {
					expect(result.length).to.equal(41);
					return facade.performQuery(testQueries.bad.multiple);
				})
				.catch((err) => {
					expect(err).to.be.instanceOf(InsightError);
				});
		});
	});
});

describe("Room Tests", function () {
	let insightFacade: InsightFacade;

	const persistDir = "./data";
	const datasetContents = new Map<string, string>();

	// Reference any datasets you've added to test/resources/archives here and they will
	// automatically be loaded in the 'before' hook.
	const datasetsToLoad: {[key: string]: string} = {
		rooms: "./test/resources/archives/rooms.zip",
	};

	before(function () {
		// This section runs once and loads all datasets specified in the datasetsToLoad object
		for (const key of Object.keys(datasetsToLoad)) {
			const content = fs.readFileSync(datasetsToLoad[key]).toString("base64");
			datasetContents.set(key, content);
		}
		// Just in case there is anything hanging around from a previous run
		fs.removeSync(persistDir);
	});

	// Do something here
	describe("ROOM PerformQuery", () => {
		before(function () {
			console.info(`Before: ${this.test?.parent?.title}`);

			insightFacade = new InsightFacade();

			// Load the datasets specified in datasetsToQuery and add them to InsightFacade.
			// Will *fail* if there is a problem reading ANY dataset.
			const loadDatasetPromises = [
				insightFacade.addDataset("rooms", datasetContents.get("rooms") ?? "", InsightDatasetKind.Rooms),
			];

			return Promise.all(loadDatasetPromises);
		});

		after(function () {
			console.info(`After: ${this.test?.parent?.title}`);
			fs.removeSync(persistDir);
		});

		type PQErrorKind = "ResultTooLargeError" | "InsightError";

		folderTest<unknown, Promise<InsightResult[]>, PQErrorKind>(
			"Dynamic InsightFacade ROOM PerformQuery tests",
			(input) => insightFacade.performQuery(input),
			"./test/resources/roomQueries",
			{
				assertOnResult: (actual: any, expected: InsightResult[], input: unknown): void => {
					expect(actual).to.have.deep.members(expected);
					expect(actual).to.have.same.length(expected.length);
					const orderedBy = (input as Query)?.OPTIONS?.ORDER;
					if (orderedBy) {
						expect(isSortedByField(actual, orderedBy)).to.be.true;
					}
				},
				errorValidator: (error): error is PQErrorKind =>
					error === "ResultTooLargeError" || error === "InsightError",
				assertOnError(actual, expected) {
					if (expected === "ResultTooLargeError") {
						expect(actual).to.be.instanceof(ResultTooLargeError);
					} else {
						expect(actual).to.be.instanceof(InsightError);
					}
				},
			}
		);
	});
});

// Manually load both rooms and courses, then perform some query
// describe("Other tests", function () {
// 	let insightFacade: InsightFacade;
// 	const persistDir = "./data";
// 	const datasetContents = new Map<string, string>();
// });
