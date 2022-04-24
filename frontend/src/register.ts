import fs from "node:fs";
import {REST} from "@discordjs/rest";
import {Routes} from "discord-api-types/v9";
import config from "./config.json";
import SlashCommand from "./types";

// Setup slash commands
const commands: Record<string, SlashCommand> = {};
const commandFiles = fs.readdirSync("src/commands").filter((file) => file.endsWith(".ts"));
for (const file of commandFiles) {
	const command: SlashCommand = require(`./commands/${file}`);
	commands[command.data.name] = command;
}

const registerCommands = (commands: Record<string, SlashCommand>) => {
	// Convert commands into simple json objects
	const body = Object.values(commands).map((command) => {
		return command.data.toJSON();
	});

	const rest = new REST({version: "9"}).setToken(config.token);

	(async () => {
		try {
			console.log("Started refreshing application (/) commands.");
			console.log(
				"Registering",
				Object.values(commands).map((command) => command.data.name)
			);
			await rest.put(Routes.applicationCommands(config.app_id), {
				body,
			});

			console.log("Successfully reloaded application (/) commands.");
		} catch (error) {
			console.error(error);
		}
	})();
};

registerCommands(commands);
