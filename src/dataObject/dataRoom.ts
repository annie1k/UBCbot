import JSZip from "jszip";
import {RoomMKeySchema, RoomSKeySchema, DataObject} from "../types";
import DataType from "./dataType";
import {Document, Element, parse} from "parse5";
import {
	getAllElementsOfType,
	getElement,
	getFirstTextFromElement,
	getPathFromTD as getAnchorHrefFromTD,
	getTable,
} from "../helpers/htmlHelpers";
import http from "http";
interface BuildingData {
	data: DataObject;
	path: string;
}

export default class DataRoom extends DataType {
	constructor() {
		super(RoomMKeySchema, RoomSKeySchema);
	}

	public async loadDataFromZip(zip: JSZip, databaseId: string): Promise<DataObject[]> {
		const indexFile = zip.file("rooms/index.htm");
		if (indexFile === null) {
			return Promise.reject("Missing index file");
		}
		const index = parse(await indexFile.async("string"));
		const buildings = await this.getBuildings(index, databaseId);
		const rooms = await this.getRoomsFromPaths(zip, buildings, databaseId);
		if (rooms.length === 0) {
			return Promise.reject("No valid rooms found");
		}
		return Promise.resolve(rooms);
	}

	private async getRoomsFromPaths(zip: JSZip, buildings: BuildingData[], databaseId: string) {
		const allRooms: DataObject[] = [];
		const buildingPromises: Array<Promise<void>> = [];
		for (const building of buildings) {
			const file = zip.file(building.path);
			if (file === null) {
				continue;
			}
			buildingPromises.push(
				file.async("string").then((value) => {
					const html = parse(value);
					const rooms = this.getRooms(html, building, databaseId);
					allRooms.push(...rooms);
				})
			);
		}
		await Promise.all(buildingPromises);
		return allRooms;
	}

	private async getBuildings(html: Document, databaseId: string): Promise<BuildingData[]> {
		const table = getTable(html);
		const buildingPromises: Array<Promise<void>> = [];
		if (!table) {
			return [];
		}
		const rows = getAllElementsOfType(table, "tr");
		const buildings: BuildingData[] = [];
		for (const row of rows) {
			buildingPromises.push(
				this.getBuilding(row, databaseId).then((value) => {
					if (value !== null) {
						buildings.push(value);
					}
				})
			);
		}
		await Promise.all(buildingPromises);
		return buildings;
	}

	private async getBuilding(row: Element, databaseId: string): Promise<BuildingData | null> {
		const buildingCodeTd = getElement(row, "td", "views-field views-field-field-building-code");
		const buildingTd = getElement(row, "td", "views-field views-field-title");
		const addressTd = getElement(row, "td", "views-field views-field-field-building-address");
		if (buildingTd) {
			const path = getAnchorHrefFromTD(buildingTd);
			const shortname = getFirstTextFromElement(buildingCodeTd);
			const fullname = getFirstTextFromElement(buildingTd);
			const address = getFirstTextFromElement(addressTd);
			const coords = await this.getLatLong(address);
			if (path && shortname && fullname && address && coords) {
				return {
					data: {
						[`${databaseId}_shortname`]: shortname,
						[`${databaseId}_fullname`]: fullname,
						[`${databaseId}_address`]: address,
						[`${databaseId}_lat`]: coords.lat,
						[`${databaseId}_lon`]: coords.lon,
					},
					path: path.replace("./", "rooms/"),
				};
			}
		}
		return null;
	}

	private async getLatLong(address?: string): Promise<{lat: number; lon: number} | null> {
		if (address === undefined) {
			return null;
		}
		// TODO: Make API call to
		// http://cs310.students.cs.ubc.ca:11316/api/v1/project_team<TEAM NUMBER>/<ADDRESS>
		// where <ADDRESS> is an URL-escaped string
		try {
			const result = new Promise<{lat: number; lon: number}>((resolve, reject) => {
				http.get("http://cs310.students.cs.ubc.ca:11316/api/v1/project_team608/" + address, (resp) => {
					let data = "";

					resp.on("data", (chunk) => {
						data += chunk;
					});
					resp.on("end", () => {
						resolve(JSON.parse(data));
					});
				}).on("error", (err) => {
					reject(err);
				});
			});
			return result;
		} catch (error) {
			return null;
		}
	}

	private getRooms(html: Document, building: BuildingData, databaseId: string): DataObject[] {
		const table = getTable(html);
		if (!table) {
			return [];
		}
		const rooms: DataObject[] = [];
		const rows = getAllElementsOfType(table, "tr");
		for (const row of rows) {
			const room = this.getRoom(row, building, databaseId);
			if (room !== null) {
				rooms.push(room);
			}
		}
		return rooms;
	}

	private getRoom(row: Element, building: BuildingData, databaseId: string): DataObject | null {
		const roomTd = getElement(row, "td", "views-field views-field-field-room-number");
		const capacityTd = getElement(row, "td", "views-field views-field-field-room-capacity");
		const furnitureTd = getElement(row, "td", "views-field views-field-field-room-furniture");
		const typeTd = getElement(row, "td", "views-field views-field-field-room-type");
		const number = getFirstTextFromElement(roomTd);
		const seats = getFirstTextFromElement(capacityTd);
		const furniture = getFirstTextFromElement(furnitureTd);
		const type = getFirstTextFromElement(typeTd);
		const href = getAnchorHrefFromTD(roomTd);
		const name = `${building.data[`${databaseId}_shortname`]}_${number}`;
		const roomData = {
			...building.data,
			[`${databaseId}_number`]: number,
			[`${databaseId}_name`]: name,
			[`${databaseId}_seats`]: seats ? Number(seats) : undefined,
			[`${databaseId}_type`]: type ?? "",
			[`${databaseId}_furniture`]: furniture,
			[`${databaseId}_href`]: href,
		};
		if (this.hasValidFields(roomData, databaseId)) {
			return roomData;
		}
		return null;
	}
}
