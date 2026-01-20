import { router } from 'expo-router';
import { Award, BookOpen, ChevronLeft, LogOut, Save, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

const CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

export default function ProfileScreen() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile State
  const [fullName, setFullName] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [email, setEmail] = useState('');
  
  // Stats
  const [stats, setStats] = useState({ quizzes: 0, exams: 0, avgScore: 0 });

  useEffect(() => {
    fetchProfileData();
  }, [session]);

  const fetchProfileData = async () => {
    if (!session?.user) return;
    try {
      // 1. Get Profile Info
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setFullName(profile.full_name || '');
        setClassLevel(profile.class_level || 'JSS 1');
        setEmail(session.user.email);
      }

      // 2. Get Stats (Quizzes & Exams)
      const { data: quizzes } = await supabase.from('quiz_results').select('score').eq('student_id', session.user.id);
      const { data: exams } = await supabase.from('exam_results').select('score').eq('student_id', session.user.id);

      const totalQuizzes = quizzes?.length || 0;
      const totalExams = exams?.length || 0;
      
      // Calculate Average
      const allScores = [...(quizzes || []), ...(exams || [])].map(i => i.score);
      const avg = allScores.length > 0 
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) 
        : 0;

      setStats({ quizzes: totalQuizzes, exams: totalExams, avgScore: avg });

    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, class_level: classLevel })
      .eq('id', session.user.id);

    setSaving(false);
    
    if (error) {
      Alert.alert("Error", error.message);
    } else {
      Alert.alert("Success", "Profile Updated! Please restart app to see class changes.", [
        { text: "OK", onPress: () => router.replace('/(student)/home') }
      ]);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/(auth)/welcome');
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* AVATAR SECTION */}
        <View style={styles.avatarSection}>
           <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{fullName.charAt(0) || 'S'}</Text>
           </View>
           <Text style={styles.nameText}>{fullName || 'Student'}</Text>
           <Text style={styles.emailText}>{email}</Text>
        </View>

        {/* STATS GRID */}
        <View style={styles.statsRow}>
           <View style={styles.statCard}>
              <Award size={24} color={COLORS.primary} />
              <Text style={styles.statNum}>{stats.avgScore}%</Text>
              <Text style={styles.statLabel}>Avg Score</Text>
           </View>
           <View style={styles.statCard}>
              <BookOpen size={24} color={COLORS.secondary} />
              <Text style={styles.statNum}>{stats.quizzes + stats.exams}</Text>
              <Text style={styles.statLabel}>Tests Taken</Text>
           </View>
        </View>

        {/* FORM SECTION */}
        <View style={styles.formSection}>
           <Text style={styles.sectionTitle}>Personal Details</Text>
           
           <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View style={styles.inputContainer}>
                 <User size={18} color="#999" />
                 <TextInput style={styles.input} value={fullName} onChangeText={setFullName} />
              </View>
           </View>

           {/* Class Selector */}
           <View style={styles.inputGroup}>
              <Text style={styles.label}>Class Level (Promotion)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classScroll}>
                 {CLASSES.map((cls) => (
                    <TouchableOpacity 
                       key={cls} 
                       onPress={() => setClassLevel(cls)}
                       style={[styles.classChip, classLevel === cls && styles.classChipActive]}
                    >
                       <Text style={[styles.classText, classLevel === cls && {color: '#fff', fontWeight:'bold'}]}>{cls}</Text>
                    </TouchableOpacity>
                 ))}
              </ScrollView>
           </View>

           <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : (
                 <>
                   <Save size={20} color="#fff" />
                   <Text style={styles.saveText}>Update Profile</Text>
                 </>
              )}
           </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
           <LogOut size={20} color={COLORS.error} />
           <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },
  
  avatarSection: { alignItems: 'center', marginBottom: 30 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  avatarText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  nameText: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  emailText: { fontSize: 14, color: '#999' },

  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 30 },
  statCard: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#eee', elevation: 2 },
  statNum: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 5 },
  statLabel: { fontSize: 12, color: '#999' },

  formSection: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#666', marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, paddingHorizontal: 15, height: 50, borderWidth: 1, borderColor: '#eee', gap: 10 },
  input: { flex: 1, fontSize: 16, color: COLORS.textPrimary },
  
  classScroll: { flexDirection: 'row' },
  classChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F7FA', marginRight: 8, borderWidth: 1, borderColor: '#eee' },
  classChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  classText: { color: '#666' },

  saveBtn: { backgroundColor: COLORS.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginTop: 10, gap: 10 },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 10 },
  logoutText: { color: COLORS.error, fontWeight: 'bold', fontSize: 16 }
});