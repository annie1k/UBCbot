import {SlashCommandBuilder} from "@discordjs/builders";
import axios, {AxiosResponse} from "axios";
import {
	CacheType,
	CommandInteraction,
	Message,
	MessageActionRow,
	MessageAttachment,
	MessageButton,
	MessageComponentInteraction,
	MessageEmbed,
} from "discord.js";
import {CourseQuery, Filter, Query, RoomsQuery} from "../query/query";
import SlashCommand from "../types";
import config from "../config.json";
import {formatQueryResult} from "../helpers";
import {Stream} from "node:stream";
import {Readable} from "stream";
import {response} from "express";

const msgColor = "#0000FF";
const timeout = 60000;

const data = new SlashCommandBuilder()
	.setName("query")
	.setDescription("Queries from a selected dataset.")
	.addSubcommand((sc) => sc.setName("courses").setDescription('Query data for a dataset of type "courses"'))
	.addSubcommand((sc) => sc.setName("rooms").setDescription('Query data for a dataset of type "rooms"'));

const execute = async (interaction: CommandInteraction<CacheType>) => {
	const subcommand = interaction.options.getSubcommand();
	const options = ["name", "filter", "select", "order", "submit"];

	// VARS
	let query: Query;

	let name: string | null = null;
	let filter: Filter | null = null;
	let getFilterString = (filter: Filter) => {
		const type = Object.keys(filter)[0];
		const field = Object.keys(Object.values(filter)[0])[0];
		const value = Object.values(Object.values(filter)[0])[0];
		const comparator = type === "LT" ? "<" : type === "GT" ? ">" : "=";
		return `${field.split("_")[1]} ${comparator} ${value}`;
	};
	let select: string[] = [];
	let getSelectString = (s: string[]) => s.join(", ");
	let order: string | null = null;
	let isSubmittable = () => name !== null && select.length !== 0;

	const sendMainPage = async (isReturning: boolean) => {
		const queryEmbed = new MessageEmbed()
			.setColor(msgColor)
			.setTitle(`Query Builder (/query ${subcommand})`)
			.setDescription("Select a field to fill in. The ones in blue are mandatory for submission.")
			.addField("Name", name ?? "Not selected", false)
			.addField("Filter", filter ? getFilterString(filter) : "None", false)
			.addField("Select", select.length > 0 ? getSelectString(select) : "None", false)
			.addField("Order", order ?? "Not selected", false);

		const setupButtons = getButtons(name, isSubmittable());

		if (isReturning) {
			await interaction.editReply({embeds: [queryEmbed], components: [setupButtons]});
		} else {
			await interaction.reply({
				embeds: [queryEmbed],
				components: [setupButtons],
				ephemeral: true,
			});
		}

		const buttonFilter = (i: MessageComponentInteraction) =>
			options.includes(i.customId) && i.user.id === interaction.user.id;
		const buttonCollector = interaction.channel?.createMessageComponentCollector({
			filter: buttonFilter,
			time: timeout,
		});

		buttonCollector?.on("collect", async (i) => {
			i.deferUpdate();
			buttonCollector.stop();
			switch (i.customId) {
				case "name":
					sendEditNamePage();
					break;
				case "filter":
					sendEditFilterPage();
					break;
				case "select":
					sendEditSelectPage();
					break;
				case "order":
					sendEditOrderPage();
					break;
				case "submit":
					let result;
					try {
						result = (
							await axios.post(config.server_url + "/query", query.buildQuery(filter, select, order))
						).data;
					} catch (error) {
						interaction.channel?.send({
							content: `\`\`\`\n${(error as any).response.data.error as string}\n\`\`\``,
						});
						return;
					}

					const attachment = new MessageAttachment(
						Buffer.from(formatQueryResult(result.result), "ascii"),
						"result.txt"
					);

					interaction.channel?.send({
						files: [attachment],
						content: `\`\`\`sql\nSELECT ${getSelectString(select)} FROM ${name} ${
							filter ? "WHERE " + getFilterString(filter) : ""
						} ${order ? "ORDER BY " + order : ""}\n\`\`\``,
					});
				default:
			}
		});
	};

	const sendEditNamePage = async () => {
		const embed = new MessageEmbed()
			.setColor(msgColor)
			.setTitle("Choose Dataset Name")
			.setDescription("Please send a message with the name of the dataset from which you want to query.")
			.addField("Name", name ?? "Not selected");

		await interaction.editReply({embeds: [embed], components: []});
		const messageFilter = (m: Message) => m.author.id === interaction.user.id;
		const messageCollector = interaction.channel?.createMessageCollector({filter: messageFilter, time: timeout});
		messageCollector?.on("collect", async (m) => {
			name = m.content;
			if (subcommand === "rooms") {
				query = new RoomsQuery(name);
			} else {
				query = new CourseQuery(name);
			}
			messageCollector.stop();
			sendMainPage(true);
		});
	};

	const sendEditFilterPage = async () => {
		let operator: string | null = null;
		let key: string | null = null;
		let value: number | string | null = null;
		const embed = new MessageEmbed()
			.setColor(msgColor)
			.setTitle("Add a filter")
			.setDescription("Select a field to filter by.");

		await interaction.editReply({
			embeds: [embed],
			components: getCompareKeyButtons(Object.keys(query.getOptions())),
		});

		const buttonFilter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
		const buttonCollector = interaction.channel?.createMessageComponentCollector({
			filter: buttonFilter,
			time: timeout,
		});

		buttonCollector?.on("collect", async (i) => {
			i.deferUpdate();

			if (query.getOptions()[i.customId]) {
				key = i.customId;
				embed.addField("Key", key).setDescription("Operator");
				await interaction.editReply({
					embeds: [embed],
					components: [getCompareOpButtons(query.getOptions()[i.customId])],
				});
			} else if (i.customId === "LT" || i.customId === "GT" || i.customId === "EQ" || i.customId === "IS") {
				operator = i.customId;
				embed.addField("Operator", operator).setDescription("Type a value to compare to");
				await interaction.editReply({embeds: [embed], components: []});
				buttonCollector.stop();

				const messageFilter = (m: Message) => m.author.id === interaction.user.id;
				const messageCollector = interaction.channel?.createMessageCollector({
					filter: messageFilter,
					time: timeout,
				});
				messageCollector?.on("collect", async (m) => {
					if (operator !== "IS" && isNaN(Number(m.content))) {
						embed.setDescription("Value must be a number");
						await interaction.editReply({embeds: [embed], components: []});
						return;
					}
					value = operator === "IS" ? m.content : Number(m.content);
					messageCollector.stop();
					filter = query.buildFilter(operator, value, key);
					sendMainPage(true);
				});
			}
		});
	};

	const sendEditSelectPage = async () => {
		const embed = new MessageEmbed().setColor(msgColor).setTitle("Choose Columns to display in the final output.");
		await interaction.editReply({
			embeds: [embed],
			components: [
				...getCompareKeyButtons(Object.keys(query.getOptions()), select),
				new MessageActionRow().addComponents(
					new MessageButton().setCustomId("_done").setLabel("Done").setStyle("SUCCESS")
				),
			],
		});

		const buttonFilter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
		const buttonCollector = interaction.channel?.createMessageComponentCollector({
			filter: buttonFilter,
			time: timeout,
		});
		buttonCollector?.on("collect", async (i) => {
			i.deferUpdate();
			if (i.customId === "_done") {
				buttonCollector.stop();
				sendMainPage(true);
				return;
			}
			if (select.includes(i.customId)) {
				select.splice(select.indexOf(i.customId) ?? 0, 1);
			} else {
				select.push(i.customId);
			}
			await interaction.editReply({
				embeds: [embed],
				components: [
					...getCompareKeyButtons(Object.keys(query.getOptions()), select),
					new MessageActionRow().addComponents(
						new MessageButton().setCustomId("_done").setLabel("Done").setStyle("SUCCESS")
					),
				],
			});
		});
	};

	const sendEditOrderPage = async () => {
		const embed = new MessageEmbed().setColor(msgColor).setTitle("Choose a field to sort your results by");
		await interaction.editReply({
			embeds: [embed],
			components: [
				...getCompareKeyButtons(select),
				new MessageActionRow().addComponents(
					new MessageButton().setCustomId("_none").setLabel("None").setStyle("SECONDARY")
				),
			],
		});

		const buttonFilter = (i: MessageComponentInteraction) => i.user.id === interaction.user.id;
		const buttonCollector = interaction.channel?.createMessageComponentCollector({
			filter: buttonFilter,
			time: timeout,
		});
		buttonCollector?.on("collect", async (i) => {
			i.deferUpdate();
			order = i.customId;
			if (i.customId === "_none") {
				order = null;
			}
			buttonCollector.stop();
			sendMainPage(true);
		});
	};

	sendMainPage(false);
};

const getButtons = (name: string | null, isSubmittable: boolean) => {
	return new MessageActionRow().addComponents(
		new MessageButton().setCustomId("name").setLabel("Set Name").setStyle("PRIMARY"),
		new MessageButton()
			.setCustomId("filter")
			.setLabel("Add filter")
			.setStyle("SECONDARY")
			.setDisabled(name === null),
		new MessageButton()
			.setCustomId("select")
			.setLabel("Select fields")
			.setStyle("PRIMARY")
			.setDisabled(name === null),
		new MessageButton().setCustomId("order").setLabel("Order by").setStyle("SECONDARY").setDisabled(!isSubmittable),
		new MessageButton().setCustomId("submit").setLabel("Submit").setStyle("PRIMARY").setDisabled(!isSubmittable)
	);
};

const getCompareKeyButtons = (options: string[], selected?: string[]) => {
	const buttons: MessageActionRow[] = [];
	const numRows = Math.ceil(options.length / 4) - 1;
	const selectedStyle = (field: string) => (selected?.includes(field) ? "PRIMARY" : "SECONDARY");
	for (let i = 0; i < numRows; i++) {
		buttons.push(
			new MessageActionRow().addComponents(
				new MessageButton()
					.setCustomId(options[i * 4])
					.setLabel(options[i * 4])
					.setStyle(selectedStyle(options[i * 4])),
				new MessageButton()
					.setCustomId(options[i * 4 + 1])
					.setLabel(options[i * 4 + 1])
					.setStyle(selectedStyle(options[i * 4 + 1])),
				new MessageButton()
					.setCustomId(options[i * 4 + 2])
					.setLabel(options[i * 4 + 2])
					.setStyle(selectedStyle(options[i * 4 + 2])),
				new MessageButton()
					.setCustomId(options[i * 4 + 3])
					.setLabel(options[i * 4 + 3])
					.setStyle(selectedStyle(options[i * 4 + 3]))
			)
		);
	}
	const lastRow: MessageButton[] = [];
	for (let i = numRows * 4; i < options.length; i++) {
		lastRow.push(
			new MessageButton().setCustomId(options[i]).setLabel(options[i]).setStyle(selectedStyle(options[i]))
		);
	}
	buttons.push(new MessageActionRow().addComponents(lastRow));

	return buttons;
};

const getCompareOpButtons = (type: string) => {
	if (type === "number")
		return new MessageActionRow().addComponents(
			new MessageButton().setCustomId("LT").setLabel("<").setStyle("SECONDARY"),
			new MessageButton().setCustomId("GT").setLabel(">").setStyle("SECONDARY"),
			new MessageButton().setCustomId("EQ").setLabel("=").setStyle("SECONDARY")
		);
	else {
		return new MessageActionRow().addComponents(
			new MessageButton().setCustomId("IS").setLabel("=").setStyle("SECONDARY")
		);
	}
};

const cmd: SlashCommand = {data: data as SlashCommandBuilder, execute};
module.exports = cmd;
