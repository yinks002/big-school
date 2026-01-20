import { Medal, Trophy } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function LeaderboardScreen() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    // 1. Get all profiles
    // Note: In a real production app, you would use a SQL View or Edge Function for this calculation to be faster.
    // For MVP, we will fetch results and calculate locally.
    
    try {
      const { data: students } = await supabase.from('profiles').select('id, full_name, class_level');
      const { data: results } = await supabase.from('quiz_results').select('student_id, score');

      if (!students || !results) { setLoading(false); return; }

      // 2. Calculate Total Points per Student
      const scores = {};
      results.forEach(r => {
        if (scores[r.student_id]) {
            scores[r.student_id] += r.score;
        } else {
            scores[r.student_id] = r.score;
        }
      });

      // 3. Merge with Names
      const leaderboardData = students.map(s => ({
        id: s.id,
        name: s.full_name || 'Anonymous',
        class: s.class_level,
        points: scores[s.id] || 0
      }));

      // 4. Sort by Points (Highest first) and take Top 10
      const sorted = leaderboardData.sort((a, b) => b.points - a.points).slice(0, 10);
      setLeaders(sorted);

    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy size={24} color="#FFD700" fill="#FFD700" />; // Gold
    if (index === 1) return <Medal size={24} color="#C0C0C0" />; // Silver
    if (index === 2) return <Medal size={24} color="#CD7F32" />; // Bronze
    return <Text style={styles.rankText}>{index + 1}</Text>;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Top Scholars 🏆</Text>
        <Text style={styles.subTitle}>Highest total quiz points this term</Text>
      </View>

      <View style={styles.listHeader}>
         <Text style={styles.lhText}>Rank</Text>
         <Text style={[styles.lhText, {flex:1, marginLeft: 20}]}>Student</Text>
         <Text style={styles.lhText}>Points</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? <ActivityIndicator color={COLORS.primary} style={{marginTop: 50}} /> : (
           leaders.map((student, index) => (
             <View key={student.id} style={[
                styles.card, 
                index === 0 && styles.firstPlace,
                index === 1 && styles.secondPlace,
                index === 2 && styles.thirdPlace
             ]}>
                <View style={styles.rankBox}>
                   {getRankIcon(index)}
                </View>
                
                <View style={styles.infoBox}>
                   <Text style={[styles.name, index < 3 && {fontWeight:'900'}]}>{student.name}</Text>
                   <Text style={styles.classText}>{student.class}</Text>
                </View>

                <View style={styles.pointsBox}>
                   <Text style={[styles.points, index < 3 && {color: COLORS.primary}]}>{student.points}</Text>
                   <Text style={styles.ptsLabel}>pts</Text>
                </View>
             </View>
           ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  header: { alignItems: 'center', marginBottom: 30 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  subTitle: { color: '#666', marginTop: 5 },
  
  listHeader: { flexDirection: 'row', paddingHorizontal: 15, marginBottom: 10 },
  lhText: { fontWeight: 'bold', color: '#999', fontSize: 12, textTransform: 'uppercase' },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  
  // Special Styles for Top 3
  firstPlace: { borderColor: '#FFD700', backgroundColor: '#FFFDF0', transform: [{scale: 1.02}] },
  secondPlace: { borderColor: '#C0C0C0' },
  thirdPlace: { borderColor: '#CD7F32' },

  rankBox: { width: 40, alignItems: 'center', justifyContent: 'center' },
  rankText: { fontSize: 18, fontWeight: 'bold', color: '#666' },
  
  infoBox: { flex: 1, marginLeft: 10 },
  name: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  classText: { fontSize: 12, color: '#999' },
  
  pointsBox: { alignItems: 'flex-end' },
  points: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  ptsLabel: { fontSize: 10, color: '#999' }
});