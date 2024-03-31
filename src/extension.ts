// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { commands, ExtensionContext, languages, Position, Range, window } from 'vscode';
import { CodelensProvider } from './codelens-provider';
import { dis, ID, TaskStatus, Utils } from './utils';
import { decorators } from './decorators';
import { externalExtensionsSupport } from './external-extensions-support';


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: ExtensionContext) {
  Utils.setContext(context);

  codelens(context);
  decorators(context);
  actions(context);
  externalExtensionsSupport(context);
}

function codelens(context: ExtensionContext) {
  // const codelensProvider = new CodelensProvider(context);
  //
  // dis(languages.registerCodeLensProvider('markdown', codelensProvider));
}


// This method is called when your extension is deactivated
export function deactivate() {
  Utils.setContext(null);
}

function actions(context: ExtensionContext) {
  const template = `---
created: \${CURRENT_YEAR}-\${CURRENT_MONTH}-\${CURRENT_DATE} \${CURRENT_HOUR}:\${CURRENT_MINUTE}:\${CURRENT_SECOND}
id: \${CURRENT_SECONDS_UNIX}
---

# \${1:$TM_FILENAME_BASE}        <!-- id=\${CURRENT_SECONDS_UNIX}; ct=\${CURRENT_YEAR}-\${CURRENT_MONTH}-\${CURRENT_DATE} \${CURRENT_HOUR}:\${CURRENT_MINUTE}:\${CURRENT_SECOND} -->

\${2}
  `;

  dis(commands.registerCommand(Utils.buildId('foam', 'prepare-template'), () => {
    const wsedit = new vscode.WorkspaceEdit();
    const ws = vscode.workspace.workspaceFolders![0];
    const wsPath = ws.uri.fsPath;
    const filePath = vscode.Uri.file(wsPath + '/.foam/templates/new-note.md');
    wsedit.createFile(filePath, { ignoreIfExists: true, contents: new TextEncoder().encode(template) });
    // wsedit.insert(filePath, new Position(0, 0), template);
    vscode.workspace.applyEdit(wsedit).then(s => {
      if (s) {
        vscode.window.showInformationMessage(`Created a new file: .foam/templates/new-note.md in ${ws.name}`);
      }
    });
  }));

  dis(commands.registerCommand(Utils.buildId('edit', 'status', 'toggle'), (args) => toggleStatus(context, args && args[0])));
  dis(commands.registerCommand(Utils.buildId('edit', 'status', 'toggleExtended'), (args) => toggleStatus(context, args && args[0], true)));
  dis(commands.registerCommand(Utils.buildId('edit', 'status', 'set'), (args) => setStatus(context)));
}


function toggleStatus(context: ExtensionContext, newStatus: TaskStatus | null = null, extended: boolean = false) {
  const letterRegex = /\w/;
  const editor = window.activeTextEditor!;
  const cursorPos: Position = editor.selection.active;
  const line = editor.document.lineAt(cursorPos.line);

  const statuses = Object.keys(Utils.TASK_STATUS) as TaskStatus[];
  const keys = [...statuses, ...Object.keys(Utils.TASK_STATUS).map(k => k.toUpperCase())];

  let current: TaskStatus | null = null;
  let start: number = -1;
  let end: number = -1;
  for (let status of keys) {
    const pattern = Utils.taskStatusPattern(status);
    start = line.text.indexOf(pattern);
    if (start >= 0) {
      // @ts-ignore
      current = status.toLowerCase();
      end = start + pattern.length;
      break;
    }
  }
  const wsedit = new vscode.WorkspaceEdit();

  const hasNewStatus = newStatus && keys.includes(newStatus);
  let result: TaskStatus = hasNewStatus ? newStatus : 'todo';
  if (current) {
    if (!hasNewStatus) {
      if (extended) {
        const offset = statuses.indexOf(current) + 1;
        result = statuses[offset % statuses.length];
      } else {
        switch (current) {
          case 'done':
            result = 'todo';
            break;
          case 'todo':
            result = 'doing';
            break;
          default:
            result = 'done';
            break;
        }
      }
    }
    wsedit.replace(editor.document.uri, new Range(cursorPos.line, start, cursorPos.line, end), Utils.taskStatusPattern(result.toUpperCase()));
  } else {
    const match = letterRegex.exec(line.text);
    if (match) {
      start = match.index;
    } else {
      start = Math.max(line.text.length - 1, 0);
    }
    wsedit.insert(editor.document.uri, new Position(cursorPos.line, start), Utils.taskStatusPattern(result.toUpperCase()) + ' ');
  }

  return vscode.workspace.applyEdit(wsedit);
}


function setStatus(context: ExtensionContext, ...args: any[]) {
  const quickPick = window.createQuickPick();
  quickPick.items = Object.keys(Utils.TASK_STATUS).map(label => ({
    label: label.substring(0, 1).toUpperCase() + label.substring(1).toLowerCase(),
  }));
  quickPick.title = 'Select new task status';
  quickPick.placeholder = 'Filter';
  quickPick.onDidChangeSelection(selection => {
    if (selection[0]) {
      return toggleStatus(context, selection[0].label.toLowerCase() as TaskStatus).then(() => quickPick.hide());
    }
    return null;
  });
  quickPick.onDidHide(() => quickPick.dispose());
  quickPick.show();
}
