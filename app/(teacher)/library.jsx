import { router, useFocusEffect } from 'expo-router';
import { BookOpen, Calculator, ChevronLeft, Cpu, FlaskConical, Globe, Landmark } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const ICON_MAP = {
  'Calculator': Calculator, 'BookOpen': BookOpen, 'FlaskConical': FlaskConical,
  'Landmark': Landmark, 'Globe': Globe, 'Cpu': Cpu,
};

const ALL_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

export default function TeacherLibrary() {
  const [subjects, setSubjects] = useState([]);
  const [activeClassTab, setActiveClassTab] = useState('JSS 1'); 
  const [loading, setLoading] = useState(true);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('subjects').select('*').eq('level', activeClassTab);
      setSubjects(data || []);
    } catch (e) { console.log(e); } 
    finally { setLoading(false); }
  };

  useFocusEffect(useCallback(() => { fetchSubjects(); }, [activeClassTab]));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{marginRight: 15}}>
            <ChevronLeft size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View>
            <Text style={styles.greeting}>Teacher's Library</Text>
            <Text style={styles.subText}>Browse curriculum content</Text>
        </View>
      </View>

      <View style={{ marginBottom: 15 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {ALL_CLASSES.map((cls) => (
            <TouchableOpacity key={cls} style={[styles.tab, activeClassTab === cls && styles.tabActive]} onPress={() => setActiveClassTab(cls)}>
              <Text style={[styles.tabText, activeClassTab === cls && styles.tabTextActive]}>{cls}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={styles.sectionTitle}>{activeClassTab} Subjects</Text>
          {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>
        
        {!loading && subjects.length === 0 ? (
           <View style={styles.emptyState}>
              <BookOpen size={40} color="#ddd" />
              <Text style={{color: '#999', marginTop: 10}}>No subjects found for {activeClassTab}.</Text>
           </View>
        ) : (
           <View style={styles.grid}>
             {subjects.map((subject) => {
               const IconComponent = ICON_MAP[subject.icon_name] || BookOpen;
               return (
                 <TouchableOpacity 
                   key={subject.id} 
                   style={[styles.subjectCard, { borderColor: subject.color }]}
                   onPress={() => router.push({ 
                       pathname: '/(teacher)/subject-view', 
                       params: { subject: subject.name, level: activeClassTab } 
                   })}
                 >
                   <View style={[styles.iconBox, { backgroundColor: subject.color }]}>
                     <IconComponent color="#fff" size={28} />
                   </View>
                   <Text style={styles.subjectName}>{subject.name}</Text>
                 </TouchableOpacity>
               );
             })}
           </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  greeting: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary },
  subText: { fontSize: 12, color: COLORS.textSecondary },
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, backgroundColor: '#F0F2F5', borderWidth: 1, borderColor: 'transparent' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  subjectCard: { width: '48%', backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.stroke },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  subjectName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  emptyState: { padding: 40, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#eee' }
});