import {SlashCommandBuilder} from "@discordjs/builders";
import {CacheType, CommandInteraction} from "discord.js";

export default interface SlashCommand {
	data: SlashCommandBuilder;
	execute: (msg: CommandInteraction<CacheType>) => Promise<void>;
}

export enum InsightDatasetKind {
	Courses = "courses",
	Rooms = "rooms",
}

export interface InsightDataset {
	id: string;
	kind: InsightDatasetKind;
	numRows: number;
}
