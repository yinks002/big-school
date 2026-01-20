import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function ManageExamQuestions() {
  const { examId, examTitle } = useLocalSearchParams();
  const [questions, setQuestions] = useState([]);
  
  // New Question Form
  const [qText, setQText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correct, setCorrect] = useState('A');
  const [loading, setLoading] = useState(false);

  const fetchQuestions = async () => {
    const { data } = await supabase.from('exam_questions').select('*').eq('exam_id', examId);
    setQuestions(data || []);
  };

  useEffect(() => { fetchQuestions(); }, [examId]);

  const handleAddQuestion = async () => {
    if (!qText || !optA || !optB) return Alert.alert("Missing Data");
    setLoading(true);
    
    const { error } = await supabase.from('exam_questions').insert([{
      exam_id: examId,
      question_text: qText,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_option: correct
    }]);

    setLoading(false);
    if (error) Alert.alert("Error", error.message);
    else {
      // Clear form
      setQText(''); setOptA(''); setOptB(''); setOptC(''); setOptD('');
      fetchQuestions();
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('exam_questions').delete().eq('id', id);
    fetchQuestions();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{examTitle} Questions</Text>
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 40}}>
        {/* ADD FORM */}
        <View style={styles.formCard}>
           <Text style={styles.sectionTitle}>Add New Question</Text>
           <TextInput style={styles.input} placeholder="Question Text" value={qText} onChangeText={setQText} multiline />
           <View style={{flexDirection:'row', gap:5}}>
             <TextInput style={[styles.input, {flex:1}]} placeholder="Option A" value={optA} onChangeText={setOptA} />
             <TextInput style={[styles.input, {flex:1}]} placeholder="Option B" value={optB} onChangeText={setOptB} />
           </View>
           <View style={{flexDirection:'row', gap:5}}>
             <TextInput style={[styles.input, {flex:1}]} placeholder="Option C" value={optC} onChangeText={setOptC} />
             <TextInput style={[styles.input, {flex:1}]} placeholder="Option D" value={optD} onChangeText={setOptD} />
           </View>
           
           <View style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop: 10}}>
             <Text style={{fontWeight:'bold'}}>Correct Answer:</Text>
             <View style={{flexDirection:'row', gap: 10}}>
                {['A','B','C','D'].map(opt => (
                   <TouchableOpacity key={opt} onPress={() => setCorrect(opt)} style={[styles.optBadge, correct===opt && styles.optActive]}>
                     <Text style={[styles.optText, correct===opt && {color:'#fff'}]}>{opt}</Text>
                   </TouchableOpacity>
                ))}
             </View>
           </View>

           <TouchableOpacity style={styles.addBtn} onPress={handleAddQuestion} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={{color:'#fff', fontWeight:'bold'}}>Add Question</Text>}
           </TouchableOpacity>
        </View>

        {/* LIST */}
        <Text style={[styles.sectionTitle, {marginTop: 20, marginBottom: 10}]}>Existing Questions ({questions.length})</Text>
        {questions.map((q, i) => (
           <View key={q.id} style={styles.qCard}>
              <View style={{flex:1}}>
                <Text style={{fontWeight:'bold'}}>Q{i+1}: {q.question_text}</Text>
                <Text style={{fontSize:12, color:'#666', marginTop: 5}}>Ans: {q.correct_option}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(q.id)}><Trash2 color="red" size={20} /></TouchableOpacity>
           </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  formCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12 },
  sectionTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 10 },
  input: { backgroundColor: '#F5F7FA', padding: 10, borderRadius: 8, marginBottom: 8 },
  optBadge: { width:30, height:30, borderRadius:15, backgroundColor:'#eee', alignItems:'center', justifyContent:'center'},
  optActive: { backgroundColor: COLORS.primary },
  optText: { fontWeight:'bold' },
  addBtn: { backgroundColor: COLORS.secondary, padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 15 },
  qCard: { backgroundColor:'#fff', padding: 15, borderRadius: 10, marginBottom: 10, flexDirection:'row', alignItems:'center' }
});