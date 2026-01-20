import { router, useFocusEffect } from 'expo-router';
import { ArrowRight, BookOpen, Copy, LogOut, Plus, Trash2, Users, Zap } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Clipboard, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

export default function TeacherDashboard() {
  const { session } = useAuth();
  const [activeTab, setActiveTab] = useState('classes'); 
  const [classrooms, setClassrooms] = useState([]);
  const [stats, setStats] = useState({ students: 0, classes: 0 });
  const [loading, setLoading] = useState(true);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [newClassName, setNewClassName] = useState('');

  const fetchClassrooms = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('classrooms')
        .select('*, classroom_students(count)')
        .eq('teacher_id', session.user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const classes = data || [];
      setClassrooms(classes);
      
      // Calculate Total Students
      const totalStudents = classes.reduce((sum, cls) => sum + (cls.classroom_students[0]?.count || 0), 0);
      setStats({ students: totalStudents, classes: classes.length });

    } catch (e) { console.log(e); } finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchClassrooms(); }, []));

  const handleCreateClass = async () => {
    if (!newClassName) return Alert.alert("Error", "Enter class name");
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase.from('classrooms').insert([{ teacher_id: session.user.id, name: newClassName, code: code }]);
    if (!error) { setModalVisible(false); setNewClassName(''); fetchClassrooms(); Alert.alert("Success", `Code: ${code}`); }
  };

  const copyCode = (code) => { Clipboard.setString(code); Alert.alert("Copied", code); };
  const handleDelete = (id) => {
      const del = async () => { await supabase.from('classrooms').delete().eq('id', id); fetchClassrooms(); };
      if (Platform.OS === 'web') { if(confirm("Delete?")) del(); } else { Alert.alert("Delete?", "Sure?", [{text:"Cancel"},{text:"Delete", onPress:del}]); }
  };
  const handleLogout = async () => { await supabase.auth.signOut(); router.replace('/(auth)/welcome'); };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View><Text style={styles.headerTitle}>Teacher Portal</Text><Text style={styles.subText}>Welcome back</Text></View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><LogOut size={20} color={COLORS.error} /></TouchableOpacity>
      </View>

      {/* 📊 OVERVIEW STATS */}
      <View style={styles.statsContainer}>
         <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.classes}</Text>
            <Text style={styles.statLabel}>Active Classes</Text>
         </View>
         <View style={styles.vertLine} />
         <View style={styles.statBox}>
            <Text style={styles.statNum}>{stats.students}</Text>
            <Text style={styles.statLabel}>Total Students</Text>
         </View>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
         <TouchableOpacity style={[styles.tab, activeTab === 'classes' && styles.tabActive]} onPress={() => setActiveTab('classes')}>
            <Users size={18} color={activeTab === 'classes' ? '#fff' : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'classes' && styles.tabTextActive]}>My Classes</Text>
         </TouchableOpacity>
         <TouchableOpacity style={[styles.tab, activeTab === 'resources' && styles.tabActive]} onPress={() => setActiveTab('resources')}>
            <BookOpen size={18} color={activeTab === 'resources' ? '#fff' : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'resources' && styles.tabTextActive]}>Resources</Text>
         </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
         {activeTab === 'classes' ? (
            <>
                <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
                    <Plus color="#fff" size={20} /><Text style={styles.createBtnText}>Create Virtual Classroom</Text>
                </TouchableOpacity>

                {loading ? <ActivityIndicator color={COLORS.primary} /> : (
                    classrooms.length === 0 ? (
                        <View style={styles.emptyState}><Users size={40} color="#ddd" /><Text style={styles.emptyText}>No classes yet.</Text></View>
                    ) : (
                        classrooms.map(item => (
                            <TouchableOpacity key={item.id} style={styles.card} onPress={() => router.push({ pathname: '/(teacher)/class-details', params: { classId: item.id, className: item.name, classCode: item.code } })}>
                                <View style={{flex:1}}>
                                    <Text style={styles.className}>{item.name}</Text>
                                    <Text style={styles.studentCount}>{item.classroom_students?.[0]?.count || 0} Students Joined</Text>
                                </View>
                                <TouchableOpacity style={styles.codeBadge} onPress={() => copyCode(item.code)}><Text style={styles.codeText}>{item.code}</Text><Copy size={12} color={COLORS.primary} /></TouchableOpacity>
                                <TouchableOpacity style={{padding: 10}} onPress={() => handleDelete(item.id)}><Trash2 size={18} color={COLORS.error} /></TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    )
                )}
            </>
         ) : (
            <View style={styles.resourceGrid}>
                <TouchableOpacity style={styles.resourceCard} onPress={() => router.push('/(teacher)/library')}>
                    <View style={[styles.iconBox, {backgroundColor: '#E3F2FD'}]}><BookOpen size={24} color={COLORS.primary} /></View>
                    <View style={{flex:1}}><Text style={styles.resTitle}>Curriculum Library</Text><Text style={styles.resSub}>Browse notes & videos.</Text></View>
                    <ArrowRight size={20} color="#ccc" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.resourceCard} onPress={() => router.push('/(student)/skills')}>
                    <View style={[styles.iconBox, {backgroundColor: '#FFF3E0'}]}><Zap size={24} color="orange" /></View>
                    <View style={{flex:1}}><Text style={styles.resTitle}>Soft Skills Hub</Text><Text style={styles.resSub}>Life & Career lessons.</Text></View>
                    <ArrowRight size={20} color="#ccc" />
                </TouchableOpacity>
            </View>
         )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>New Classroom</Text>
               <TextInput style={styles.input} placeholder="e.g. JSS 1 Gold" value={newClassName} onChangeText={setNewClassName} />
               <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{color:'#666'}}>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleCreateClass}><Text style={{color:'#fff'}}>Create</Text></TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },
  subText: { fontSize: 12, color: '#666' },
  logoutBtn: { padding: 10, backgroundColor: '#FFECEC', borderRadius: 12 },
  
  statsContainer: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20, justifyContent: 'space-around', alignItems: 'center', elevation: 2 },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  statLabel: { fontSize: 12, color: '#999' },
  vertLine: { width: 1, height: 30, backgroundColor: '#eee' },

  tabContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#fff', borderRadius: 12, padding: 5 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 8 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontWeight: '600', color: COLORS.textSecondary },
  tabTextActive: { color: '#fff' },

  createBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 10 },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  className: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  studentCount: { fontSize: 12, color: '#999', marginTop: 4 },
  codeBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, gap: 5, marginRight: 10 },
  codeText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  
  resourceGrid: { gap: 15 },
  resourceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 16, gap: 15, borderWidth: 1, borderColor: '#eee' },
  iconBox: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  resTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  resSub: { fontSize: 12, color: '#999', marginTop: 2 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', marginTop: 10 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: '#F5F7FA', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20 },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }
});