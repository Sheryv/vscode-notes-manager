import * as vscode from 'vscode';
import { commands, window, workspace } from 'vscode';
import { dis, ID, Utils } from './utils';

export class CodelensProvider implements vscode.CodeLensProvider {

  private codeLenses: vscode.CodeLens[] = [];
  // private fieldsRegex: RegExp = /\*?\*?(?<name>\w+)\*?\*? *: *(?<value>[:"' .\-+\w/]+),? */g;
  private regex: RegExp = /#{1,2}  ?\S*\w+[ \S]+ {8,}<!-- .*id=\w+.* -->/g;
  private regex2: RegExp = / *((#[ \t]{4,})|(##[ \t]{4,}))\S*\w+[ \S]+/g;
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

  constructor(private context: vscode.ExtensionContext) {
    vscode.workspace.onDidChangeConfiguration((_) => {
      this._onDidChangeCodeLenses.fire();
    });


    dis(commands.registerCommand(CodelensProvider.ACTION_ID, (args: any) => {
      window.showInformationMessage(`CodeLens action clicked with args=${args}`);
    }));
    dis(commands.registerCommand(CodelensProvider.ACTION_ID_DATE, (args: any) => {
      window.showInformationMessage(`Date CodeLens action clicked with args=${args}`);
    }));
  }

  public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {

    if (vscode.workspace.getConfiguration('codelens-sample').get('enableCodeLens', true)) {
      this.codeLenses = [];
      const regex = new RegExp(this.regex);
      const text = document.getText();
      let matches;
      while ((matches = regex.exec(text)) !== null) {
        const line = document.lineAt(document.positionAt(matches.index).line);
        // const indexOf = line.text.indexOf(matches[0]);
        // const position = new vscode.Position(line.lineNumber, indexOf);

        // const range = document.getWordRangeAtPosition(position, new RegExp(this.regex));
        // if (range) {
        //   this.codeLenses.push(new vscode.CodeLens(range));
        // }
        this.codeLenses.push(HeaderCodeLens.statusPart(line));
        this.codeLenses.push(HeaderCodeLens.datePart(line));
      }
      return this.codeLenses;
    }
    return [];
  }

  public resolveCodeLens(codeLens: vscode.CodeLens, token: vscode.CancellationToken) {
    // if (vscode.workspace.getConfiguration('codelens-sample').get('enableCodeLens', true)) {
    //   codeLens.command = {
    //     title: 'Codelens provided by sample extension',
    //     tooltip: 'Tooltip provided by sample extension',
    //     command: CodelensProvider.ACTION_ID,
    //     arguments: ['Argument 1', codeLens.range],
    //   };
    //   return codeLens;
    // }
    return null;
  }

  static ACTION_ID = Utils.buildId('codelensAction');
  static ACTION_ID_DATE = Utils.buildId('codelensActionDate');

}

class HeaderCodeLens extends vscode.CodeLens {


  static statusPart(line: vscode.TextLine) {
    return new HeaderCodeLens(line.range, {
      title: 'Done',
      tooltip: 'Click for details',
      command: CodelensProvider.ACTION_ID,
      arguments: [line.text.substring(line.firstNonWhitespaceCharacterIndex), line],
    });
  }

  static datePart(line: vscode.TextLine) {
    return new HeaderCodeLens(line.range, {
      title: `Created ${new Date().toLocaleString()}`,
      tooltip: 'Click for details',
      command: CodelensProvider.ACTION_ID_DATE,
      arguments: [line.text.substring(line.firstNonWhitespaceCharacterIndex), line],
    });
  }
}
