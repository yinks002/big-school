import { router } from 'expo-router';
import { ChevronLeft, Plus, Video } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function SoftSkillsStudio() {
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'upload'
  const [loading, setLoading] = useState(false);

  // CREATE SKILL STATE
  const [skillTitle, setSkillTitle] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [skillColor, setSkillColor] = useState('#FF9800');

  // UPLOAD LESSON STATE
  const [skills, setSkills] = useState([]);
  const [selectedSkillId, setSelectedSkillId] = useState(null);
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonContent, setLessonContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // Fetch Skills on load
  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    const { data } = await supabase.from('skills').select('*');
    setSkills(data || []);
    if (data && data.length > 0) setSelectedSkillId(data[0].id);
  };

  const handleCreateSkill = async () => {
    if (!skillTitle) return Alert.alert("Error", "Enter a Skill Title");
    setLoading(true);
    const { error } = await supabase.from('skills').insert([{
        title: skillTitle,
        description: skillDesc,
        color: skillColor
    }]);
    setLoading(false);
    if (error) Alert.alert("Error", error.message);
    else {
        Alert.alert("Success", "Skill Created!");
        setSkillTitle(''); setSkillDesc(''); fetchSkills();
    }
  };

  const handleUploadLesson = async () => {
    if (!selectedSkillId || !lessonTitle) return Alert.alert("Error", "Select a skill and enter a title");
    setLoading(true);
    const { error } = await supabase.from('skill_lessons').insert([{
        skill_id: selectedSkillId,
        title: lessonTitle,
        content: lessonContent,
        video_url: videoUrl
    }]);
    setLoading(false);
    if (error) Alert.alert("Error", error.message);
    else {
        Alert.alert("Success", "Lesson Added!");
        setLessonTitle(''); setLessonContent(''); setVideoUrl('');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Soft Skills Studio</Text>
      </View>

      {/* TABS */}
      <View style={styles.tabContainer}>
         <TouchableOpacity onPress={() => setActiveTab('create')} style={[styles.tab, activeTab==='create' && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab==='create' && {color:'#fff'}]}>Create Skill</Text>
         </TouchableOpacity>
         <TouchableOpacity onPress={() => setActiveTab('upload')} style={[styles.tab, activeTab==='upload' && styles.activeTab]}>
            <Text style={[styles.tabText, activeTab==='upload' && {color:'#fff'}]}>Add Lesson</Text>
         </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 40}}>
         {activeTab === 'create' ? (
            <View style={styles.form}>
               <Text style={styles.label}>Skill Title</Text>
               <TextInput style={styles.input} placeholder="e.g. Python Programming" value={skillTitle} onChangeText={setSkillTitle} />
               
               <Text style={styles.label}>Description</Text>
               <TextInput style={styles.input} placeholder="Short description..." value={skillDesc} onChangeText={setSkillDesc} />
               
               <Text style={styles.label}>Color Hex</Text>
               <TextInput style={styles.input} placeholder="#FF9800" value={skillColor} onChangeText={setSkillColor} />
               
               <Button title="Create Skill" onPress={handleCreateSkill} isLoading={loading} icon={<Plus color="#fff" size={20}/>} />
            </View>
         ) : (
            <View style={styles.form}>
               <Text style={styles.label}>Select Skill</Text>
               <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom:15}}>
                  {skills.map(s => (
                     <TouchableOpacity key={s.id} onPress={() => setSelectedSkillId(s.id)} style={[styles.chip, selectedSkillId===s.id && styles.chipActive]}>
                        <Text style={[styles.chipText, selectedSkillId===s.id && {color:'#fff'}]}>{s.title}</Text>
                     </TouchableOpacity>
                  ))}
               </ScrollView>

               <Text style={styles.label}>Lesson Title</Text>
               <TextInput style={styles.input} placeholder="e.g. Intro to Variables" value={lessonTitle} onChangeText={setLessonTitle} />

               <Text style={styles.label}>Video URL (Optional)</Text>
               <TextInput style={styles.input} placeholder="YouTube Link..." value={videoUrl} onChangeText={setVideoUrl} />

               <Text style={styles.label}>Content / Note</Text>
               <TextInput style={[styles.input, {height:100}]} multiline placeholder="Lesson details..." value={lessonContent} onChangeText={setLessonContent} />

               <Button title="Upload Lesson" onPress={handleUploadLesson} isLoading={loading} icon={<Video color="#fff" size={20}/>} />
            </View>
         )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', marginBottom: 20, backgroundColor: '#fff', borderRadius: 10, padding: 5 },
  tab: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: COLORS.primary },
  tabText: { fontWeight: 'bold', color: '#666' },
  form: { backgroundColor: '#fff', padding: 20, borderRadius: 16 },
  label: { fontWeight: 'bold', marginBottom: 5, color: '#666' },
  input: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  chip: { paddingHorizontal: 15, paddingVertical: 8, backgroundColor: '#F0F2F5', borderRadius: 20, marginRight: 8 },
  chipActive: { backgroundColor: COLORS.secondary },
  chipText: { fontWeight: 'bold', color: '#666' }
});