import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Edit, HelpCircle, Plus, Trash2 } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function ManageQuestions() {
  const { topicId, topicName } = useLocalSearchParams();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: true });
    
    if (error) console.error(error);
    setQuestions(data || []);
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchQuestions();
    }, [topicId])
  );

  const handleDelete = (id) => {
    Alert.alert("Delete Question?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { 
        text: "Delete", 
        style: "destructive", 
        onPress: async () => {
          // Optimistic Update
          setQuestions(prev => prev.filter(q => q.id !== id));
          const { error } = await supabase.from('questions').delete().eq('id', id);
          if (error) {
             Alert.alert("Error", error.message);
             fetchQuestions(); // Revert
          }
        }
      }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{topicName}</Text>
        <View style={{width: 28}} />
      </View>

      <View style={styles.subHeader}>
        <Text style={styles.subTitle}>Quiz Questions ({questions.length})</Text>
        <TouchableOpacity 
          style={styles.addBtn}
          onPress={() => router.push({ pathname: '/(admin)/add-question', params: { topicId, topicName } })}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? <ActivityIndicator color={COLORS.primary} /> : (
          questions.length === 0 ? (
            <View style={styles.emptyState}>
              <HelpCircle size={40} color="#ddd" />
              <Text style={styles.emptyText}>No questions yet.</Text>
            </View>
          ) : (
            questions.map((q, index) => (
              <View key={q.id} style={styles.card}>
                <View style={styles.qHeader}>
                   <Text style={styles.qIndex}>Q{index + 1}</Text>
                   <Text style={styles.correctBadge}>Ans: {q.correct_option}</Text>
                </View>
                <Text style={styles.qText}>{q.question_text}</Text>
                
                <View style={styles.actions}>
                  <TouchableOpacity 
                    style={styles.actionBtn}
                    onPress={() => router.push({ pathname: '/(admin)/edit-question', params: { id: q.id } })}
                  >
                    <Edit size={18} color={COLORS.primary} />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(q.id)}>
                    <Trash2 size={18} color={COLORS.error} />
                    <Text style={[styles.actionText, {color: COLORS.error}]}>Delete</Text>
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, flex: 1, textAlign: 'center' },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  subTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.textSecondary },
  
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 5 },
  addBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },

  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  qHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  qIndex: { fontWeight: 'bold', color: COLORS.primary },
  correctBadge: { fontSize: 12, backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, color: 'green', fontWeight: 'bold' },
  qText: { fontSize: 16, color: COLORS.textPrimary, marginBottom: 12, lineHeight: 22 },
  
  actions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 10, justifyContent: 'flex-end', gap: 15 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 14, fontWeight: '600', color: COLORS.primary },
  
  emptyState: { alignItems: 'center', marginTop: 50 },
  emptyText: { color: '#999', marginTop: 10 }
});