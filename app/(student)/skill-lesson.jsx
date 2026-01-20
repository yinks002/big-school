import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function SkillLessonScreen() {
  const { lessonId, title } = useLocalSearchParams();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase
        .from('skill_lessons')
        .select('content')
        .eq('id', lessonId)
        .single();
      
      setContent(data?.content || 'No content available.');
      setLoading(false);
    };
    fetchContent();
  }, [lessonId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.iconBox}>
           <Zap size={40} color={COLORS.primary} />
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <View style={styles.divider} />
        <Text style={styles.body}>{content}</Text>

        <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
           <Text style={styles.btnText}>Mark as Done</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#f0f0f0' },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, flex: 1 },
  
  iconBox: { alignSelf: 'center', backgroundColor: '#FFF3E0', padding: 20, borderRadius: 50, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center' },
  divider: { height: 4, width: 40, backgroundColor: COLORS.primary, alignSelf: 'center', marginVertical: 15, borderRadius: 2 },
  body: { fontSize: 16, lineHeight: 26, color: '#333' },
  
  btn: { marginTop: 40, backgroundColor: COLORS.primary, padding: 16, borderRadius: 30, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});