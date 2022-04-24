import fs from "node:fs";
import {Client, Intents} from "discord.js";
import config from "./config.json";
import SlashCommand from "./types";
import axios from "axios";

// Initialize Client
const client = new Client({
	intents: [
		Intents.FLAGS.GUILDS,
		Intents.FLAGS.GUILD_MESSAGES,
		Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		Intents.FLAGS.DIRECT_MESSAGES,
		Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
	],
	partials: ["REACTION", "CHANNEL", "MESSAGE"],
});

// Setup slash commands
const commands: Record<string, SlashCommand> = {};
const commandFiles = fs.readdirSync("src/commands").filter((file) => file.endsWith(".ts"));
for (const file of commandFiles) {
	const command: SlashCommand = require(`./commands/${file}`);
	commands[command.data.name] = command;
}

client.on("ready", () => {
	if (!client.user) return;
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity("Hi");
	axios
		.get(config.server_url + "/initDatasets")
		.then(() => {
			console.log("Default datasets loaded successfully.");
		})
		.catch((err: Error) => {
			console.log(err);
		});
});

// Handle slash commands
client.on("interactionCreate", async (interaction) => {
	if (!interaction.isCommand()) return;

	const command = commands[interaction.commandName];
	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({content: "There was an error while executing this command!", ephemeral: true});
	}
});

client.login(config.token);
