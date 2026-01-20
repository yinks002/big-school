import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { BookOpen, Calendar, CheckCircle, ChevronLeft, Clock, Cpu, FileText, HelpCircle, PlayCircle, Video } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

const TERM_ORDER = ['First Term', 'Second Term', 'Third Term'];

export default function SubjectContentScreen() {
  const { subject } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const { session } = useAuth();

  const [activeTab, setActiveTab] = useState('notes'); // 'notes', 'videos', 'quizzes', 'exams'
  const [groupedTopics, setGroupedTopics] = useState({});
  const [examList, setExamList] = useState([]); 
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      if (!session) return;
      setLoading(true);
      try {
        const { data: profile } = await supabase.from('profiles').select('class_level').eq('id', session.user.id).single();
        if (!profile?.class_level) throw new Error("Class not found");

        const { data: subjectData } = await supabase.from('subjects').select('id').eq('name', subject).eq('level', profile.class_level).single();
        if (!subjectData) { setLoading(false); return; }
        
        // 1. Fetch Topics
        const { data: topicsData } = await supabase
          .from('topics')
          .select('*, lessons(video_url)')
          .eq('subject_id', subjectData.id)
          .order('week_number', { ascending: true });

        const grouped = { 'First Term': [], 'Second Term': [], 'Third Term': [] };
        if (topicsData) {
          topicsData.forEach(topic => {
            if (grouped[topic.term]) {
              const hasVideo = topic.lessons && topic.lessons.length > 0 && topic.lessons[0].video_url;
              topic.video_url = hasVideo ? topic.lessons[0].video_url : null;
              grouped[topic.term].push(topic);
            }
          });
        }
        setGroupedTopics(grouped);

        // 2. Fetch Exams (CBT)
        const { data: examsData } = await supabase
          .from('exams')
          .select('*')
          .eq('subject_id', subjectData.id);
        
        setExamList(examsData || []);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [session, subject]);

  const handleBack = () => {
    if (navigation.canGoBack()) router.back();
    else router.replace('/(student)/home');
  };

  const handleTopicPress = (topic) => {
    if (activeTab === 'videos') {
      if (topic.video_url) {
        router.push({ pathname: '/(student)/video-player', params: { topicName: topic.name, videoUrl: topic.video_url } });
      } else {
        Alert.alert("Notice", "No video uploaded for this topic yet.");
      }
    } else if (activeTab === 'quizzes') {
        router.push({ pathname: '/(student)/quiz', params: { topicId: topic.id, topicName: topic.name } });
    } else {
      router.push({ pathname: '/(student)/lesson', params: { topicId: topic.id, topicName: topic.name, coverImage: topic.image_url } });
    }
  };

  // ✅ FIXED: Works on Web & Mobile
  const handleExamPress = (exam) => {
     const startExam = () => {
        router.push({ 
             pathname: '/(student)/take-exam', 
             params: { examId: exam.id, duration: exam.duration_minutes } 
        });
     };

     if (Platform.OS === 'web') {
         if (confirm(`Start Exam? You have ${exam.duration_minutes} minutes.`)) {
             startExam();
         }
     } else {
         Alert.alert("Start Exam?", `You have ${exam.duration_minutes} minutes.`, [
            { text: "Cancel", style: "cancel" },
            { text: "Start", onPress: startExam }
         ]);
     }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ChevronLeft size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{subject}</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
         <TouchableOpacity style={[styles.tab, activeTab === 'notes' && styles.activeTab]} onPress={() => setActiveTab('notes')}>
            <BookOpen size={16} color={activeTab === 'notes' ? '#fff' : COLORS.textSecondary} />
         </TouchableOpacity>

         <TouchableOpacity style={[styles.tab, activeTab === 'videos' && styles.activeTab]} onPress={() => setActiveTab('videos')}>
            <Video size={16} color={activeTab === 'videos' ? '#fff' : COLORS.textSecondary} />
         </TouchableOpacity>

         <TouchableOpacity style={[styles.tab, activeTab === 'quizzes' && styles.activeTab]} onPress={() => setActiveTab('quizzes')}>
            <HelpCircle size={16} color={activeTab === 'quizzes' ? '#fff' : COLORS.textSecondary} />
         </TouchableOpacity>

         {/* Exams Tab */}
         <TouchableOpacity style={[styles.tab, activeTab === 'exams' && styles.activeTab]} onPress={() => setActiveTab('exams')}>
            <Cpu size={16} color={activeTab === 'exams' ? '#fff' : COLORS.textSecondary} />
            <Text style={[styles.tabText, activeTab === 'exams' && styles.activeTabText]}> CBT</Text>
         </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* EXAM LIST VIEW */}
        {activeTab === 'exams' ? (
           <View style={{paddingHorizontal: 20}}>
              {examList.length === 0 ? (
                 <View style={styles.emptyState}>
                    <Cpu size={40} color="#ddd" />
                    <Text style={{color:'#999', marginTop:10}}>No Exams scheduled yet.</Text>
                 </View>
              ) : (
                 examList.map(exam => (
                    <TouchableOpacity key={exam.id} style={styles.examCard} onPress={() => handleExamPress(exam)}>
                       <View style={styles.examIcon}>
                          <Clock size={24} color="#fff" />
                       </View>
                       <View style={{flex:1}}>
                          <Text style={styles.examTitle}>{exam.title}</Text>
                          <Text style={styles.examSub}>{exam.duration_minutes} Minutes • Comprehensive</Text>
                       </View>
                       <View style={styles.startBtn}>
                          <Text style={styles.startText}>Start</Text>
                       </View>
                    </TouchableOpacity>
                 ))
              )}
           </View>
        ) : (
           /* TOPIC LIST VIEW */
           TERM_ORDER.map((term) => {
            let topics = groupedTopics[term] || [];
            if (activeTab === 'videos') topics = topics.filter(t => t.video_url);
            if (topics.length === 0) return null;

            return (
              <View key={term} style={styles.termSection}>
                <View style={styles.termHeader}>
                  <Calendar size={18} color={COLORS.primary} />
                  <Text style={styles.termTitle}>{term}</Text>
                </View>

                <View style={styles.cardsContainer}>
                  {topics.map((topic) => (
                    <TouchableOpacity 
                      key={topic.id}
                      style={styles.topicCard}
                      onPress={() => handleTopicPress(topic)}
                      activeOpacity={0.9}
                    >
                      <Image source={{ uri: topic.image_url || 'https://via.placeholder.com/300x200?text=No+Image' }} style={styles.cardImage} resizeMode="cover" />
                      <View style={styles.cardContent}>
                        <Text style={styles.weekBadge}>Week {topic.week_number}</Text>
                        <Text style={styles.topicTitle} numberOfLines={2}>{topic.name}</Text>
                        
                        <View style={[styles.playBtn, 
                            activeTab === 'videos' && { backgroundColor: '#000' },
                            activeTab === 'quizzes' && { backgroundColor: COLORS.secondary }
                        ]}>
                           {activeTab === 'videos' ? <PlayCircle size={14} color="#fff" /> : 
                            activeTab === 'quizzes' ? <CheckCircle size={14} color="#fff" /> : 
                            <FileText size={14} color="#fff" />}
                           <Text style={styles.playText}>
                              {activeTab === 'videos' ? 'Watch' : activeTab === 'quizzes' ? 'Quiz' : 'Read'}
                           </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10, paddingVertical: 10, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 15, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#eee' },
  activeTab: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { fontWeight: '600', color: COLORS.textSecondary, fontSize: 12 },
  activeTabText: { color: '#fff' },

  scrollContent: { paddingBottom: 40 },
  termSection: { marginBottom: 30, marginTop: 5 },
  termHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, marginBottom: 15 },
  termTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  cardsContainer: { paddingHorizontal: 20, gap: 20 },
  topicCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#eee', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 4 },
  cardImage: { width: '100%', height: 160 },
  cardContent: { padding: 16 },
  weekBadge: { fontSize: 12, color: COLORS.primary, fontWeight: 'bold', marginBottom: 4, textTransform: 'uppercase' },
  topicTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 12, lineHeight: 24 },
  playBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondary, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, alignSelf: 'flex-start', gap: 6 },
  playText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyState: { padding: 40, alignItems: 'center', marginTop: 50 },

  examCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 15, borderWidth: 1, borderColor: '#eee', shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  examIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  examTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  examSub: { fontSize: 12, color: '#999', marginTop: 4 },
  startBtn: { backgroundColor: '#E3F2FD', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  startText: { color: COLORS.secondary, fontWeight: 'bold', fontSize: 12 }
});