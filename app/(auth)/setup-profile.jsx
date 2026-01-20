import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

const CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

export default function SetupProfile() {
  const { session } = useAuth();
  const [fullName, setFullName] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState('student'); // Default to student
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    // 1. Check who this user is (Student? Teacher? Parent?)
    const checkRole = async () => {
        if (!session?.user) return;
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();
        
        if (data) setRole(data.role);
        setFetching(false);
    };
    checkRole();
  }, [session]);

  const handleSave = async () => {
    if (!fullName) return Alert.alert("Error", "Please enter your full name");
    
    // Only require class if user is a STUDENT
    if (role === 'student' && !selectedClass) return Alert.alert("Error", "Please select your class");

    setLoading(true);
    try {
      const updates = {
        id: session.user.id,
        full_name: fullName,
        updated_at: new Date(),
      };

      // Only add class_level if it's a student
      if (role === 'student') {
          updates.class_level = selectedClass;
      }

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) throw error;

      // 2. Redirect based on Role
      if (role === 'teacher') router.replace('/(teacher)/dashboard');
      else if (role === 'parent') router.replace('/(parent)/dashboard');
      else router.replace('/(student)/home');

    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Complete Profile</Text>
        <Text style={styles.sub}>
            {role === 'parent' ? "What should we call you?" : 
             role === 'teacher' ? "What is your title?" : 
             "Tell us a bit about yourself."}
        </Text>

        <Text style={styles.label}>Full Name</Text>
        <TextInput 
          style={styles.input} 
          placeholder={role === 'teacher' ? "e.g. Mr. Adebayo" : "e.g. John Doe"} 
          value={fullName} 
          onChangeText={setFullName} 
        />

        {/* ONLY SHOW CLASS DROPDOWN FOR STUDENTS */}
        {role === 'student' && (
            <>
                <Text style={styles.label}>Select Class</Text>
                <View style={styles.grid}>
                {CLASSES.map((cls) => (
                    <TouchableOpacity 
                    key={cls} 
                    style={[styles.chip, selectedClass === cls && styles.chipActive]}
                    onPress={() => setSelectedClass(cls)}
                    >
                    <Text style={[styles.chipText, selectedClass === cls && styles.chipTextActive]}>{cls}</Text>
                    </TouchableOpacity>
                ))}
                </View>
            </>
        )}

        <TouchableOpacity style={styles.btn} onPress={handleSave} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Get Started</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 30, paddingTop: 50 },
  title: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 10 },
  sub: { fontSize: 16, color: '#666', marginBottom: 30 },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 10 },
  input: { backgroundColor: '#F5F7FA', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  chip: { paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F0F2F5', borderWidth: 1, borderColor: 'transparent' },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { fontWeight: '600', color: '#666' },
  chipTextActive: { color: '#fff' },
  btn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});