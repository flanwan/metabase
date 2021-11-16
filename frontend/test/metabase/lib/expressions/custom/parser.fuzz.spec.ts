import { lexify, parse } from "metabase/lib/expressions/custom/parser";
import { Node } from "metabase/lib/expressions/custom/types";
import { generateExpression } from "./generator";

if (process.env.MB_FUZZ) {
  describe("FUZZING custom parser", () => {
    interface AST {
      _: string;
      token: string;
      children: AST[];
      pos: number;
    }
    function cleanupAST(node: Node): AST {
      return {
        _: node._TYPE || node.Type._name || "UNKNOWN",
        token: node.token?.text || "UNKNOWN",
        children: node.children.map(cleanupAST),
        pos: node.token?.pos || -1,
      };
    }

    function parseSource(source: string, startRule: string) {
      try {
        return cleanupAST(
          parse(lexify(source), {
            throwOnError: false,
          }).root,
        );
      } catch (err) {
        // Helps get the error value in wallaby/quokka
        throw err; //?
      }
    }

    function parseExpression(expr: string) {
      return parseSource(expr, "expression");
    }

    function parseAggregation(aggregation: string) {
      return parseSource(aggregation, "aggregation");
    }

    function parseFilter(filter: string) {
      return parseSource(filter, "boolean");
    }

    const MAX_SEED = 60000;

    for (let seed = 10000; seed < MAX_SEED; ++seed) {
      it("should handle generated expression from seed " + seed, () => {
        const { expression } = generateExpression(seed);
        expect(() => parseExpression(expression)).not.toThrow();
      });
      // it("should not error on generated expression from seed " + seed, () => {
      //   const { expression } = generateExpression(seed);
      //   expect(tokenize(expression).errors).toEqual([]);
      // });
    }
  });
}
