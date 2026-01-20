import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function StudentPerformance() {
  const { studentId, studentName } = useLocalSearchParams();
  
  const [quizResults, setQuizResults] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      // 1. Fetch Lesson Quiz Results
      const { data: qRes } = await supabase
        .from('quiz_results')
        .select('*, topics(name, subjects(name))')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      // 2. Fetch CBT Exam Results
      const { data: eRes } = await supabase
        .from('exam_results')
        .select('*, exams(title, subjects(name))')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      setQuizResults(qRes || []);
      setExamResults(eRes || []);
      setLoading(false);
    };
    fetchResults();
  }, [studentId]);

  const getGradeColor = (score) => {
    if (score >= 70) return '#4CAF50'; // Green
    if (score >= 50) return '#FF9800'; // Orange
    return '#F44336'; // Red
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <View>
             <Text style={styles.headerTitle}>{studentName}</Text>
             <Text style={styles.subTitle}>Performance Report</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {loading ? <ActivityIndicator size="large" color={COLORS.primary} /> : (
           <>
             {/* 🏆 CBT EXAMS SECTION */}
             <Text style={styles.sectionTitle}>Exam Results</Text>
             {examResults.length === 0 ? <Text style={styles.empty}>No exams taken yet.</Text> : (
                examResults.map(res => (
                   <View key={res.id} style={styles.card}>
                      <View style={[styles.scoreBox, { backgroundColor: getGradeColor(res.score) }]}>
                         <Text style={styles.scoreText}>{res.score}%</Text>
                      </View>
                      <View style={{flex:1, marginLeft: 15}}>
                         <Text style={styles.subName}>{res.exams?.subjects?.name}</Text>
                         <Text style={styles.topicName}>{res.exams?.title}</Text>
                         <Text style={styles.date}>{new Date(res.created_at).toDateString()}</Text>
                      </View>
                   </View>
                ))
             )}

             {/* 📝 TOPIC QUIZZES SECTION */}
             <Text style={[styles.sectionTitle, {marginTop: 25}]}>Topic Quizzes</Text>
             {quizResults.length === 0 ? <Text style={styles.empty}>No quizzes taken yet.</Text> : (
                quizResults.map(res => (
                   <View key={res.id} style={styles.card}>
                      <View style={[styles.scoreBox, { backgroundColor: getGradeColor(res.score) }]}>
                         <Text style={styles.scoreText}>{res.score}%</Text>
                      </View>
                      <View style={{flex:1, marginLeft: 15}}>
                         <Text style={styles.subName}>{res.topics?.subjects?.name}</Text>
                         <Text style={styles.topicName}>{res.topics?.name}</Text>
                         <Text style={styles.date}>{new Date(res.created_at).toDateString()}</Text>
                      </View>
                   </View>
                ))
             )}
           </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderColor: '#eee' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  subTitle: { fontSize: 12, color: COLORS.primary },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#444' },
  empty: { color: '#999', fontStyle: 'italic', marginBottom: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  scoreBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  scoreText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  subName: { fontSize: 12, color: COLORS.primary, fontWeight: 'bold', textTransform: 'uppercase' },
  topicName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  date: { fontSize: 12, color: '#999', marginTop: 4 }
});