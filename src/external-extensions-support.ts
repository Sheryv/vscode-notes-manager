import * as vscode from 'vscode';
import { commands } from 'vscode';
import { dis, Utils } from './utils';
import * as console from 'console';

type ExternalExtension = {
  name: string,
  id: string,
  cmds: Record<string, string>
}

const MARKDOWN_ALL_IN_ONE = {
  name: 'markdown-all-in-one',
  id: 'yzhang.markdown-all-in-one',
  cmds: {
    switchTaskStatus: 'markdown.extension.checkTaskList',
    toggleBold: 'markdown.extension.editing.toggleBold',
    toggleItalic: 'markdown.extension.editing.toggleItalic',
    toggleCodeSpan: 'markdown.extension.editing.toggleCodeSpan',
    toggleStrikethrough: 'markdown.extension.editing.toggleStrikethrough',
    toggleMath: 'markdown.extension.editing.toggleMath',
    toggleMathReverse: 'markdown.extension.editing.toggleMathReverse',
    toggleHeadingUp: 'markdown.extension.editing.toggleHeadingUp',
    toggleHeadingDown: 'markdown.extension.editing.toggleHeadingDown',
    toggleList: 'markdown.extension.editing.toggleList',
    toggleCodeBlock: 'markdown.extension.editing.toggleCodeBlock',
    toc_create: 'markdown.extension.toc.create',
    toc_update: 'markdown.extension.toc.update',
    toc_addSecNumbers: 'markdown.extension.toc.addSecNumbers',
    toc_removeSecNumbers: 'markdown.extension.toc.removeSecNumbers',
  },

};

export async function externalExtensionsSupport(context: vscode.ExtensionContext) {
  const md = await getExt(MARKDOWN_ALL_IN_ONE);
  if (md) {
    dis(commands.registerCommand(Utils.buildId('edit', 'style', 'headUp'), () => {
      commands.executeCommand(MARKDOWN_ALL_IN_ONE.cmds.toggleHeadingUp);
    }));
    dis(commands.registerCommand(Utils.buildId('edit', 'style', 'headDown'), () => {
      commands.executeCommand(MARKDOWN_ALL_IN_ONE.cmds.toggleHeadingDown);
    }));
    commands.executeCommand('setContext', Utils.buildId('context', 'markdownCommandsActive'), true);
    // console.log('Context "markdownCommandsActive" set');
  }
}

// function registerCmdForward()

function getExt(ext: ExternalExtension) {
  const extension = vscode.extensions.getExtension(ext.id);

  if (extension && !extension.isActive) {
    return extension.activate().then(() => extension,
        () => {
          console.log(`Extension "${ext.name}" activation failed`);
          return null;
        },
    );
  } else {
    return Promise.resolve(extension);
  }
}
