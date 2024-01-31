import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import {
  WebView,
  type WebViewProps,
  type WebViewMessageEvent,
} from 'react-native-webview';

// @ts-ignore
import editorHTML from '../Editor/build/index.html';

import { type EditorMessage, EditorMessageType } from '../types/Messaging';
import { useKeyboardUp } from '../utils';
import type { EditorInstance } from '../types';

interface RichTextProps extends WebViewProps {
  editor: EditorInstance;
  DEV?: boolean;
  avoidIosKeyboard?: boolean;
}

const DEV_SERVER_URL = 'http://localhost:3000';

export const RichText = (props: RichTextProps) => {
  const { DEV, editor, avoidIosKeyboard } = props;
  const iosKeyboardHeight = useKeyboardUp();
  const source: WebViewProps['source'] = DEV
    ? { uri: DEV_SERVER_URL }
    : { html: editorHTML };

  const onWebviewMessage = (event: WebViewMessageEvent) => {
    const { data } = event.nativeEvent;
    // Parse the message sent from the editor
    const { type, payload } = JSON.parse(data) as EditorMessage;
    switch (type) {
      case EditorMessageType.StateUpdate:
        editor._updateEditorState(payload);
        break;
    }
  };

  useEffect(() => {
    // On iOS we want to control the scroll and not use the scrollview that comes with react-native-webview
    // That's way we can get better exp on scroll and scroll to element when we need to
    if (avoidIosKeyboard && editor.webviewRef.current) {
      console.log('avoidIosKeyboard', iosKeyboardHeight);
      if (iosKeyboardHeight) {
        editor.webviewRef.current.injectJavaScript(`
          document.querySelector('.ProseMirror').style.paddingBottom = '${
            iosKeyboardHeight + 10
          }px';
        `);
        editor.updateScrollThresholdAndMargin(iosKeyboardHeight + 10);
      } else {
        editor.webviewRef.current.injectJavaScript(`
          document.querySelector('.ProseMirror').style.paddingBottom = '0px';
        `);
        editor.updateScrollThresholdAndMargin(0);
      }
    }
  }, [avoidIosKeyboard, editor, iosKeyboardHeight]);

  return (
    <WebView
      scrollEnabled={false}
      style={RichTextStyles.fullScreen}
      source={source}
      injectedJavaScript={
        editor.plugins
          ? `
            setTimeout(() => {

                  var css = \`${editor.plugins
                    .map((e) => e.extendCSS)
                    .join(' ')}\`,
                  head = document.head || document.getElementsByTagName('head')[0],
                  style = document.createElement('style');
      
              head.appendChild(style);
      
              style.type = 'text/css';
              if (style.styleSheet){
                // This is required for IE8 and below.
                style.styleSheet.cssText = css;
              } else {
                style.appendChild(document.createTextNode(css));
              }
            }, 5000)
            `
          : undefined
      }
      injectedJavaScriptBeforeContentLoaded={
        editor.plugins
          ? `
          window.whiteListPlugins = [${editor.plugins
            .map((plugin) => `'${plugin.name}'`)
            .join(',')}];
              var css = 'p { background: red; }',
              head = document.head || document.getElementsByTagName('head')[0],
              style = document.createElement('style');

          head.appendChild(style);

          style.type = 'text/css';
          if (style.styleSheet){
            // This is required for IE8 and below.
            style.styleSheet.cssText = css;
          } else {
            style.appendChild(document.createTextNode(css));
          }
              `
          : undefined
      }
      hideKeyboardAccessoryView={true}
      onMessage={onWebviewMessage}
      ref={props.editor.webviewRef}
      webviewDebuggingEnabled={__DEV__}
      {...props}
    />
  );
};

const RichTextStyles = StyleSheet.create({
  fullScreen: {
    flex: 1,
  },
});
