"use strict";
const vscode = require("vscode");
let pegCMake = require("peg-cmake");
function traversAST(ast, matcher) {
    ast.forEach((element) => {
        if (matcher[element.type])
            matcher[element.type](element);
    });
}
function locationToRange(location) {
    return new vscode.Range(new vscode.Position(location.start.line - 1, location.start.column - 1), new vscode.Position(location.end.line - 1, location.end.column - 1));
}
class CMakeReferenceProvider {
    provideReferences(document, position, context, token) {
        try {
            let wordAtPosition = document.getWordRangeAtPosition(position);
            let identidier = document.getText(wordAtPosition);
            const txt = document.getText();
            const ast = pegCMake.parse(txt);
            function Visitor() {
                this.identifier = identidier;
                this.definitions = [];
                this._func = (elt) => {
                    if (elt.identifier.value === this.identifier) {
                        this.definitions.push(elt.identifier);
                    }
                };
                this.macro = this._func;
                this.function = this._func;
                this.command_invocation = (elt) => {
                    if (elt.identifier.value === this.identifier) {
                        this.definitions.push(elt.identifier);
                    }
                };
                this.if = (elt) => {
                    traversAST(elt.body, this);
                    elt.elseif.foreach((e) => { traversAST(elt.body, this); });
                    if (elt.else)
                        traversAST(elt.else.body, this);
                };
            }
            ;
            let matcher = new Visitor();
            ast.forEach((element) => {
                if (matcher[element.type])
                    matcher[element.type](element);
            });
            if (matcher.definitions) {
                return matcher.definitions.map((elt) => {
                    return new vscode.Location(document.uri, locationToRange(elt.location));
                });
            }
        }
        catch (e) { }
        return null;
    }
}
exports.CMakeReferenceProvider = CMakeReferenceProvider;
//# sourceMappingURL=CMakeReferenceProvider.js.map