import { Disposable, ExtensionContext } from 'vscode';


export type TaskStatus = keyof typeof Utils.TASK_STATUS;

export class Utils {
  static setContext(context: ExtensionContext | null = null) {
    extensionContext = context;
  }


  static registerDisposable(disp: Disposable) {
    // @ts-ignore
    extensionContext.subscriptions.push(disp);
    return disp;
  }

  static buildId(...suffix: string[]) {
    return [ID, ...suffix].join('.');
  }

  static TASK_STATUS = {
    todo: { color: 'rgb(255 177 63)', borderColor: 'rgb(203,131,30)' },
    doing: { color: 'rgb(87 190 255)', borderColor: 'rgb(4,86,141)' },
    done: { color: 'rgb(70,171,0)', borderColor: 'rgb(56,136,0)' },
    later: { color: 'rgb(149,18,255)', borderColor: 'rgb(109,0,194)' },
    // reject: { color: 'rgb(0,255,82)', borderColor: 'rgb(0,136,49)' },
    block: { color: 'rgb(246,44,44)', borderColor: 'rgb(147,0,0)' },
    reject: { color: 'rgb(3 193 130)', borderColor: 'rgb(0,136,75)' },
  };
  static TASK_STATUS_MIN_LENGTH = 5 + 4;

  static taskStatusPattern(status: string): string {
    return `::${status}::`;
  }
}

export const ID = 'sheryv-notes-manager';
let extensionContext: ExtensionContext | null = null;

export const dis = Utils.registerDisposable;

/*
alt+oem_comma
alt+oem_period
ctrl+alt+n
ctrl+alt+enter
* * */
