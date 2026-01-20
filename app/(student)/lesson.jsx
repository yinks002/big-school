import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { ArrowRight, ChevronLeft, FileText } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function LessonScreen() {
  const { topicId, topicName, coverImage } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('lessons')
          .select('*')
          .eq('topic_id', topicId)
          .single();

        if (error) throw error;
        setLesson(data);
      } catch (e) {
        console.log("No lesson found:", e);
      } finally {
        setLoading(false);
      }
    };
    if (topicId) fetchLesson();
  }, [topicId]);

  const handleBack = () => {
    if (navigation.canGoBack()) router.back();
    else router.replace('/(student)/home');
  };

  const handleGoToQuiz = () => {
    router.push({ 
        pathname: '/(student)/quiz', 
        params: { topicId: topicId, topicName: topicName } 
    });
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{topicName}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {coverImage && <Image source={{ uri: coverImage }} style={styles.coverImage} resizeMode="cover" />}

        <View style={styles.metaSection}>
           <Text style={styles.mainTitle}>{topicName}</Text>
           <View style={styles.badgeRow}>
              <View style={styles.badge}>
                 <FileText size={14} color={COLORS.textSecondary} />
                 <Text style={styles.badgeText}>Read Mode</Text>
              </View>
           </View>
        </View>

        {!lesson ? (
          <View style={styles.emptyState}><Text style={{color: '#999'}}>Loading content...</Text></View>
        ) : (
          <View style={styles.contentContainer}>
             {/* Diagram */}
             {lesson.image_url && (
                <View style={styles.diagramBox}>
                   <Image source={{ uri: lesson.image_url }} style={styles.diagramImage} resizeMode="contain" />
                </View>
             )}
             
             {/* Text Content */}
             <Text style={styles.bodyText}>{lesson.content || "No text content available."}</Text>

             <View style={styles.divider} />

             {/* 🏁 OPTIONAL QUIZ SECTION */}
             <View style={styles.quizCta}>
                <View>
                    <Text style={styles.quizTitle}>Ready to test yourself?</Text>
                    <Text style={styles.quizSub}>Take a quick quiz on this topic.</Text>
                </View>
                <TouchableOpacity style={styles.quizBtn} onPress={handleGoToQuiz}>
                    <Text style={styles.quizBtnText}>Take Quiz</Text>
                    <ArrowRight size={16} color="#fff" />
                </TouchableOpacity>
             </View>

             <TouchableOpacity style={styles.completeBtn} onPress={handleBack}>
                <Text style={styles.btnText}>Mark as Complete</Text>
             </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#fff' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, flex: 1 },
  scrollContent: { paddingBottom: 40 },
  coverImage: { width: '100%', height: 200 },
  metaSection: { padding: 20, backgroundColor: '#fff', marginBottom: 10 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 10 },
  badgeRow: { flexDirection: 'row', gap: 15 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  badgeText: { color: COLORS.textSecondary, fontSize: 14 },
  contentContainer: { padding: 20, backgroundColor: '#fff' },
  bodyText: { fontSize: 16, lineHeight: 28, color: '#333' },
  diagramBox: { marginBottom: 20, alignItems: 'center', backgroundColor: '#F9FAFB', padding: 10, borderRadius: 10 },
  diagramImage: { width: '100%', height: 250 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 30 },
  
  // Quiz CTA
  quizCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F0F9FF', padding: 15, borderRadius: 16, borderLeftWidth: 4, borderLeftColor: COLORS.secondary },
  quizTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  quizSub: { fontSize: 12, color: COLORS.textSecondary },
  quizBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondary, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 20, gap: 5 },
  quizBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  completeBtn: { marginTop: 30, backgroundColor: '#F0F2F5', padding: 16, borderRadius: 30, alignItems: 'center' },
  btnText: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
  emptyState: { padding: 40, alignItems: 'center' }
});