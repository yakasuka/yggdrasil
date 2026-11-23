// Shared Node-side I/O for ratatoskr-template.yaml.
//
// The template carries a UTF-8 BOM so browsers render its Chinese comments
// correctly when the raw .yaml is opened (GitHub Pages serves it without a
// charset). Every script/test that touches the file must agree on the BOM:
// readers strip it so regexes/parsers see a clean first line, writers put it
// back so the shipped file stays browser-correct.
import { readFile, writeFile } from "node:fs/promises";

export const BOM = "\uFEFF";

export const stripBom = (text) => text.replace(/^\uFEFF/, "");

export async function readTemplate(path) {
  return stripBom(await readFile(path, "utf8"));
}

export async function writeTemplate(path, text) {
  await writeFile(path, BOM + stripBom(text), "utf8");
}
