import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { COLORS } from '../../constants/theme';

export default function Input({ label, placeholder, value, onChangeText, secureTextEntry, keyboardType }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        isFocused && styles.focused // Change border color when clicked
      ]}>
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textSecondary}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1.5,
    borderColor: 'transparent', // No border by default
    borderRadius: 16, // Modern pill shape
    height: 56, // Taller inputs feel more premium
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  focused: {
    borderColor: COLORS.primary, // Glows green when typing
    backgroundColor: COLORS.white,
  },
  input: {
    fontSize: 16,
    color: COLORS.textPrimary,
    height: '100%',
  },
});