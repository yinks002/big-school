import { router } from 'expo-router';
import { ArrowRight, ChevronLeft, Plus, Users } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

export default function MyClassrooms() {
  const { session } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyClasses = async () => {
      // Fetch classrooms where this student is a member
      const { data, error } = await supabase
        .from('classroom_students')
        .select(`
           classrooms ( id, name, teacher_id, teacher:profiles!classrooms_teacher_id_fkey(full_name) )
        `)
        .eq('student_id', session.user.id);

      if (error) console.log(error);
      setClassrooms(data || []);
      setLoading(false);
    };
    fetchMyClasses();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.title}>My Classrooms</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        {loading ? <ActivityIndicator color={COLORS.primary} /> : (
           classrooms.length === 0 ? (
              <View style={styles.empty}>
                 <Text>You haven't joined any virtual classrooms.</Text>
                 <TouchableOpacity style={styles.joinBtn} onPress={() => router.push('/(student)/join-class')}>
                    <Text style={{color:'#fff', fontWeight:'bold'}}>Join Class</Text>
                 </TouchableOpacity>
              </View>
           ) : (
              classrooms.map((item, i) => (
                 <TouchableOpacity 
                    key={i} 
                    style={styles.card}
                    onPress={() => router.push({ 
                        pathname: '/(student)/classroom-view', 
                        params: { classId: item.classrooms.id, className: item.classrooms.name } 
                    })}
                 >
                    <View style={styles.iconBox}><Users size={24} color={COLORS.primary} /></View>
                    <View style={{flex:1}}>
                       <Text style={styles.name}>{item.classrooms.name}</Text>
                       {/* Note: Teacher name fetching depends on your exact FK setup, fallback handled */}
                       <Text style={styles.teacher}>View Teacher's Posts & Quizzes</Text>
                    </View>
                    <ArrowRight size={20} color="#ccc" />
                 </TouchableOpacity>
              ))
           )
        )}
      </ScrollView>
      
      {/* Floating Join Button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(student)/join-class')}>
         <Plus color="#fff" size={24} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 10, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: 'bold' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 15, gap: 15 },
  iconBox: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  teacher: { fontSize: 12, color: '#999' },
  empty: { alignItems: 'center', marginTop: 50 },
  joinBtn: { marginTop: 20, backgroundColor: COLORS.primary, padding: 15, borderRadius: 10 },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', elevation: 5 }
});