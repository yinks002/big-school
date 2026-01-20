import { router } from 'expo-router';
import { ArrowRight, ChevronLeft, Zap } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function SkillsHub() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      const { data } = await supabase.from('skills').select('*').order('created_at', {ascending: false});
      setSkills(data || []);
      setLoading(false);
    };
    fetchSkills();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Soft Skills Hub 🚀</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? <ActivityIndicator color={COLORS.primary} style={{marginTop: 50}} /> : (
           skills.length === 0 ? <Text style={styles.empty}>No skills added yet.</Text> : (
             skills.map((skill) => (
               <TouchableOpacity 
                 key={skill.id} 
                 style={[styles.card, { borderLeftColor: skill.color }]}
                 onPress={() => router.push({ pathname: '/(student)/skill-viewer', params: { skillId: skill.id, skillName: skill.title } })}
               >
                 <View style={[styles.iconBox, { backgroundColor: skill.color + '20' }]}>
                    <Zap size={24} color={skill.color} />
                 </View>
                 <View style={{flex:1}}>
                    <Text style={styles.title}>{skill.title}</Text>
                    <Text style={styles.desc} numberOfLines={2}>{skill.description || 'Learn this skill to upgrade your career.'}</Text>
                 </View>
                 <ArrowRight size={20} color="#ccc" />
               </TouchableOpacity>
             ))
           )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 15, borderLeftWidth: 5, gap: 15, elevation: 2 },
  iconBox: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  desc: { fontSize: 12, color: '#999', marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 50, color: '#999' }
});