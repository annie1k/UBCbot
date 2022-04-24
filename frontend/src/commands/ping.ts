import {SlashCommandBuilder} from "@discordjs/builders";
import {CacheType, CommandInteraction} from "discord.js";
import SlashCommand from "../types";

const data = new SlashCommandBuilder().setName("ping").setDescription("Replies with Pong!");

const execute = async (msg: CommandInteraction<CacheType>) => {
	await msg.reply("Pong!");
};

const cmd: SlashCommand = {data, execute};

module.exports = cmd;
