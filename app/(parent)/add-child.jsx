import { router } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

export default function AddChild() {
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLink = async () => {
    if (!email) return Alert.alert("Error", "Enter student email");
    setLoading(true);

    try {
     
      const { data: student, error: searchError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('email', email) // Assuming you saved email to profiles table during signup
        .single();

      if (searchError || !student) throw new Error("Student email not found. Make sure they have registered.");

      // 2. Link Parent -> Student
      const { error: linkError } = await supabase.from('parent_students').insert([{
          parent_id: session.user.id,
          student_id: student.id
      }]);

      if (linkError) {
          if (linkError.code === '23505') throw new Error("You already linked this student.");
          throw linkError;
      }

      Alert.alert("Success", `${student.full_name} has been linked to your account!`, [
          { text: "OK", onPress: () => router.back() }
      ]);

    } catch (e) {
      Alert.alert("Error", e.message);
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
        <Text style={styles.headerTitle}>Link Child</Text>
      </View>

      <View style={styles.card}>
         <Text style={styles.label}>Student Email Address</Text>
         <Text style={styles.sub}>Enter the email your child used to register on BigSchool.</Text>
         
         <TextInput 
            style={styles.input} 
            placeholder="student@example.com" 
            value={email} 
            onChangeText={setEmail} 
            autoCapitalize="none"
            keyboardType="email-address"
         />

         <Button title="Link Account" onPress={handleLink} isLoading={loading} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },
  
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16 },
  label: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 5 },
  sub: { fontSize: 14, color: '#999', marginBottom: 20 },
  input: { backgroundColor: '#F5F7FA', padding: 15, borderRadius: 12, marginBottom: 20, borderWidth: 1, borderColor: '#eee', fontSize: 16 }
});