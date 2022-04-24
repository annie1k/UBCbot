import {SlashCommandBuilder} from "@discordjs/builders";
import axios from "axios";
import {CacheType, CommandInteraction} from "discord.js";
import SlashCommand, {InsightDataset} from "../types";
import config from "../config.json";
var AsciiTable = require("ascii-table");

const data = new SlashCommandBuilder().setName("list").setDescription("Lists available datasets.");

const execute = async (msg: CommandInteraction<CacheType>) => {
	const res = await axios.get<{result: InsightDataset[]}>(config.server_url + "/datasets");
	const table = new AsciiTable("Available Datasets");

	table.setHeading("Name", "Type", "Num Rows");
	res.data.result.forEach((dataset) => {
		table.addRow(dataset.id, dataset.kind, dataset.numRows);
	});

	await msg.reply("```\n" + table.toString() + "\n```");
};

const cmd: SlashCommand = {data, execute};

module.exports = cmd;
