import { router, useLocalSearchParams } from 'expo-router';
import { Clock } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

export default function TakeExam() {
  const { examId, duration } = useLocalSearchParams();
  const { session } = useAuth();
  
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({}); 
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Default to 30 mins if duration is missing
  const [timeLeft, setTimeLeft] = useState(parseInt(duration || 30) * 60);

  useEffect(() => {
    const fetchQ = async () => {
      const { data } = await supabase.from('exam_questions').select('*').eq('exam_id', examId);
      setQuestions(data || []);
      setLoading(false);
    };
    fetchQ();
  }, [examId]);

  // Timer Logic
  useEffect(() => {
    if (timeLeft <= 0) { handleSubmit(); return; }
    const timer = setInterval(() => { setTimeLeft(prev => prev - 1); }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleSelect = (qId, option) => {
    setAnswers(prev => ({ ...prev, [qId]: option }));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // 1. Calculate Score locally
      let score = 0;
      questions.forEach(q => {
         if (answers[q.id] === q.correct_option) score++;
      });
      const percentage = Math.round((score / questions.length) * 100) || 0;

      // 2. Save to Database
      const { error } = await supabase.from('exam_results').insert([{
         exam_id: examId,
         student_id: session.user.id,
         score: percentage
      }]);

      if (error) throw error;

      // 3. Navigation (Web Compatible Fix)
      if (Platform.OS === 'web') {
          // Web browsers don't wait for Alert callbacks well
          window.alert(`Exam Submitted!\nYou scored ${percentage}%`);
          router.replace('/(student)/home');
      } else {
          // Mobile works fine with Native Alert
          Alert.alert("Submitted", `You scored ${percentage}%`, [
             { text: "OK", onPress: () => router.replace('/(student)/home') }
          ]);
      }

    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to submit result.");
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator style={{marginTop:50}} color={COLORS.primary} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
         <Text style={styles.title}>Exam In Progress</Text>
         <View style={styles.timerBox}>
            <Clock size={16} color="red" />
            <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
         </View>
      </View>

      <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 100}}>
         {questions.map((q, i) => (
            <View key={q.id} style={styles.qCard}>
               <Text style={styles.qText}>{i+1}. {q.question_text}</Text>
               <View style={{gap: 10, marginTop: 10}}>
                  {['A','B','C','D'].map(opt => {
                     const text = opt === 'A' ? q.option_a : opt === 'B' ? q.option_b : opt === 'C' ? q.option_c : q.option_d;
                     const isSelected = answers[q.id] === opt;
                     return (
                        <TouchableOpacity key={opt} onPress={() => handleSelect(q.id, opt)} style={[styles.option, isSelected && styles.selected]}>
                           <Text style={[styles.optLabel, isSelected && {color:'#fff'}]}>{opt}</Text>
                           <Text style={[styles.optText, isSelected && {color:'#fff'}]}>{text}</Text>
                        </TouchableOpacity>
                     )
                  })}
               </View>
            </View>
         ))}
      </ScrollView>

      <View style={styles.footer}>
         <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> : <Text style={{color:'#fff', fontWeight:'bold', fontSize:18}}>Submit Exam</Text>}
         </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { padding: 20, backgroundColor: '#fff', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: '#eee' },
  title: { fontSize: 18, fontWeight: 'bold' },
  timerBox: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#FFEBEE', padding: 8, borderRadius: 8 },
  timerText: { color: 'red', fontWeight: 'bold' },
  qCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 20 },
  qText: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#eee', gap: 10 },
  selected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  optLabel: { fontWeight: 'bold', color: COLORS.primary },
  optText: { flex: 1 },
  footer: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  submitBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center' }
});