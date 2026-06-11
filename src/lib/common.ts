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