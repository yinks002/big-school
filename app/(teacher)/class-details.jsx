import { router, useLocalSearchParams } from 'expo-router';
import { BarChart2, BookOpen, ChevronLeft, Cpu, FileText, Plus, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

export default function ClassDetails() {
  const { classId, className, classCode } = useLocalSearchParams();
  const { session } = useAuth();
  
  const [activeTab, setActiveTab] = useState('students'); 
  const [students, setStudents] = useState([]);
  const [posts, setPosts] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [postModalVisible, setPostModalVisible] = useState(false);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [lessonModalVisible, setLessonModalVisible] = useState(false);
  
  // Form Data
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDuration, setQuizDuration] = useState('30');
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');

  useEffect(() => {
    fetchData();
  }, [classId, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
        if (activeTab === 'students') {
            // ✅ FIXED QUERY: Uses the exact Foreign Key name we just set in SQL
            const { data, error } = await supabase
                .from('classroom_students')
                .select(`
                    joined_at, 
                    student:profiles!classroom_students_student_id_fkey (id, full_name, email)
                `)
                .eq('classroom_id', classId);
            
            if (error) throw error;
            setStudents(data || []);
        } 
        else if (activeTab === 'feed') {
            const { data, error } = await supabase.from('class_posts').select('*').eq('classroom_id', classId).order('created_at', {ascending: false});
            if (error) throw error;
            setPosts(data || []);
        }
        else if (activeTab === 'lessons') {
            const { data, error } = await supabase.from('lessons').select('*').eq('classroom_id', classId).order('created_at', {ascending: false});
            if (error) throw error;
            setLessons(data || []);
        } 
        else if (activeTab === 'quizzes') {
            const { data, error } = await supabase.from('exams').select('*').eq('classroom_id', classId);
            if (error) throw error;
            setQuizzes(data || []);
        }
    } catch (e) {
        console.log("Fetch Error:", e.message);
    } finally {
        setLoading(false);
    }
  };

  const handleCreatePost = async () => {
      if (!postContent) return Alert.alert("Error", "Content is required");
      const { error } = await supabase.from('class_posts').insert([{
          classroom_id: classId,
          teacher_id: session.user.id,
          title: postTitle || 'Teacher Note',
          content: postContent
      }]);
      if (!error) { setPostModalVisible(false); setPostTitle(''); setPostContent(''); fetchData(); }
  };

  const handleCreateLesson = async () => {
      if (!lessonTitle || !lessonContent) return Alert.alert("Error", "Required fields missing");
      const { error } = await supabase.from('lessons').insert([{
          classroom_id: classId,
          title: lessonTitle,
          content: lessonContent,
          type: 'private_note'
      }]);
      if (!error) { setLessonModalVisible(false); setLessonTitle(''); setLessonContent(''); fetchData(); }
      else { Alert.alert("Error", error.message); }
  };

  const handleCreateQuiz = async () => {
      if (!quizTitle) return Alert.alert("Error", "Title required");
      const { data, error } = await supabase.from('exams').insert([{
          classroom_id: classId,
          title: quizTitle,
          duration_minutes: parseInt(quizDuration),
          is_published: true
      }]).select().single();

      if (!error) {
          setQuizModalVisible(false);
          setQuizTitle('');
          router.push({ pathname: '/(admin)/manage-exam-questions', params: { examId: data.id, examTitle: quizTitle } });
      }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>{className}</Text>
            <Text style={styles.subTitle}>Code: {classCode}</Text>
        </View>
      </View>

      <View style={styles.tabContainer}>
         <TouchableOpacity onPress={() => setActiveTab('students')} style={[styles.tab, activeTab === 'students' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'students' && styles.textActive]}>Students</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => setActiveTab('feed')} style={[styles.tab, activeTab === 'feed' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'feed' && styles.textActive]}>Feed</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => setActiveTab('lessons')} style={[styles.tab, activeTab === 'lessons' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'lessons' && styles.textActive]}>Lessons</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => setActiveTab('quizzes')} style={[styles.tab, activeTab === 'quizzes' && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === 'quizzes' && styles.textActive]}>Quizzes</Text>
         </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {loading ? <ActivityIndicator color={COLORS.primary} style={{marginTop: 50}} /> : (
           <>
             {activeTab === 'students' && (
                 students.length === 0 ? <Text style={styles.empty}>No students yet.</Text> : 
                 students.map((item, i) => (
                    <TouchableOpacity key={i} style={styles.card} onPress={() => router.push({ pathname: '/(teacher)/student-performance', params: { studentId: item.student?.id, studentName: item.student?.full_name } })}>
                        <View style={styles.avatar}><User size={20} color="#fff" /></View>
                        <View style={{flex:1, marginLeft: 15}}>
                            <Text style={styles.name}>{item.student?.full_name || 'Student'}</Text>
                            <Text style={styles.email}>{item.student?.email}</Text>
                        </View>
                        <BarChart2 size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                 ))
             )}

             {activeTab === 'feed' && (
                 posts.length === 0 ? <Text style={styles.empty}>No posts.</Text> :
                 posts.map(post => (
                    <View key={post.id} style={styles.postCard}>
                        <View style={{flexDirection:'row', alignItems:'center', gap:10, marginBottom:5}}>
                            <FileText size={16} color={COLORS.primary}/>
                            <Text style={styles.postTitle}>{post.title}</Text>
                        </View>
                        <Text style={styles.postContent}>{post.content}</Text>
                        <Text style={styles.date}>{new Date(post.created_at).toDateString()}</Text>
                    </View>
                 ))
             )}

             {activeTab === 'lessons' && (
                 lessons.length === 0 ? <Text style={styles.empty}>No private lessons.</Text> :
                 lessons.map(lesson => (
                    <TouchableOpacity key={lesson.id} style={styles.card} onPress={() => Alert.alert(lesson.title, lesson.content)}>
                        <BookOpen size={24} color={COLORS.secondary} />
                        <View style={{marginLeft: 15, flex:1}}>
                            <Text style={styles.name}>{lesson.title}</Text>
                            <Text style={styles.email}>Private Note</Text>
                        </View>
                    </TouchableOpacity>
                 ))
             )}

             {activeTab === 'quizzes' && (
                 quizzes.length === 0 ? <Text style={styles.empty}>No private quizzes.</Text> : 
                 quizzes.map(quiz => (
                    <View key={quiz.id} style={styles.card}>
                        <Cpu size={24} color={COLORS.secondary} />
                        <View style={{marginLeft: 15, flex:1}}>
                            <Text style={styles.name}>{quiz.title}</Text>
                            <Text style={styles.email}>{quiz.duration_minutes} Mins</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push({ pathname: '/(admin)/manage-exam-questions', params: { examId: quiz.id, examTitle: quiz.title } })}>
                            <Text style={{color:COLORS.primary, fontWeight:'bold'}}>Edit</Text>
                        </TouchableOpacity>
                    </View>
                 ))
             )}
           </>
        )}
      </ScrollView>

      {activeTab !== 'students' && (
          <TouchableOpacity 
            style={styles.fab} 
            onPress={() => {
                if (activeTab === 'feed') setPostModalVisible(true);
                if (activeTab === 'lessons') setLessonModalVisible(true);
                if (activeTab === 'quizzes') setQuizModalVisible(true);
            }}
          >
             <Plus color="#fff" size={24} />
          </TouchableOpacity>
      )}

      {/* MODALS */}
      <Modal visible={postModalVisible} transparent animationType="slide">
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>Class Announcement</Text>
               <TextInput style={styles.input} placeholder="Title" value={postTitle} onChangeText={setPostTitle} />
               <TextInput style={[styles.input, {height:100}]} placeholder="Message..." value={postContent} onChangeText={setPostContent} multiline />
               <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setPostModalVisible(false)}><Text>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleCreatePost}><Text style={{color:'#fff'}}>Post</Text></TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>

      <Modal visible={lessonModalVisible} transparent animationType="slide">
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>Private Class Lesson</Text>
               <TextInput style={styles.input} placeholder="Lesson Title" value={lessonTitle} onChangeText={setLessonTitle} />
               <TextInput style={[styles.input, {height:150}]} placeholder="Content..." value={lessonContent} onChangeText={setLessonContent} multiline />
               <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setLessonModalVisible(false)}><Text>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleCreateLesson}><Text style={{color:'#fff'}}>Publish</Text></TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>

      <Modal visible={quizModalVisible} transparent animationType="slide">
         <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
               <Text style={styles.modalTitle}>Create Class Quiz</Text>
               <TextInput style={styles.input} placeholder="Quiz Title" value={quizTitle} onChangeText={setQuizTitle} />
               <TextInput style={styles.input} placeholder="Duration (Mins)" value={quizDuration} onChangeText={setQuizDuration} keyboardType="numeric" />
               <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setQuizModalVisible(false)}><Text>Cancel</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleCreateQuiz}><Text style={{color:'#fff'}}>Create</Text></TouchableOpacity>
               </View>
            </View>
         </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  subTitle: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  
  tabContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#fff', borderRadius: 12, padding: 5 },
  tab: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { fontWeight: 'bold', color: '#666', fontSize: 12 },
  textActive: { color: '#fff' },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  email: { fontSize: 12, color: '#999' },
  
  postCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: COLORS.secondary },
  postTitle: { fontWeight: 'bold', fontSize: 16 },
  postContent: { color: '#333', marginVertical: 5 },
  date: { fontSize: 10, color: '#999', alignSelf: 'flex-end' },

  empty: { textAlign: 'center', marginTop: 50, color: '#999' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 5 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', padding: 20, borderRadius: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: '#F5F7FA', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 20 },
  saveBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }
});