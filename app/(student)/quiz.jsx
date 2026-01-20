import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Trophy } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

export default function QuizScreen() {
  const { topicId, topicName } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useAuth();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Quiz State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null); // 'A', 'B', 'C', or 'D'
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [answerLocked, setAnswerLocked] = useState(false); // Prevent changing answer after picking

  useEffect(() => {
    fetchQuestions();
  }, [topicId]);

  const fetchQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topicId);
    
    if (error) {
      Alert.alert("Error", "Could not load quiz.");
      router.back();
    } else {
      // Shuffle questions (optional, good for CBT)
      setQuestions(data.sort(() => Math.random() - 0.5)); 
    }
    setLoading(false);
  };

  const handleOptionSelect = (option) => {
    if (answerLocked) return; // Cannot change once selected (Strict CBT mode)
    setSelectedOption(option);
  };

  const handleNext = () => {
    // 1. Check Answer
    const currentQuestion = questions[currentIndex];
    const isCorrect = selectedOption === currentQuestion.correct_option;
    
    if (isCorrect) {
      setScore(score + 1);
    }

    // 2. Move to Next or Finish
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setAnswerLocked(false);
    } else {
      finishQuiz(score + (isCorrect ? 1 : 0)); // Pass final score including this one
    }
  };

  const finishQuiz = async (finalScore) => {
    setIsFinished(true);
    const percentage = Math.round((finalScore / questions.length) * 100);

    // Save Result to DB
    await supabase.from('quiz_results').insert([{
      student_id: session.user.id,
      topic_id: topicId,
      score: percentage,
      total_questions: questions.length
    }]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={COLORS.primary} /></View>;

  if (questions.length === 0) return (
    <View style={styles.center}>
      <Text style={styles.text}>No questions available for this topic yet.</Text>
      <TouchableOpacity onPress={() => router.back()} style={styles.btnSmall}><Text style={styles.btnText}>Go Back</Text></TouchableOpacity>
    </View>
  );

  // --- RESULT SCREEN ---
  if (isFinished) {
    const percentage = Math.round((score / questions.length) * 100);
    const isPass = percentage >= 50;

    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Trophy size={80} color={isPass ? COLORS.primary : COLORS.textSecondary} />
        <Text style={styles.resultTitle}>{isPass ? "Excellent Job!" : "Keep Practicing"}</Text>
        <Text style={styles.resultScore}>{percentage}%</Text>
        <Text style={styles.resultSub}>You got {score} out of {questions.length} correct.</Text>
        
        <TouchableOpacity style={[styles.btn, { width: 200, marginTop: 40 }]} onPress={() => router.back()}>
          <Text style={styles.btnText}>Finish</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // --- QUESTION SCREEN ---
  const q = questions[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => Alert.alert("Quit?", "Progress will be lost", [{text:"Cancel"}, {text:"Quit", onPress:()=>router.back()}])}>
          <ChevronLeft color={COLORS.textPrimary} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Question {currentIndex + 1}/{questions.length}</Text>
        <View style={{width:28}}/>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Question Card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{q.question_text}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {['A', 'B', 'C', 'D'].map((opt) => {
            // Helper to get the text for option A, B, etc.
            const text = opt === 'A' ? q.option_a : opt === 'B' ? q.option_b : opt === 'C' ? q.option_c : q.option_d;
            const isSelected = selectedOption === opt;

            return (
              <TouchableOpacity 
                key={opt} 
                style={[styles.optionBtn, isSelected && styles.optionSelected]}
                onPress={() => handleOptionSelect(opt)}
                activeOpacity={0.8}
              >
                <View style={[styles.circle, isSelected && styles.circleSelected]}>
                  <Text style={[styles.circleText, isSelected && styles.circleTextSelected]}>{opt}</Text>
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.btn, !selectedOption && styles.btnDisabled]} 
          onPress={handleNext}
          disabled={!selectedOption}
        >
          <Text style={styles.btnText}>{currentIndex === questions.length - 1 ? "Submit" : "Next"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary },
  
  content: { padding: 20 },
  questionCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, marginBottom: 20, minHeight: 120, justifyContent: 'center' },
  questionText: { fontSize: 18, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 26 },
  
  optionsContainer: { gap: 12 },
  optionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#eee' },
  optionSelected: { borderColor: COLORS.primary, backgroundColor: '#E8F5E9' },
  
  circle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0F2F5', alignItems: 'center', justifyContent: 'center', marginRight: 15 },
  circleSelected: { backgroundColor: COLORS.primary },
  circleText: { fontWeight: 'bold', color: '#666' },
  circleTextSelected: { color: '#fff' },
  
  optionText: { fontSize: 16, color: COLORS.textPrimary, flex: 1 },
  optionTextSelected: { color: COLORS.primary, fontWeight: '600' },

  footer: { padding: 20, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee' },
  btn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 30, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#ccc' },
  btnSmall: { marginTop: 20, backgroundColor: COLORS.secondary, padding: 10, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  text: { color: '#666', fontSize: 16 },

  // Results
  resultTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 20 },
  resultScore: { fontSize: 60, fontWeight: 'bold', color: COLORS.primary, marginVertical: 10 },
  resultSub: { fontSize: 16, color: COLORS.textSecondary },
});