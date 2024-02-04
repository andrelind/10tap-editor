import debounce from 'lodash/debounce';
import { useEffect } from 'react';
import { useEditor } from '@tiptap/react';
import { Editor } from '@tiptap/core';
import { EditorMessage, EditorMessageType } from '../types/Messaging';
import { EditorUpdateSettings } from '../types/Actions';
import focusListener from './utils/focusListener';
import { TenTapStartKit } from './plugins/StarterKit';
import { UnderlineBridge } from './plugins/underline';
import { EditorState } from '../types/EditorState';
import { TaskListBridge } from './plugins/tasklist';
import { LinkBridge } from './plugins/link';
import { ColorBridge } from './plugins/color';
import { HighlightBridge } from './plugins/highlight';
import { CoreBridge } from './plugins/core';
import { ImageBridge } from './plugins/image';

const tenTapExtensions = [
  TenTapStartKit,
  UnderlineBridge,
  ImageBridge,
  TaskListBridge,
  LinkBridge,
  ColorBridge,
  HighlightBridge,
  CoreBridge,
].filter(
  (e) => !window.whiteListPlugins || window.whiteListPlugins.includes(e.name)
);

function filterExists<T>(object: T): object is NonNullable<T> {
  return object !== null && object !== undefined;
}

const extensions = tenTapExtensions
  .map((e) => e.tiptapExtension)
  .filter(filterExists)
  .flat();

const content = window.initialContent || '';

const sendMessage = (message: EditorMessage) => {
  // @ts-ignore TODO fix type
  window.ReactNativeWebView?.postMessage(JSON.stringify(message));
};

const sendStateUpdate = debounce((editor: Editor) => {
  let payload = {
    // core
    isReady: true,
    isFocused: focusListener.isFocused,
  };

  const state = tenTapExtensions.reduce((acc, e) => {
    return Object.assign(acc, e.extendEditorState(editor));
  }, payload) as EditorState;

  sendMessage({
    type: EditorMessageType.StateUpdate,
    payload: state,
  });
}, 10);

export const useTenTap = () => {
  const editor = useEditor({
    extensions,
    content,
    onCreate: () =>
      sendMessage({ type: EditorMessageType.EditorReady, payload: null }),
    onUpdate: (onUpdate) => sendStateUpdate(onUpdate.editor),
    onSelectionUpdate: (onUpdate) => sendStateUpdate(onUpdate.editor),
    onTransaction: (onUpdate) => sendStateUpdate(onUpdate.editor),
  });

  useEffect(() => {
    if (!editor) return;
    // Subscribe to editor message
    const handleEditorAction = (action: any) => {
      tenTapExtensions.forEach((e) => {
        e.onBridgeMessage(editor, action, sendMessage);
      });
      if (action.type === EditorUpdateSettings.UpdateScrollThresholdAndMargin) {
        editor.setOptions({
          editorProps: {
            scrollThreshold: {
              top: 0,
              bottom: action.payload,
              right: 0,
              left: 0,
            },
            scrollMargin: { top: 0, bottom: action.payload, right: 0, left: 0 },
          },
        });
      }
    };
    const handleWebviewMessage = (event: MessageEvent | Event) => {
      if (!(event instanceof MessageEvent)) return; // TODO check android
      const { type, payload } = JSON.parse(event.data) as EditorMessage;
      console.log('Received message from webview', { type, payload });
      switch (type) {
        case EditorMessageType.Action:
          if (payload.type === EditorUpdateSettings.Focus) {
            editor.commands.focus(payload.payload);
          }
          // Handle actions
          handleEditorAction(payload);
          break;
      }
    };
    // We need to listen to both window and document events because some platform get
    // webview messages from window and some from document
    window.addEventListener('message', handleWebviewMessage);
    document.addEventListener('message', handleWebviewMessage);

    return () => {
      window.removeEventListener('message', handleWebviewMessage);
      document.removeEventListener('message', handleWebviewMessage);
    };
  }, [editor]);

  return editor;
};
