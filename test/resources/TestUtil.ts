import * as fs from "fs-extra";
import {Order} from "../../src/types";
const persistDir = "./data";

function getContentFromArchives(name: string): string {
	return fs.readFileSync(`test/resources/archives/${name}`).toString("base64");
}

function clearDisk(): void {
	fs.removeSync(persistDir);
}

function isSortedByField(array: Array<{[key: string]: number | string}>, field: Order | string): boolean {
	if (typeof field === "string") {
		for (let i = 0; i < array.length - 1; i++) {
			if (array[i][field] > array[i + 1][field]) {
				return false;
			}
		}
		return true;
	} else if (field.keys) {
		let prevKey = "";
		const fail =
			field.dir === "UP"
				? (a: string | number, b: string | number) => a > b
				: (a: string | number, b: string | number) => a < b;
		for (const key of field.keys) {
			for (let i = 0; i < array.length - 1; i++) {
				if (fail(array[i][key], array[i + 1][key]) && array[i][prevKey] === array[i + 1][prevKey]) {
					console.log("ERR", array[i], array[i + 1], key, prevKey);
					return false;
				}
			}
			prevKey = key;
		}
	}
	return true;
}

export {getContentFromArchives, persistDir, clearDisk, isSortedByField};
