import {Document, Element} from "parse5";

export const getTable = (index: Document): Element | null => {
	for (const element of index.childNodes) {
		if (element.nodeName === "html") {
			return getFirstElementOfType(element, "table");
		}
	}
	return null;
};

export const getFirstElementOfType = (element: Element, type: string): Element | null => {
	if (element.nodeName === type) {
		return element;
	}
	for (const child of element.childNodes) {
		if ("childNodes" in child) {
			const potentialElement = getFirstElementOfType(child, type);
			if (potentialElement !== null) {
				return potentialElement;
			}
		}
	}
	return null;
};

/**
 * Searches through HTML tree and returns all elements that match
 * the given type.
 *
 * *** IGNORES the `thead` tag and its descendants ***
 * @param root
 * @param type
 * @returns Elements with the matched type
 */
export const getAllElementsOfType = (root: Element, type: string): Element[] => {
	const elements: Element[] = [];
	for (const child of root.childNodes) {
		if ("childNodes" in child && child.nodeName !== "thead") {
			if (child.nodeName === type) {
				elements.push(child);
			} else {
				elements.push(...getAllElementsOfType(child, type));
			}
		}
	}
	return elements;
};

export const getElement = (root: Element, type: string, htmlClass: string) => {
	const children = getAllElementsOfType(root, type);
	for (const child of children) {
		for (const attr of child.attrs) {
			if (attr.name === "class" && attr.value === htmlClass) {
				return child;
			}
		}
	}
	return null;
};

export const getPathFromTD = (td: Element | null): string | null => {
	if (td === null) {
		return null;
	}
	const anchor = getFirstElementOfType(td, "a");
	if (!anchor) {
		return null;
	}
	for (const attr of anchor.attrs) {
		if (attr.name === "href") {
			return attr.value;
		}
	}
	return null;
};

export const getFirstTextFromElement = (root: Element | null): string | undefined => {
	if (!root) {
		return undefined;
	}
	for (const child of root.childNodes) {
		if ("childNodes" in child) {
			const potentialString = getFirstTextFromElement(child);
			if (potentialString) {
				return potentialString;
			}
		} else if (child.nodeName === "#text" && "value" in child) {
			const cleaned = child.value.replace("\\n", "").trim();
			if (cleaned !== "") {
				return cleaned;
			}
		}
	}
	return undefined;
};
