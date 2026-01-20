import { router } from 'expo-router';
import { ChevronLeft, Clock, FileText, Plus, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

export default function CBTPortal() {
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [exams, setExams] = useState([]);
  
  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('30');

  // Fetch Subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('subjects').select('id, name').eq('level', selectedClass);
      setSubjects(data || []);
      if (data?.[0]) setSelectedSubjectId(data[0].id);
    };
    fetchSubjects();
  }, [selectedClass]);

  // Fetch Exams
  const fetchExams = async () => {
    if (!selectedSubjectId) return;
    const { data } = await supabase.from('exams').select('*').eq('subject_id', selectedSubjectId);
    setExams(data || []);
  };

  useEffect(() => { fetchExams(); }, [selectedSubjectId]);

  const handleCreateExam = async () => {
    if (!newTitle) return Alert.alert("Error", "Enter a title");
    
    const { error } = await supabase.from('exams').insert([{
      subject_id: selectedSubjectId,
      title: newTitle,
      duration_minutes: parseInt(newDuration)
    }]);

    if (!error) {
      setModalVisible(false);
      setNewTitle('');
      fetchExams();
    } else {
      Alert.alert("Error", error.message);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert("Delete Exam?", "This removes all questions inside it.", [
       { text: "Cancel" },
       { text: "Delete", style: "destructive", onPress: async () => {
           await supabase.from('exams').delete().eq('id', id);
           fetchExams();
       }}
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>CBT Administration</Text>
      </View>

      {/* Class & Subject Filter */}
      <View style={{marginBottom: 20}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
          {CLASSES.map(cls => (
            <TouchableOpacity key={cls} onPress={() => setSelectedClass(cls)} style={[styles.chip, selectedClass===cls && styles.chipActive]}>
              <Text style={[styles.chipText, selectedClass===cls && styles.textActive]}>{cls}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
          {subjects.map(sub => (
            <TouchableOpacity key={sub.id} onPress={() => setSelectedSubjectId(sub.id)} style={[styles.chip, selectedSubjectId===sub.id && styles.chipActive]}>
              <Text style={[styles.chipText, selectedSubjectId===sub.id && styles.textActive]}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
        <Plus color="#fff" size={20} />
        <Text style={styles.createBtnText}>Create New Exam</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={{paddingBottom:40}}>
         {exams.map(exam => (
           <View key={exam.id} style={styles.card}>
             <View style={{flex:1}}>
                <Text style={styles.examTitle}>{exam.title}</Text>
                <View style={styles.metaRow}>
                   <Clock size={14} color="#666" />
                   <Text style={styles.metaText}>{exam.duration_minutes} Mins</Text>
                </View>
             </View>
             <View style={styles.actions}>
                <TouchableOpacity 
                  style={styles.actionBtn} 
                  onPress={() => router.push({ 
                     pathname: '/(admin)/manage-exam-questions', 
                     params: { examId: exam.id, examTitle: exam.title } 
                  })}
                >
                   <FileText size={18} color={COLORS.primary} />
                   <Text style={{fontSize:10, color: COLORS.primary}}>Questions</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(exam.id)}>
                   <Trash2 size={18} color={COLORS.error} />
                   <Text style={{fontSize:10, color: COLORS.error}}>Delete</Text>
                </TouchableOpacity>
             </View>
           </View>
         ))}
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
           <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>New Exam</Text>
              <TextInput style={styles.input} placeholder="Exam Title (e.g. Mid-Term)" value={newTitle} onChangeText={setNewTitle} />
              <TextInput style={styles.input} placeholder="Duration (Minutes)" value={newDuration} onChangeText={setNewDuration} keyboardType="numeric" />
              <View style={styles.modalActions}>
                 <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={styles.cancelText}>Cancel</Text></TouchableOpacity>
                 <TouchableOpacity style={styles.saveBtn} onPress={handleCreateExam}><Text style={styles.saveText}>Create</Text></TouchableOpacity>
              </View>
           </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  scroll: { flexDirection: 'row', marginBottom: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#eee' },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { color: '#666' },
  textActive: { color: '#fff', fontWeight: 'bold' },
  createBtn: { flexDirection: 'row', backgroundColor: COLORS.secondary, padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 20, gap: 10 },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  examTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: '#666', fontSize: 12 },
  actions: { flexDirection: 'row', gap: 15 },
  actionBtn: { alignItems: 'center', gap: 2 },
  // Modal
  modalOverlay: { flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', padding: 20 },
  modalContent: { backgroundColor:'#fff', padding: 20, borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: '#F5F7FA', padding: 12, borderRadius: 8, marginBottom: 10 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20, marginTop: 10 },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveText: { color: '#fff', fontWeight: 'bold' },
  cancelText: { color: '#666' }
});