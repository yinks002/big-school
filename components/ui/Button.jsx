import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { COLORS, SHADOWS } from '../../constants/theme';

export default function Button({ title, onPress, variant = 'primary', isLoading }) {
  const isOutline = variant === 'outline';

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isOutline ? styles.outline : styles.primary,
        !isOutline && SHADOWS.medium // Add shadow only to filled buttons
      ]} 
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.8}
    >
      {isLoading ? (
        <ActivityIndicator color={isOutline ? COLORS.primary : "#fff"} />
      ) : (
        <Text style={[styles.text, isOutline && styles.textOutline]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56, // Tall button
    borderRadius: 30, // Full Pill shape
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 8,
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.stroke,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  textOutline: {
    color: COLORS.textPrimary,
  },
});