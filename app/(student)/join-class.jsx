import { router } from 'expo-router';
import { ChevronLeft, Link as LinkIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

export default function JoinClassScreen() {
  const { session } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (code.length < 6) return Alert.alert("Error", "Please enter the full 6-digit code.");
    setLoading(true);

    try {
      const { data: classroom, error: classError } = await supabase
        .from('classrooms')
        .select('id, name')
        .eq('code', code.toUpperCase())
        .single();

      if (classError || !classroom) throw new Error("Invalid Class Code.");

      const { error: joinError } = await supabase.from('classroom_students').insert([{
          classroom_id: classroom.id,
          student_id: session.user.id
      }]);

      if (joinError) {
          if (joinError.code === '23505') {
             Alert.alert("Notice", "You are already in this class!", [
                 { text: "Go to Dashboard", onPress: () => router.replace('/(student)/home') }
             ]);
             return;
          }
          throw joinError;
      }

      // ✅ FIX: Navigate away after success
      Alert.alert("Success", `Joined ${classroom.name}!`, [
          { text: "Go to Dashboard", onPress: () => router.replace('/(student)/home') }
      ]);

    } catch (e) {
      Alert.alert("Join Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Classroom</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{flex: 1}}>
        <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.iconCircle}>
                <LinkIcon size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Enter Invite Code</Text>
            <Text style={styles.sub}>Enter the code from your teacher.</Text>

            <TextInput 
                style={styles.input} 
                placeholder="X7K9P2" 
                placeholderTextColor="#ccc"
                value={code} 
                onChangeText={setCode} 
                autoCapitalize="characters"
                maxLength={6}
            />

            <TouchableOpacity style={styles.btn} onPress={handleJoin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Join Class</Text>}
            </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  content: { alignItems: 'center', padding: 20, paddingTop: 40 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 10 },
  sub: { color: '#666', textAlign: 'center', marginBottom: 30 },
  input: { width: '100%', backgroundColor: '#F5F7FA', padding: 15, borderRadius: 16, fontSize: 24, textAlign: 'center', letterSpacing: 8, borderWidth: 2, borderColor: '#E3F2FD', fontWeight: 'bold', marginBottom: 30 },
  btn: { width: '100%', backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 }
});