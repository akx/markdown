import parse from "remark-parse";
import stringify from "remark-stringify";
import math from "remark-math";
import { unified } from "unified";
import { u } from "unist-builder";
import { removePosition } from 'unist-util-remove-position';


function remark() {
  return unified()
    .use(parse, { position: false } as any)
    .use(stringify);
}

function parseAST(targetText: string) {
  const processor = remark().use(math);
  const ast = processor.parse(targetText);
  removePosition(ast, true);
  return ast;
}

function parseToString(targetText: string): string {
  const processor = remark().use(math);
  return processor.processSync(targetText).toString();
}

describe("remark-math", () => {
  it("must parse a math inline and a math block ", () => {
    const targetText = [
      "Math $\\alpha$",
      "",
      "$$",
      "\\beta+\\gamma",
      "$$",
    ].join("\n");
    const ast = parseAST(targetText);

    expect(ast).toMatchObject(
      u("root", [
        u("paragraph", [u("text", "Math "), u("inlineMath", "\\alpha")]),
        u("math", "\\beta+\\gamma"),
      ])
    );
  });

  it("must escape a dollar with backslash", () => {
    const targetText = "$\\alpha\\$";
    const ast = parseAST(targetText);

    expect(ast).toMatchObject(
      u("root", [u("paragraph", [u("text", "$\\alpha$")])])
    );
  });

  it("must escape all dollars with backslashes", () => {
    const targetText = "\\$\\alpha\\$";
    const ast = parseAST(targetText);

    expect(ast).toMatchObject(
      u("root", [u("paragraph", [u("text", "$"), u("text", "\\alpha$")])])
    );
  });

  it("must NOT escape a dollar with double backslashes", () => {
    const targetText = "\\\\$\\alpha$";
    const ast = parseAST(targetText);

    expect(ast).toMatchObject(
      u("root", [u("paragraph", [u("text", "\\"), u("inlineMath", "\\alpha")])])
    );
  });

  it("must not parse a raw starting dollar", () => {
    const targetText = "`$`\\alpha$";
    const ast = parseAST(targetText);

    expect(ast).toMatchObject(
      u("root", [u("paragraph", [u("inlineCode", "$"), u("text", "\\alpha$")])])
    );
  });

  it("fooo must not parse a raw ending dollar", () => {
    const targetText = "$\\alpha`$` foo";
    const ast = parseAST(targetText);

    expect(ast).toMatchObject(
      u("root", [
        u("paragraph", [
          u("text", "$\\alpha"),
          u("inlineCode", "$"),
          u("text", " foo"),
        ]),
      ])
    );
  });

  it("fooo must not parse allow inline to contain backticks", () => {
    const targetText = "$`\\alpha`$";
    const ast = parseAST(targetText);

    expect(ast).toMatchObject(
      u("root", [u("paragraph", [u("inlineMath", "`\\alpha`")])])
    );
  });

  it("must render a super factorial to a math block", () => {
    const targetText = "$\\alpha\\$$";
    const ast = parseAST(targetText);

    expect(ast).toMatchObject(
      u("root", [u("paragraph", [u("inlineMath", "\\alpha\\$")])])
    );
  });

  it("must render super factorial to a math inline", () => {
    const targetText = ["$$", "\\alpha\\$", "$$"].join("\n");
    const ast = parseAST(targetText);

    expect(ast).toMatchObject(u("root", [u("math", "\\alpha\\$")]));
  });

  it("must render a math block just after a pragraph", () => {
    const targetText = ["tango", "$$", "\\alpha", "$$"].join("\n");
    const ast = parseAST(targetText);

    expect(ast).toMatchObject(
      u("root", [u("paragraph", [u("text", "tango")]), u("math", "\\alpha")])
    );
  });

  it("must parse inline math between double dollars", () => {
    const targetText = "$$\\alpha$$";
    const ast = parseAST(targetText);

    expect(ast).toMatchObject(
      u("root", [u("paragraph", [u("math", "\\alpha")])])
    );
  });

  it("must stringify", () => {
    const targetText = ["$$\\alpha$$", "$$", "\\alpha\\beta", "$$"].join("\n");
    const result = parseToString(targetText);

    expect(result).toEqual(
      ["$$\n\\alpha\n$$", "", "$$", "\\alpha\\beta", "$$", ""].join("\n")
    );
  });

  it("must stringify math block child of blockquote", () => {
    const targetText = ["> $$", "> \\alpha\\beta", "> $$"].join("\n");
    const result = parseToString(targetText)

    expect(result).toEqual(["> $$", "> \\alpha\\beta", "> $$", ""].join("\n"));
  });

  it("must parse math block with indent", () => {
    const targetText = ["  $$$", "    \\alpha", "  $$$"].join("\n");
    const ast = parseAST(targetText);

    expect(ast).toMatchObject(u("root", [u("math", "  \\alpha")]));
  });

  it("must ignore everything just after opening/closing marker", () => {
    const targetText = ["$$  must", "\\alpha", "$$  be ignored", ""].join("\n");
    const ast = parseAST(targetText);

    expect(ast).toMatchObject(u("root", [u("math", "\\alpha")]));
  });

  it("must not affect next block", () => {
    const targetText = ["$$", "\\alpha", "$$", "```", "code fence", "```"].join(
      "\n"
    );
    const ast = parseAST(targetText);

    expect(ast).toMatchObject(
      u("root", [u("math", "\\alpha"), u("code", "code fence")])
    );
  });

  it("must not set inlineMathDouble class", () => {
    const targetText = "$$\\alpha$$";
    const ast = parseAST(targetText);

    expect(ast).toEqual(
      u("root", [
        u("paragraph", [
          u(
            "math",
            {
              data: {
                hChildren: [u("text", "\\alpha")],
                hName: "div",
                hProperties: {
                  className: "math",
                },
              },
            },
            "\\alpha"
          ),
        ]),
      ])
    );
  });

  it("must parse more complex math equations in math block", () => {
    const targetText = "$$p(\\theta_i \\thinspace | \\, \\{\\theta_{j \\neq i}\\}, D)$$";
    const ast = parseAST(targetText);

    expect(ast).toEqual(
      u("root", [
        u("paragraph", [
          u(
            "math",
            {
              data: {
                hChildren: [
                  u(
                    "text",
                    "p(\\theta_i \\thinspace | \\, \\{\\theta_{j \\neq i}\\}, D)"
                  ),
                ],
                hName: "div",
                hProperties: {
                  className: "math",
                },
              },
            },
            "p(\\theta_i \\thinspace | \\, \\{\\theta_{j \\neq i}\\}, D)"
          ),
        ]),
      ])
    );
  });

  it("must parse more complex math equations inline math", () => {
    const targetText = "$p(\\theta_i \\thinspace | \\, \\{\\theta_{j \\neq i}\\}, D)$";
    const ast = parseAST(targetText);

    expect(ast).toEqual(
      u("root", [
        u("paragraph", [
          u(
            "inlineMath",
            {
              data: {
                hChildren: [
                  u(
                    "text",
                    "p(\\theta_i \\thinspace | \\, \\{\\theta_{j \\neq i}\\}, D)"
                  ),
                ],
                hName: "span",
                hProperties: {
                  className: "inlineMath",
                },
              },
            },
            "p(\\theta_i \\thinspace | \\, \\{\\theta_{j \\neq i}\\}, D)"
          ),
        ]),
      ])
    );
  });
});
