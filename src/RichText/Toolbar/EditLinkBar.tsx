import React from 'react';
import { Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Images } from '../../assets';
import type { EditorTheme } from '../../types';

interface EditLinkBarProps {
  theme: EditorTheme;
  onBlur: (link?:string) => void;
  onEditLink: (newLink: string) => void;
  onLinkIconClick: () => void;
  initialLink: string | undefined;
}

export const EditLinkBar = ({
  theme,
  initialLink,
  onEditLink,
  onLinkIconClick,
  onBlur,
}: EditLinkBarProps) => {
  const [link, setLink] = React.useState(initialLink || '');
  return (
    <View style={theme.toolbar.linkBarTheme.addLinkContainer}>
      <TouchableOpacity
        onPress={onLinkIconClick}
        style={[
          theme.toolbar.toolbarButton,
          theme.toolbar.linkBarTheme.linkToolbarButton,
        ]}
      >
        <View
          style={[theme.toolbar.iconWrapper, theme.toolbar.iconWrapperActive]}
        >
          <Image
            source={Images.link}
            style={[theme.toolbar.icon]}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>
      <TextInput
        value={link}
        onBlur={() => onBlur(link) }
        onChangeText={setLink}
        placeholder="Skriv in URL här..."
        placeholderTextColor={theme.toolbar.linkBarTheme.placeholderTextColor}
        autoFocus
        style={theme.toolbar.linkBarTheme.linkInput}
        autoCapitalize="none"
      />
      <TouchableOpacity
        style={theme.toolbar.linkBarTheme.doneButton}
        onPress={() => {
          onEditLink(link);
        }}
      >
        <Text style={theme.toolbar.linkBarTheme.doneButtonText}>Länka</Text>
      </TouchableOpacity>
    </View>
  );
};
