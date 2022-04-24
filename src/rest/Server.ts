import express, {Application, Request, Response} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, InsightError, NotFoundError} from "../controller/IInsightFacade";
import * as fs from "fs-extra";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;
	private static facade: InsightFacade = new InsightFacade();

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();

		this.registerMiddleware();
		this.registerRoutes();
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express
					.listen(this.port, () => {
						console.info(`Server::start() - server listening on port: ${this.port}`);
						resolve();
					})
					.on("error", (err: Error) => {
						// catches errors in server start
						console.error(`Server::start() - server ERROR: ${err.message}`);
						reject(err);
					});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		this.express.get("/echo/:msg", Server.echo);

		// TODO: your other endpoints should go here
		this.express.put("/dataset/:id/:kind", Server.putZip);
		this.express.delete("/dataset/:id", Server.deleteDataset);
		this.express.post("/query", Server.doQuery);
		this.express.get("/datasets", Server.getDatasetsList);
		this.express.get("/initDatasets", Server.initDatasets);
	}

	private static getDatasetsList(req: Request, res: Response) {
		Server.facade
			.listDatasets()
			.then((result) => {
				res.status(200).json({result: result});
			})
			.catch((err: Error) => {
				res.status(500).json({error: err.message});
			});
	}

	private static doQuery(req: Request, res: Response) {
		const query = req.body;

		Server.facade
			.performQuery(query)
			.then((result) => {
				res.status(200).json({result: result});
			})
			.catch((err: Error) => {
				res.status(400).json({error: err.message});
			});
	}

	private static deleteDataset(req: Request, res: Response) {
		const {id} = req.params;

		Server.facade
			.removeDataset(id)
			.then((result) => {
				res.status(200).json({result: result});
			})
			.catch((err) => {
				if (err instanceof NotFoundError) {
					res.status(404).json({error: err.message});
				} else {
					res.status(400).json({error: err.message});
				}
			});
	}

	private static putZip(req: Request, res: Response) {
		const {id, kind} = req.params;
		const zipString = req.body.toString("base64");

		if (!(Object as any).values(InsightDatasetKind).includes(kind)) {
			res.status(400).json({error: "Dataset kind is not recognized."});
			return;
		}
		Server.facade
			.addDataset(id, zipString, kind as InsightDatasetKind)
			.then((result) => {
				res.status(200).json({result: result});
			})
			.catch((err: Error) => {
				res.status(400).json({error: err.message});
			});
	}

	private static async initDatasets(req: Request, res: Response) {
		const d = await Server.facade.listDatasets();
		const datasets = d.map((dataset) => dataset.id);
		let p1: Promise<string[]> = Promise.resolve([]);
		let p2: Promise<string[]> = Promise.resolve([]);

		if (!datasets.includes("ubcCourses")) {
			p1 = Server.facade.addDataset(
				"ubcCourses",
				fs.readFileSync("test/resources/archives/courses.zip").toString("base64"),
				InsightDatasetKind.Courses
			);
		}
		if (!datasets.includes("ubcRooms")) {
			p2 = Server.facade.addDataset(
				"ubcRooms",
				fs.readFileSync("test/resources/archives/rooms.zip").toString("base64"),
				InsightDatasetKind.Rooms
			);
		}
		Promise.all([p1, p2])
			.then(() => {
				res.status(200).json({result: "ok"});
			})
			.catch((err: Error) => {
				res.status(400).json({error: err.message});
			});
	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}
}
