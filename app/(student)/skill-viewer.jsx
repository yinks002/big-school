import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, FileText, PlayCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function SkillViewer() {
  const { skillId, skillName } = useLocalSearchParams();
  const router = useRouter();
  const [lessons, setLessons] = useState([]);

  useEffect(() => {
    const fetchLessons = async () => {
      const { data } = await supabase.from('skill_lessons').select('*').eq('skill_id', skillId);
      setLessons(data || []);
    };
    fetchLessons();
  }, [skillId]);

  const handlePress = (lesson) => {
    if (lesson.video_url) {
        // Go to Video Player
        router.push({ 
            pathname: '/(student)/video-player', 
            params: { topicName: lesson.title, videoUrl: lesson.video_url } 
        });
    } else {
        // ✅ NEW: Go to Text Reader Page
        router.push({ 
            pathname: '/(student)/skill-lesson', 
            params: { lessonId: lesson.id, title: lesson.title } 
        });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{skillName}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
         {lessons.map((lesson, index) => (
            <TouchableOpacity key={lesson.id} style={styles.card} onPress={() => handlePress(lesson)}>
               <View style={styles.indexBox}><Text style={styles.index}>{index + 1}</Text></View>
               <View style={{flex:1}}>
                  <Text style={styles.title}>{lesson.title}</Text>
                  <Text style={styles.type}>{lesson.video_url ? "Video Lesson" : "Reading Material"}</Text>
               </View>
               {lesson.video_url ? <PlayCircle color={COLORS.secondary} size={24}/> : <FileText color={COLORS.primary} size={24}/>}
            </TouchableOpacity>
         ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 12, marginBottom: 10, gap: 15 },
  indexBox: { width: 30, height: 30, backgroundColor: '#eee', borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  index: { fontWeight: 'bold', color: '#666' },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  type: { fontSize: 12, color: '#999' }
});