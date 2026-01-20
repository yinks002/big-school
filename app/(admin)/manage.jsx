import { router, useFocusEffect } from 'expo-router';
import { BookOpen, ChevronLeft, Edit, HelpCircle, Layers, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

export default function ManageContent() {
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Subjects when Class changes
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('subjects').select('id, name').eq('level', selectedClass);
      setSubjects(data || []);
      if (data && data.length > 0) setSelectedSubjectId(data[0].id);
      else setSelectedSubjectId(null);
    };
    fetchSubjects();
  }, [selectedClass]);

  // 2. Fetch Topics Function
  const fetchTopics = async () => {
    if (!selectedSubjectId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('*')
        .eq('subject_id', selectedSubjectId)
        .order('week_number', { ascending: true });
      
      if (error) throw error;
      setTopics(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // 3. Trigger Fetch on Subject Change
  useEffect(() => { fetchTopics(); }, [selectedSubjectId]);

  // 4. Refresh list whenever we come back to this screen (e.g. after editing)
  useFocusEffect(
    useCallback(() => {
      fetchTopics();
    }, [selectedSubjectId])
  );

  // 🗑️ INSTANT DELETE FUNCTION
  const handleDelete = (id, name) => {
    const performDelete = async () => {
      // 1. Optimistic Update: Remove from screen IMMEDIATELY
      setTopics(currentTopics => currentTopics.filter(t => t.id !== id));

      // 2. Delete from DB in background
      const { error } = await supabase.from('topics').delete().eq('id', id);
      
      if (error) {
          Alert.alert("Error", "Failed to delete from database");
          fetchTopics(); // Revert list if failed
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete "${name}"? This cannot be undone.`)) performDelete();
    } else {
      Alert.alert(
        "Delete Topic",
        `Are you sure you want to delete "${name}"? This cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: performDelete }
        ]
      );
    }
  };

  // ✏️ NAVIGATE TO EDIT
  const handleEdit = (topic) => {
    router.push({ 
      pathname: '/(admin)/edit', 
      params: { id: topic.id } 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Content</Text>
      </View>

      {/* FILTER SECTION */}
      <View style={styles.filterSection}>
        <View style={styles.row}>
            <Layers size={14} color="#666"/>
            <Text style={styles.label}>Class</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSelect}>
          {CLASSES.map((cls) => (
            <TouchableOpacity 
                key={cls} 
                onPress={() => setSelectedClass(cls)} 
                style={[styles.chip, selectedClass === cls && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedClass === cls && styles.chipTextActive]}>{cls}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.row}>
            <BookOpen size={14} color="#666"/>
            <Text style={styles.label}>Subject</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSelect}>
          {subjects.map((sub) => (
            <TouchableOpacity 
                key={sub.id} 
                onPress={() => setSelectedSubjectId(sub.id)} 
                style={[styles.chip, selectedSubjectId === sub.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedSubjectId === sub.id && styles.chipTextActive]}>{sub.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* TOPICS LIST */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? <ActivityIndicator color={COLORS.primary} /> : (
            topics.length === 0 ? (
            <Text style={styles.emptyText}>No topics found for this subject.</Text>
            ) : (
            topics.map((topic) => (
                <View key={topic.id} style={styles.card}>
                    <Image 
                        source={{ uri: topic.image_url || 'https://via.placeholder.com/100' }} 
                        style={styles.thumb} 
                        resizeMode="cover"
                    />
                    
                    <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.week}>Week {topic.week_number} • {topic.term}</Text>
                        <Text style={styles.title} numberOfLines={1}>{topic.name}</Text>
                    </View>

                    <View style={styles.actions}>
                        {/* 🧠 NEW: Question Manager Button */}
                        <TouchableOpacity 
                            onPress={() => router.push({ 
                                pathname: '/(admin)/manage-questions', 
                                params: { topicId: topic.id, topicName: topic.name } 
                            })} 
                            style={[styles.actionBtn, { backgroundColor: '#E3F2FD' }]}
                        >
                            <HelpCircle size={20} color={COLORS.secondary} />
                        </TouchableOpacity>

                        {/* Edit Button */}
                        <TouchableOpacity onPress={() => handleEdit(topic)} style={styles.actionBtn}>
                            <Edit size={20} color={COLORS.primary} />
                        </TouchableOpacity>
                        
                        {/* Delete Button */}
                        <TouchableOpacity onPress={() => handleDelete(topic.id, topic.name)} style={styles.actionBtn}>
                            <Trash2 size={20} color={COLORS.error} />
                        </TouchableOpacity>
                    </View>
                </View>
            ))
            )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },
  
  filterSection: { marginBottom: 20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 5 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#666' },
  scrollSelect: { flexDirection: 'row', marginBottom: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#eee' },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: '#666', fontSize: 12 },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  
  // List Card Styles
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 10, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  thumb: { width: 50, height: 50, borderRadius: 8, backgroundColor: '#eee' },
  week: { fontSize: 10, color: '#999', textTransform: 'uppercase', fontWeight: 'bold' },
  title: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { padding: 8, backgroundColor: '#F5F7FA', borderRadius: 8 },
  
  emptyText: { textAlign: 'center', color: '#999', marginTop: 20 }
});