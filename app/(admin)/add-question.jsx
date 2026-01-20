import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/ui/Button';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function AddQuestionScreen() {
  const { topicId, topicName } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  // Form State
  const [question, setQuestion] = useState('');
  const [optionA, setOptionA] = useState('');
  const [optionB, setOptionB] = useState('');
  const [optionC, setOptionC] = useState('');
  const [optionD, setOptionD] = useState('');
  const [correctOption, setCorrectOption] = useState('A'); 
  const [explanation, setExplanation] = useState('');

  const handleSave = async () => {
    if (!question || !optionA || !optionB || !optionC || !optionD) {
      Alert.alert("Error", "Please fill the question and all 4 options.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('questions').insert([{
        topic_id: topicId,
        question_text: question,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_option: correctOption,
        explanation: explanation
      }]);

      if (error) throw error;

      Alert.alert("Success", "Question Added!", [
        { text: "Add Another", onPress: clearForm },
        { text: "Done", onPress: () => router.back() }
      ]);

    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setQuestion('');
    setOptionA('');
    setOptionB('');
    setOptionC('');
    setOptionD('');
    setExplanation('');
    setCorrectOption('A');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Question</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.subtitle}>Topic: {topicName}</Text>

        {/* Question Input */}
        <View style={styles.card}>
          <Text style={styles.label}>Question Text</Text>
          <TextInput 
            style={[styles.input, styles.textArea]} 
            value={question} 
            onChangeText={setQuestion} 
            multiline 
            placeholder="e.g. What is the formula for area?" 
          />
        </View>

        {/* Options Input */}
        <View style={styles.card}>
          <Text style={styles.label}>Options</Text>
          
          {['A', 'B', 'C', 'D'].map((opt) => (
             <View key={opt} style={styles.optionRow}>
                <View style={styles.optionBadge}><Text style={styles.optionText}>{opt}</Text></View>
                <TextInput 
                    style={styles.inputFlex} 
                    value={opt === 'A' ? optionA : opt === 'B' ? optionB : opt === 'C' ? optionC : optionD} 
                    onChangeText={opt === 'A' ? setOptionA : opt === 'B' ? setOptionB : opt === 'C' ? setOptionC : setOptionD} 
                    placeholder={`Option ${opt}`} 
                />
             </View>
          ))}
        </View>

        {/* Correct Answer Selection */}
        <View style={styles.card}>
          <Text style={styles.label}>Select Correct Answer</Text>
          <View style={styles.row}>
            {['A', 'B', 'C', 'D'].map((opt) => (
              <TouchableOpacity 
                key={opt} 
                style={[styles.circleBtn, correctOption === opt && styles.circleBtnActive]}
                onPress={() => setCorrectOption(opt)}
              >
                <Text style={[styles.circleText, correctOption === opt && styles.circleTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.label, {marginTop: 15}]}>Explanation (Optional)</Text>
          <TextInput 
            style={styles.input} 
            value={explanation} 
            onChangeText={setExplanation} 
            placeholder="Why is this correct?" 
          />
        </View>

        <Button title="Save Question" onPress={handleSave} isLoading={loading} />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrimary },
  subtitle: { fontSize: 14, color: COLORS.primary, marginBottom: 20, fontWeight: '600' },
  
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 16, marginBottom: 20 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 10 },
  input: { backgroundColor: '#F9FAFB', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#eee', fontSize: 16 },
  textArea: { height: 80, textAlignVertical: 'top' },
  
  optionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  optionBadge: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F0F2F5', alignItems: 'center', justifyContent: 'center' },
  optionText: { fontWeight: 'bold', color: '#666' },
  inputFlex: { flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },

  row: { flexDirection: 'row', gap: 15 },
  circleBtn: { width: 50, height: 50, borderRadius: 25, borderWidth: 2, borderColor: '#eee', alignItems: 'center', justifyContent: 'center' },
  circleBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  circleText: { fontSize: 18, fontWeight: 'bold', color: '#666' },
  circleTextActive: { color: '#fff' }
});