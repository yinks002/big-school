import { router } from 'expo-router';
import { BookOpen, Calculator, ChevronLeft, Cpu, FlaskConical, Globe, Landmark } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];
// Available icons for you to pick from
const ICONS = [
  { name: 'Calculator', component: Calculator },
  { name: 'BookOpen', component: BookOpen },
  { name: 'FlaskConical', component: FlaskConical },
  { name: 'Landmark', component: Landmark },
  { name: 'Globe', component: Globe },
  { name: 'Cpu', component: Cpu },
];
const COLORS_LIST = ['#00D06C', '#2855FF', '#FF9600', '#CE82FF', '#FF4B4B'];

export default function CreateSubject() {
  const [name, setName] = useState('');
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(COLORS_LIST[0]);
  const [loading, setLoading] = useState(false);

const handleCreate = async () => {
    if (!name) {
      Alert.alert('Error', 'Please enter a Subject Name');
      return;
    }
    setLoading(true);
    console.log("Attempting to create subject:", name, selectedClass); // 🔍 Log start

    try {
      const { data, error } = await supabase.from('subjects').insert([{
        name,
        level: selectedClass,
        icon_name: selectedIcon.name,
        color: selectedColor
      }]).select(); // Adding .select() returns the created data, good for debugging

      if (error) {
        console.error("Supabase Error:", error); // 🔴 Log the real error
        throw error;
      }

      console.log("Success:", data); // 🟢 Log success
      Alert.alert('Success', `${name} created for ${selectedClass}!`);
      setName(''); 
    } catch (error) {
      // Show the actual technical message on the screen so we can see it
      Alert.alert('Error', error.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Subject</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* 1. Subject Name */}
        <Input label="Subject Name" placeholder="e.g. Mathematics" value={name} onChangeText={setName} />

        {/* 2. Select Class */}
        <Text style={styles.label}>Select Class Level</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.rowScroll}>
          {CLASSES.map((cls) => (
            <TouchableOpacity 
              key={cls} 
              style={[styles.chip, selectedClass === cls && styles.chipActive]}
              onPress={() => setSelectedClass(cls)}
            >
              <Text style={[styles.chipText, selectedClass === cls && styles.chipTextActive]}>{cls}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 3. Select Icon */}
        <Text style={styles.label}>Choose Icon</Text>
        <View style={styles.grid}>
          {ICONS.map((item) => (
            <TouchableOpacity 
              key={item.name} 
              style={[styles.iconBox, selectedIcon.name === item.name && { borderColor: COLORS.primary, borderWidth: 2 }]}
              onPress={() => setSelectedIcon(item)}
            >
              <item.component size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. Select Color */}
        <Text style={styles.label}>Choose Color</Text>
        <View style={styles.grid}>
          {COLORS_LIST.map((color) => (
            <TouchableOpacity 
              key={color} 
              style={[styles.colorCircle, { backgroundColor: color }, selectedColor === color && { borderWidth: 3, borderColor: '#000' }]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>

        <View style={{ marginTop: 20 }}>
          <Button title="Create Subject" onPress={handleCreate} isLoading={loading} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  label: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginTop: 20, marginBottom: 10 },
  rowScroll: { flexDirection: 'row', marginBottom: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#eee' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  grid: { flexDirection: 'row', gap: 15 },
  iconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#eee' },
  colorCircle: { width: 40, height: 40, borderRadius: 20 },
});