import { useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, ChevronLeft, FileText } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const TERM_ORDER = ['First Term', 'Second Term', 'Third Term'];

export default function TeacherSubjectView() {
  const { subject, level } = useLocalSearchParams(); // Gets "Mathematics" and "JSS 1"
  const router = useRouter();
  const [groupedTopics, setGroupedTopics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        // 1. Get Subject ID
        const { data: subjectData } = await supabase
            .from('subjects')
            .select('id')
            .eq('name', subject)
            .eq('level', level)
            .single();
            
        if (!subjectData) { setLoading(false); return; }

        // 2. Get Topics
        const { data: topicsData } = await supabase
          .from('topics')
          .select('*, lessons(video_url)')
          .eq('subject_id', subjectData.id)
          .order('week_number', { ascending: true });

        // 3. Group by Term
        const grouped = { 'First Term': [], 'Second Term': [], 'Third Term': [] };
        if (topicsData) {
            topicsData.forEach(topic => {
                if (grouped[topic.term]) grouped[topic.term].push(topic);
            });
        }
        setGroupedTopics(grouped);
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
    };
    fetchContent();
  }, [subject, level]);

  const handleTopicPress = (topic) => {
    // Reuse student lesson viewer - teachers just need to read/watch content
    router.push({ 
      pathname: '/(student)/lesson', 
      params: { topicId: topic.id, topicName: topic.name, coverImage: topic.image_url } 
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{padding: 5}}>
          <ChevronLeft size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
            <Text style={styles.headerTitle}>{subject}</Text>
            <Text style={styles.subTitle}>{level}</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? <ActivityIndicator color={COLORS.primary} style={{marginTop: 50}} /> : (
            TERM_ORDER.map((term) => {
            const topics = groupedTopics[term] || [];
            if (topics.length === 0) return null;

            return (
                <View key={term} style={styles.termSection}>
                <View style={styles.termHeader}>
                    <Calendar size={18} color={COLORS.primary} />
                    <Text style={styles.termTitle}>{term}</Text>
                </View>

                <View style={styles.cardsContainer}>
                    {topics.map((topic) => (
                    <TouchableOpacity key={topic.id} style={styles.topicCard} onPress={() => handleTopicPress(topic)}>
                        <Image source={{ uri: topic.image_url || 'https://via.placeholder.com/300x200?text=No+Image' }} style={styles.cardImage} resizeMode="cover" />
                        <View style={styles.cardContent}>
                        <Text style={styles.weekBadge}>Week {topic.week_number}</Text>
                        <Text style={styles.topicTitle} numberOfLines={2}>{topic.name}</Text>
                        <View style={styles.playBtn}>
                            <FileText size={14} color="#fff" />
                            <Text style={styles.playText}>View Content</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 10, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  subTitle: { fontSize: 12, color: COLORS.primary, textAlign: 'center', fontWeight: 'bold' },
  scrollContent: { paddingBottom: 40 },
  termSection: { marginBottom: 30, marginTop: 15 },
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
});