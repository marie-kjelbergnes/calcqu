import katex from "katex";

export function render_expression(latex: string) {
    // need to change \imaginaryI to i
    latex = latex.replaceAll("\\imaginaryI", "i");
    latex = latex.replaceAll("\\exponentialE", "e");
    // might need to make a list of replacements or something later. KaTeX can be a bit weird sometimes.
    return katex.renderToString(
        latex,
        {
            throwOnError: false,
            displayMode: true
        }
    );
}

function escape_html(text: string) {
    return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

/** Renders text containing $inline$ and $$display$$ math to html */
export function render_text(text: string) {
    return text
        .split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$)/g)
        .map((part) => {
            if (part.startsWith("$$")) {
                return katex.renderToString(part.slice(2, -2), { throwOnError: false, displayMode: true });
            }
            if (part.startsWith("$") && part.length > 1) {
                return katex.renderToString(part.slice(1, -1), { throwOnError: false });
            }
            return escape_html(part);
        })
        .join("");
}
