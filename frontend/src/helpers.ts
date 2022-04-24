const AsciiTable = require("ascii-table");

export const formatQueryResult = (result: object[]) => {
	if (result.length === 0) {
		return "No results.";
	}
	const table = new AsciiTable("Query Result");
	table.setHeading(...Object.keys(result[0]));
	result.forEach((res) => {
		table.addRow(...Object.values(res));
	});
	return table.toString();
};
