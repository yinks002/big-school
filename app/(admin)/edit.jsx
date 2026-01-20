import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function EditTopicScreen() {
  const { id } = useLocalSearchParams(); // Topic ID
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form Data
  const [topicName, setTopicName] = useState('');
  const [week, setWeek] = useState('');
  const [content, setContent] = useState('');
  const [lessonId, setLessonId] = useState(null); // Keep track if a lesson exists

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Fetch Topic
        const { data: topic, error: topicError } = await supabase
          .from('topics')
          .select('*')
          .eq('id', id)
          .single();
          
        if (topicError) throw topicError;
        
        if (topic) {
          setTopicName(topic.name);
          setWeek(topic.week_number.toString());
        }

        // 2. Fetch Lesson (Using maybeSingle to prevent 406 Error)
        const { data: lesson } = await supabase
          .from('lessons')
          .select('*')
          .eq('topic_id', id)
          .maybeSingle(); // <--- ✅ FIX IS HERE
        
        if (lesson) {
          setContent(lesson.content || '');
          setLessonId(lesson.id);
        }
      } catch (e) {
        console.error(e);
        Alert.alert("Error", "Could not load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      // 1. Update Topic
      const { error: topicError } = await supabase
        .from('topics')
        .update({ name: topicName, week_number: parseInt(week) })
        .eq('id', id);

      if (topicError) throw topicError;

      // 2. Update OR Insert Lesson
      if (lessonId) {
        // Update existing lesson
        const { error: lessonError } = await supabase
          .from('lessons')
          .update({ content: content })
          .eq('id', lessonId);
        if (lessonError) throw lessonError;
      } else {
        // Create new lesson if one didn't exist (fixing broken data)
        const { error: newLessonError } = await supabase
          .from('lessons')
          .insert([{ topic_id: id, content: content, title: 'Lesson Note' }]);
        if (newLessonError) throw newLessonError;
      }

      Alert.alert("Success", "Changes saved successfully!");
      router.back(); 
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <View style={{flex:1, justifyContent:'center', alignItems:'center'}}>
      <ActivityIndicator size="large" color={COLORS.primary}/>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Lesson</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.label}>Topic Name</Text>
          <TextInput style={styles.input} value={topicName} onChangeText={setTopicName} />

          <Text style={styles.label}>Week Number</Text>
          <TextInput style={styles.input} value={week} onChangeText={setWeek} keyboardType="numeric" />

          <Text style={styles.label}>Lesson Content</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={content} 
            onChangeText={setContent} 
            multiline 
          />
        </View>

        <Button 
          title="Save Changes" 
          onPress={handleUpdate} 
          isLoading={saving} 
          icon={<Save color="#fff" size={18} />}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  card: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee', fontSize: 16 },
  textArea: { height: 150, textAlignVertical: 'top' },
});