import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import {
  BookOpen,
  ChevronLeft,
  FileText,
  Image as ImageIcon,
  Layers,
  Plus,
  UploadCloud,
  X,
  Youtube
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

const TERMS = ['First Term', 'Second Term', 'Third Term'];
const CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

export default function AdminUpload() {
  const [loading, setLoading] = useState(false);
  
  // Selection
  const [selectedClass, setSelectedClass] = useState(CLASSES[0]);
  const [subjects, setSubjects] = useState([]); 
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  
  // Content
  const [term, setTerm] = useState(TERMS[0]);
  const [topicName, setTopicName] = useState('');
  const [week, setWeek] = useState('1');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState(''); 
  
  // Images
  const [coverImage, setCoverImage] = useState(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data } = await supabase.from('subjects').select('id, name').eq('level', selectedClass);
      setSubjects(data || []);
      if (data && data.length > 0) setSelectedSubjectId(data[0].id);
      else setSelectedSubjectId(null);
    };
    fetchSubjects();
  }, [selectedClass]);

  const pickImage = async (setImageFunction) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6,
      base64: true, 
    });

    if (!result.canceled) {
      setImageFunction(result.assets[0]);
    }
  };

  const uploadImageToSupabase = async (imageAsset) => {
    if (!imageAsset) return null;
    const fileName = `cover_${Date.now()}.jpg`;
    
    const { error } = await supabase.storage
      .from('lesson_images')
      .upload(fileName, decode(imageAsset.base64), { contentType: 'image/jpeg' });

    if (error) throw error;

    const { data } = supabase.storage.from('lesson_images').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handlePost = async () => {
    if (!selectedSubjectId || !topicName || !content) {
      Alert.alert('Missing Data', 'Please select a subject, topic name, and content.');
      return;
    }

    setLoading(true);
    try {
      // 1. Upload Cover Image
      let coverUrl = null;
      if (coverImage) {
        coverUrl = await uploadImageToSupabase(coverImage);
      }

      // 2. Create Topic
      const { data: topicData, error: topicError } = await supabase
        .from('topics')
        .insert([{
          subject_id: selectedSubjectId,
          name: topicName,
          term: term,
          week_number: parseInt(week),
          image_url: coverUrl 
        }])
        .select()
        .single();

      if (topicError) throw topicError;

      // 3. Create Lesson Content
      const { error: lessonError } = await supabase
        .from('lessons')
        .insert([{
          topic_id: topicData.id,
          title: 'Lesson Note',
          content: content,
          video_url: videoUrl,
          type: videoUrl ? 'video_note' : 'note'
        }]);

      if (lessonError) throw lessonError;

      Alert.alert('Success', 'Topic and Content added!');
      
      // Reset
      setTopicName('');
      setContent('');
      setVideoUrl('');
      setCoverImage(null);
      
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Studio</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* CONTEXT */}
        <View style={styles.section}>
          <View style={styles.labelRow}><Layers size={16} color={COLORS.textSecondary} /><Text style={styles.label}>Class</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSelect}>
            {CLASSES.map((cls) => (
              <TouchableOpacity key={cls} onPress={() => setSelectedClass(cls)} style={[styles.chip, selectedClass === cls && styles.chipActive]}>
                <Text style={[styles.chipText, selectedClass === cls && styles.chipTextActive]}>{cls}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.labelRow}><BookOpen size={16} color={COLORS.textSecondary} /><Text style={styles.label}>Subject</Text></View>
          
          {/* ✅ FIXED: Always show 'New' button first, then the list */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollSelect}>
              <TouchableOpacity 
                style={[styles.chip, {backgroundColor: COLORS.secondary, borderColor: COLORS.secondary}]} 
                onPress={() => router.push('/(admin)/create-subject')}
              >
                <View style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
                    <Plus size={16} color="#fff" />
                    <Text style={{color: '#fff', fontWeight: 'bold'}}>New</Text>
                </View>
              </TouchableOpacity>

              {subjects.map((sub) => (
                <TouchableOpacity key={sub.id} onPress={() => setSelectedSubjectId(sub.id)} style={[styles.chip, selectedSubjectId === sub.id && styles.chipActive]}>
                  <Text style={[styles.chipText, selectedSubjectId === sub.id && styles.chipTextActive]}>{sub.name}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>

        {/* CONTENT */}
        <View style={styles.section}>
           <View style={{flexDirection: 'row', gap: 10, marginBottom: 15}}>
              {TERMS.map((t) => (
                <TouchableOpacity key={t} onPress={() => setTerm(t)} style={[styles.smallChip, term === t && styles.chipActive]}>
                  <Text style={[styles.chipText, term === t && styles.chipTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
           </View>

           <View style={{flexDirection: 'row', gap: 10}}>
              <View style={{flex: 1}}>
                 <Text style={styles.subLabel}>Week</Text>
                 <TextInput style={styles.input} value={week} onChangeText={setWeek} keyboardType="numeric" />
              </View>
              <View style={{flex: 3}}>
                 <Text style={styles.subLabel}>Topic Name</Text>
                 <TextInput style={styles.input} value={topicName} onChangeText={setTopicName} placeholder="e.g. Pythagoras Theorem" />
              </View>
           </View>

           {/* COVER IMAGE */}
           <View style={[styles.labelRow, { marginTop: 20 }]}>
              <ImageIcon size={16} color={COLORS.textSecondary} />
              <Text style={styles.label}>Topic Cover Image</Text>
           </View>
           {coverImage ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: coverImage.uri }} style={styles.previewImg} resizeMode="cover" />
                <TouchableOpacity style={styles.removeImageBtn} onPress={() => setCoverImage(null)}>
                  <X color="#fff" size={18} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePickerBtn} onPress={() => pickImage(setCoverImage)}>
                <UploadCloud color={COLORS.primary} size={30} />
                <Text style={{color: COLORS.textSecondary, marginTop: 5}}>Tap to upload Cover Image</Text>
              </TouchableOpacity>
            )}

           {/* 🎥 VIDEO URL INPUT */}
           <View style={[styles.labelRow, { marginTop: 20 }]}>
              <Youtube size={16} color="red" />
              <Text style={styles.label}>Video Lesson (Optional)</Text>
           </View>
           <TextInput 
              style={styles.input} 
              value={videoUrl} 
              onChangeText={setVideoUrl} 
              placeholder="Paste YouTube Link here..." 
            />

           {/* LESSON NOTE */}
           <View style={[styles.labelRow, { marginTop: 20 }]}>
              <FileText size={16} color={COLORS.textSecondary} />
              <Text style={styles.label}>Lesson Note</Text>
           </View>
           <TextInput 
              style={[styles.input, {height: 100, textAlignVertical: 'top'}]} 
              value={content} 
              onChangeText={setContent} 
              multiline 
              placeholder="Type lesson content..."
            />
        </View>

        <Button title="Publish Topic" onPress={handlePost} isLoading={loading} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  section: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  label: { fontSize: 14, fontWeight: 'bold', color: COLORS.textSecondary },
  subLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  scrollSelect: { flexDirection: 'row', marginBottom: 15 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: '#F0F2F5', marginRight: 8 },
  smallChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 15, backgroundColor: '#F0F2F5', borderWidth: 1, borderColor: '#eee' },
  chipActive: { backgroundColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  createBtn: { flexDirection: 'row', backgroundColor: COLORS.secondary, padding: 10, borderRadius: 20, alignSelf: 'flex-start', alignItems: 'center' },
  input: { backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee', fontSize: 16, color: COLORS.textPrimary },
  imagePickerBtn: { height: 120, borderRadius: 12, borderWidth: 2, borderColor: '#E5E7EB', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' },
  imagePreview: { position: 'relative', marginTop: 5 },
  previewImg: { width: '100%', height: 180, borderRadius: 12 },
  removeImageBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 6, borderRadius: 20 }
});