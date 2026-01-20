import { router, useFocusEffect } from 'expo-router';
import { Activity, BookOpen, ChevronRight, LogOut, Plus, User, Zap } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

export default function ParentDashboard() {
  const { session } = useAuth();
  const [children, setChildren] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Get Children
      const { data: kidsData, error } = await supabase
        .from('parent_students')
        .select(`
           student:profiles!parent_students_student_id_fkey (id, full_name, email, class_level, current_streak)
        `)
        .eq('parent_id', session.user.id);

      if (error) throw error;
      
      const kids = kidsData.map(k => k.student).filter(Boolean);
      
      // 2. Fetch Extra Stats for each child (Quizzes taken)
      const kidsWithStats = await Promise.all(kids.map(async (kid) => {
          const { count } = await supabase.from('quiz_results').select('*', { count: 'exact', head: true }).eq('student_id', kid.id);
          return { ...kid, total_tests: count || 0 };
      }));

      setChildren(kidsWithStats);

      // 3. Get Recent Activity (Across all children)
      if (kids.length > 0) {
          const kidIds = kids.map(k => k.id);
          const { data: activity } = await supabase
            .from('quiz_results')
            .select('score, created_at, topics(name), profiles(full_name)')
            .in('student_id', kidIds)
            .order('created_at', { ascending: false })
            .limit(5); // Last 5 activities
          
          setRecentActivity(activity || []);
      }

    } catch (e) {
      console.log("Fetch Error:", e.message);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  const handleLogout = async () => {
    const performLogout = async () => {
      await supabase.auth.signOut();
      router.replace('/(auth)/welcome');
    };
    if (Platform.OS === 'web') { if (confirm("Sign out?")) performLogout(); }
    else { Alert.alert("Log Out", "Sign out?", [{ text: "Cancel" }, { text: "Log Out", onPress: performLogout }]); }
  };

  const getGradeColor = (score) => {
    if (score >= 70) return '#4CAF50'; 
    if (score >= 50) return '#FF9800'; 
    return '#F44336'; 
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
            <Text style={styles.headerTitle}>Parent Portal</Text>
            <Text style={styles.subText}>Overview</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
         
         {/* 1. CHILDREN CARDS (Detailed) */}
         <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Wards ({children.length})</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(parent)/add-child')}>
                <Plus size={16} color="#fff" />
                <Text style={styles.addText}>Add</Text>
            </TouchableOpacity>
         </View>

         {loading ? <ActivityIndicator color={COLORS.primary} /> : (
             children.length === 0 ? (
                 <View style={styles.emptyCard}>
                     <Text style={styles.emptyText}>No children linked yet.</Text>
                 </View>
             ) : (
                 children.map((child, i) => (
                    <TouchableOpacity 
                        key={i} 
                        style={styles.childCard}
                        onPress={() => router.push({ 
                            pathname: '/(teacher)/student-performance', 
                            params: { studentId: child.id, studentName: child.full_name } 
                        })}
                    >
                        <View style={styles.childHeader}>
                            <View style={styles.avatar}><User size={24} color="#fff" /></View>
                            <View style={{flex:1, marginLeft: 10}}>
                                <Text style={styles.name}>{child.full_name}</Text>
                                <Text style={styles.class}>{child.class_level || "No Class Assigned"}</Text>
                            </View>
                            <ChevronRight size={24} color="#ccc" />
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Streak</Text>
                                <View style={{flexDirection:'row', alignItems:'center', gap:4}}>
                                    <Text style={styles.statValue}>{child.current_streak || 0}</Text>
                                    <Text>🔥</Text>
                                </View>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Tests Taken</Text>
                                <Text style={styles.statValue}>{child.total_tests}</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Status</Text>
                                <Text style={[styles.statValue, {color: COLORS.primary}]}>Active</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                 ))
             )
         )}

         {/* 2. RECENT ACTIVITY FEED (New Section) */}
         {recentActivity.length > 0 && (
             <>
                <Text style={[styles.sectionTitle, {marginTop: 25, marginBottom: 10}]}>Recent Activity</Text>
                {recentActivity.map((item, index) => (
                    <View key={index} style={styles.activityCard}>
                        <Activity size={20} color={COLORS.textSecondary} />
                        <View style={{flex:1, marginLeft: 10}}>
                            <Text style={styles.actText}>
                                <Text style={{fontWeight:'bold'}}>{item.profiles?.full_name.split(' ')[0]}</Text> scored 
                                <Text style={{fontWeight:'bold', color: getGradeColor(item.score)}}> {item.score}% </Text> 
                                in {item.topics?.name}
                            </Text>
                            <Text style={styles.actDate}>{new Date(item.created_at).toDateString()}</Text>
                        </View>
                    </View>
                ))}
             </>
         )}

         {/* 3. PARENT RESOURCES */}
         <Text style={[styles.sectionTitle, {marginTop: 30}]}>Learning Resources</Text>
         <View style={styles.resourceGrid}>
            <TouchableOpacity style={styles.resCard} onPress={() => router.push('/(student)/skills')}>
                <View style={[styles.iconBox, {backgroundColor: '#FFF3E0'}]}><Zap size={24} color="orange" /></View>
                <View style={{flex:1}}>
                    <Text style={styles.resTitle}>Life Skills</Text>
                    <Text style={styles.resSub}>Leadership & Coding.</Text>
                </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resCard} onPress={() => router.push('/(teacher)/library')}>
                <View style={[styles.iconBox, {backgroundColor: '#E3F2FD'}]}><BookOpen size={24} color={COLORS.primary} /></View>
                <View style={{flex:1}}>
                    <Text style={styles.resTitle}>Syllabus</Text>
                    <Text style={styles.resSub}>View Academic Content.</Text>
                </View>
            </TouchableOpacity>
         </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  subText: { fontSize: 14, color: '#666' },
  logoutBtn: { padding: 10, backgroundColor: '#FFECEC', borderRadius: 12 },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 5 },
  addText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  childCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 15, shadowColor: "#000", shadowOffset: {width:0, height:2}, shadowOpacity:0.05, elevation: 2 },
  childHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  class: { fontSize: 14, color: '#666', marginTop: 4 },
  
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 15 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 12, color: '#999', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },

  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  actText: { fontSize: 14, color: '#333' },
  actDate: { fontSize: 12, color: '#999', marginTop: 4 },

  resourceGrid: { flexDirection: 'row', gap: 15 },
  resCard: { flex: 1, backgroundColor: '#fff', padding: 15, borderRadius: 16, alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#eee' },
  iconBox: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  resTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center' },
  resSub: { fontSize: 12, color: '#999', textAlign: 'center' },
  emptyCard: { padding: 20, backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#ccc' },
  emptyText: { color: '#999' },
});