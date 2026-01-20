import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Cpu, FileText } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function ClassroomView() {
  const { classId, className } = useLocalSearchParams();
  const [posts, setPosts] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // 1. Fetch Posts
      const { data: pData } = await supabase.from('class_posts').select('*').eq('classroom_id', classId).order('created_at', {ascending: false});
      // 2. Fetch Quizzes
      const { data: qData } = await supabase.from('exams').select('*').eq('classroom_id', classId);
      
      setPosts(pData || []);
      setQuizzes(qData || []);
      setLoading(false);
    };
    fetchData();
  }, [classId]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.title}>{className}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
         <Text style={styles.section}>Class Feed & Notes</Text>
         {loading ? <ActivityIndicator /> : posts.length === 0 ? <Text style={styles.empty}>No notes posted yet.</Text> : (
             posts.map(post => (
                <View key={post.id} style={styles.postCard}>
                    <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                        <FileText size={16} color={COLORS.primary} />
                        <Text style={styles.postTitle}>{post.title}</Text>
                    </View>
                    <Text style={styles.postContent}>{post.content}</Text>
                    <Text style={styles.date}>{new Date(post.created_at).toDateString()}</Text>
                </View>
             ))
         )}

         <Text style={[styles.section, {marginTop: 30}]}>Class Quizzes</Text>
         {quizzes.length === 0 ? <Text style={styles.empty}>No active quizzes.</Text> : (
             quizzes.map(quiz => (
                <TouchableOpacity 
                    key={quiz.id} 
                    style={styles.quizCard}
                    onPress={() => router.push({ pathname: '/(student)/take-exam', params: { examId: quiz.id, duration: quiz.duration_minutes } })}
                >
                    <Cpu size={24} color="#fff" />
                    <View style={{marginLeft: 15}}>
                        <Text style={{color:'#fff', fontWeight:'bold', fontSize:16}}>{quiz.title}</Text>
                        <Text style={{color:'#eee', fontSize:12}}>{quiz.duration_minutes} Mins</Text>
                    </View>
                </TouchableOpacity>
             ))
         )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 10, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold' },
  section: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: COLORS.textPrimary },
  empty: { color: '#999', fontStyle: 'italic' },
  
  postCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  postTitle: { fontWeight: 'bold', fontSize: 16 },
  postContent: { color: '#333', marginTop: 5, lineHeight: 20 },
  date: { fontSize: 10, color: '#999', alignSelf: 'flex-end', marginTop: 10 },

  quizCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondary, padding: 15, borderRadius: 12, marginBottom: 10 },
});