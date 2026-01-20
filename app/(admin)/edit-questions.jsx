import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Save } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function EditQuestionScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState('');
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    const fetchQuestion = async () => {
      const { data, error } = await supabase.from('questions').select('*').eq('id', id).single();
      if (error) {
        Alert.alert("Error", "Could not load question");
        router.back();
      } else {
        setQuestion(data.question_text);
        setOptionA(data.option_a);
        setOptionB(data.option_b);
        setOptionC(data.option_c);
        setOptionD(data.option_d);
        setCorrectOption(data.correct_option);
        setExplanation(data.explanation || '');
      }
      setLoading(false);
    };
    fetchQuestion();
  }, [id]);

  const handleUpdate = async () => {
    setSaving(true);
    const { error } = await supabase.from('questions').update({
      question_text: question,
      option_a: optionA,
      option_b: optionB,
      option_c: optionC,
      option_d: optionD,
      correct_option: correctOption,
      explanation: explanation
    }).eq('id', id);

    setSaving(false);
    if (error) Alert.alert("Error", error.message);
    else {
      Alert.alert("Success", "Question updated!");
      router.back();
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary}/></View>;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Question</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        
        {/* Question */}
        <View style={styles.card}>
          <Text style={styles.label}>Question</Text>
          <TextInput style={[styles.input, styles.textArea]} value={question} onChangeText={setQuestion} multiline />
        </View>

        {/* Options */}
        <View style={styles.card}>
          <Text style={styles.label}>Options</Text>
          <TextInput style={styles.input} value={optionA} onChangeText={setOptionA} placeholder="Option A" />
          <TextInput style={styles.input} value={optionB} onChangeText={setOptionB} placeholder="Option B" />
          <TextInput style={styles.input} value={optionC} onChangeText={setOptionC} placeholder="Option C" />
          <TextInput style={styles.input} value={optionD} onChangeText={setOptionD} placeholder="Option D" />
        </View>

        {/* Correct Answer */}
        <View style={styles.card}>
          <Text style={styles.label}>Correct Answer</Text>
          <View style={{flexDirection:'row', gap:10}}>
            {['A','B','C','D'].map(opt => (
              <TouchableOpacity key={opt} onPress={()=>setCorrectOption(opt)} style={[styles.circleBtn, correctOption===opt && styles.activeBtn]}>
                <Text style={[styles.btnText, correctOption===opt && styles.activeText]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button title="Save Changes" onPress={handleUpdate} isLoading={saving} icon={<Save color="#fff" size={18}/>} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 10 },
  input: { backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee', marginBottom: 10, fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  circleBtn: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  activeBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  btnText: { fontWeight: 'bold', color: '#666' },
  activeText: { color: '#fff' }
});