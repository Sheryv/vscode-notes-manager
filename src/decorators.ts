import * as vscode from 'vscode';
import { DecorationRangeBehavior } from 'vscode';
import { ID, Utils } from './utils';

export function decorators(context: vscode.ExtensionContext) {

  let statuses: Map<string, vscode.TextEditorDecorationType> = Object.keys(Utils.TASK_STATUS).reduce((acc, t) => {
    let status = Utils.TASK_STATUS[t as keyof typeof Utils.TASK_STATUS];
    acc.set(t, createTaskStatusDecoration(status.color, status.borderColor));
    return acc;
  }, new Map<string, vscode.TextEditorDecorationType>);

  const tagDef = vscode.window.createTextEditorDecorationType({
    color: '#f92672',
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
  });

  let timeout: NodeJS.Timer | undefined = undefined;

  let activeEditor = vscode.window.activeTextEditor;
  const regEx = /\s#[\w_-]+/g;

  function updateDecorations() {
    if (!activeEditor) {
      return;
    }
    // const text = activeEditor.document.getText();
    for (let st of statuses.keys()) {
      activeEditor.setDecorations(statuses.get(st)!, findAllMarkers(st, activeEditor.document));
    }


    if (vscode.workspace.getConfiguration(ID).get('enableTagsColoring', true)) {
      const text = activeEditor.document.getText();
      const defs: vscode.DecorationOptions[] = [];
      let match;
      while ((match = regEx.exec(text))) {
        const startPos = activeEditor.document.positionAt(match.index);
        const endPos = activeEditor.document.positionAt(match.index + match[0].length);
        const decoration = { range: new vscode.Range(startPos, endPos) };
        defs.push(decoration);
      }
      activeEditor.setDecorations(tagDef, defs);
    }
  }

  function triggerUpdateDecorations(throttle = false) {
    if (timeout) {
      // @ts-ignore
      clearTimeout(timeout);
      timeout = undefined;
    }
    if (throttle) {
      timeout = setTimeout(updateDecorations, 500);
    } else {
      updateDecorations();
    }
  }

  if (activeEditor) {
    triggerUpdateDecorations();
  }

  vscode.window.onDidChangeActiveTextEditor(editor => {
    activeEditor = editor;
    if (editor) {
      triggerUpdateDecorations();
    }
  }, null, context.subscriptions);

  vscode.workspace.onDidChangeTextDocument(event => {
    if (activeEditor && event.document === activeEditor.document) {
      triggerUpdateDecorations(true);
    }
  }, null, context.subscriptions);

}


function findAllMarkers(pattern: string, document: vscode.TextDocument): vscode.DecorationOptions[] {
  const extended = `::${pattern}::`;
  const arr = findMarkers(extended.toUpperCase(), document);
  arr.push(...findMarkers(extended.toLowerCase(), document));
  return arr;
}

function findMarkers(pattern: string, document: vscode.TextDocument): vscode.DecorationOptions[] {
  const decorationOptions: vscode.DecorationOptions[] = [];
  const text = document.getText();
  let i = 0;
  while (i < text.length - 1) {
    let next = text.indexOf(pattern, i);
    if (i <= next) {
      const startPos = document.positionAt(next);
      const endPos = document.positionAt(next + pattern.length);
      // const text = document.lineAt(endPos.line).text.substring(endPos.character).trim();
      const decoration: vscode.DecorationOptions = {
        range: new vscode.Range(startPos, endPos),
        // hoverMessage: `Todo task: ${text}`,
      };
      next += pattern.length;
      decorationOptions.push(decoration);
    }
    if (next < 0) {
      break;
    }
    i = next;
  }
  return decorationOptions;
}

function createTaskStatusDecoration(textColor: string, borderColor: string, suffixText: string | null = null, spacing: number = 0) {
  const opt: vscode.DecorationRenderOptions = {
    borderWidth: '1px',
    borderStyle: 'solid',
    borderSpacing: '0px',
    borderRadius: '3px',

    // letterSpacing: '0',
    borderColor: borderColor,
    backgroundColor: 'rgb(33,33,33)',
    color: textColor,
    rangeBehavior: DecorationRangeBehavior.ClosedClosed,
    letterSpacing: `${spacing}px`,
    // outlineColor: '#fff',
    // outlineStyle: 'solid',
    // outlineWidth: '1px',

    // fontWeight: 'bold',
    // overviewRulerColor: 'blue',
    // overviewRulerLane: vscode.OverviewRulerLane.Right,
    light: {
    //   // this color will be used in light color themes
    //   borderColor: 'rgb(101,101,101)',
      backgroundColor: textColor,
      color: '#fff',
    },
    // dark: {
    //   // this color will be used in dark color themes
    // },
  };
  if (suffixText) {
    opt.after = {
      contentText: suffixText,

    };
  }
  return vscode.window.createTextEditorDecorationType(opt);
}
