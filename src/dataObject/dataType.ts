import JSZip from "jszip";
import {DataObject} from "../types";

export enum SchemaType {
	All,
	String,
	Number,
}

export default abstract class DataType {
	protected schema: Record<string, string>;
	public mKeySchema: Record<string, string>;
	public sKeySchema: Record<string, string>;
	constructor(mKeySchema: Record<string, string>, sKeySchema: Record<string, string>) {
		this.mKeySchema = mKeySchema;
		this.sKeySchema = sKeySchema;
		this.schema = {...mKeySchema, ...sKeySchema};
	}

	public abstract loadDataFromZip(zip: JSZip, databaseId: string): Promise<DataObject[]>;

	public isValidKey(key: string, databaseId: string, schemaType = SchemaType.All) {
		const splitKeys = key.split("_");
		if (splitKeys.length !== 2) {
			return false;
		}
		const correctID = splitKeys[0] === databaseId;
		switch (schemaType) {
			case SchemaType.Number:
				return correctID && splitKeys[1] in this.mKeySchema;
			case SchemaType.String:
				return correctID && splitKeys[1] in this.sKeySchema;
			case SchemaType.All:
			default:
				return correctID && splitKeys[1] in this.schema;
		}
	}

	/**
	 * REQUIRES: key is valid (ie: isValidKey returns true)
	 */
	public getType(key: string) {
		const splitKey = key.split("_")[1];
		return this.schema[splitKey];
	}

	public hasValidFields(obj: Record<string, any>, databaseId: string): obj is DataObject {
		return Object.entries(this.schema).every(([key, type]) => {
			return typeof obj[`${databaseId}_${key}`] === type;
		});
	}
}
