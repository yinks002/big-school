import { router, useFocusEffect } from 'expo-router';
import {
  BarChart2,
  BookOpen, Calculator,
  Cpu,
  Edit3,
  FlaskConical,
  Globe,
  Landmark,
  Settings,
  Trophy,
  UploadCloud,
  User, Users,
  Zap
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../providers/AuthProvider';

const ALL_CLASSES = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

const ICON_MAP = {
  'Calculator': Calculator, 'BookOpen': BookOpen, 'FlaskConical': FlaskConical,
  'Landmark': Landmark, 'Globe': Globe, 'Cpu': Cpu,
};

export default function StudentHome() {
  const { session } = useAuth();
  
  // Data State
  const [subjects, setSubjects] = useState([]);
  const [suggestedTopics, setSuggestedTopics] = useState([]); 
  const [userName, setUserName] = useState('User'); 
  const [enrolledClass, setEnrolledClass] = useState(''); 
  const [activeClassTab, setActiveClassTab] = useState(''); 
  
  // 🔐 ROLES
  const [isOwner, setIsOwner] = useState(false);   // Super Admin
  const [isWorker, setIsWorker] = useState(false); // Admin
  const [isTeacher, setIsTeacher] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    if (!session?.user) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('class_level, full_name, role') 
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        setEnrolledClass(profile.class_level);
        
        // 🛡️ ROLE LOGIC
        if (profile.role === 'super_admin') {
            setIsOwner(true);  // Only Owner sees the Master Dashboard
            setIsWorker(true); // Owner can also upload content
            setIsTeacher(true);
            setUserName('Owner'); 
        } else if (profile.role === 'admin') {
            setIsOwner(false);
            setIsWorker(true); // Workers only see Upload tools
            setIsTeacher(true);
            setUserName('Admin');
        } else if (profile.role === 'teacher') {
            setIsTeacher(true);
            setUserName('Teacher');
        } else {
            setUserName('Student');
        }
        
        if (!activeClassTab) setActiveClassTab(profile.class_level || 'JSS 1');
        if (profile.full_name) setUserName(profile.full_name.split(' ')[0]);
      }
    } catch (e) {
      console.log("Profile Error:", e);
    }
  };

  const fetchSubjects = async () => {
    if (!activeClassTab) return;
    setLoading(true);
    try {
      const { data: subData } = await supabase.from('subjects').select('*').eq('level', activeClassTab); 
      setSubjects(subData || []);
    } catch (e) { console.log(e); } finally { setLoading(false); }
  };

  const fetchSuggestions = async () => {
    if (!activeClassTab) return;
    try {
      const { data, error } = await supabase.from('topics')
        .select(`*, subjects!inner(*)`)
        .eq('subjects.level', activeClassTab)
        .order('created_at', { ascending: false }).limit(5);
      if (!error) setSuggestedTopics(data || []);
    } catch (e) { console.log(e); }
  };

  useFocusEffect(useCallback(() => { fetchProfile(); }, [session]));
  useFocusEffect(useCallback(() => { fetchSubjects(); fetchSuggestions(); }, [activeClassTab]));

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfile(); await fetchSubjects(); await fetchSuggestions();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    const performLogout = async () => {
      await supabase.auth.signOut();
      router.replace('/(auth)/welcome');
    };
    if (Platform.OS === 'web') {
      if (window.confirm("Sign out?")) await performLogout();
    } else {
      Alert.alert("Log Out", "Sign out?", [{ text: "Cancel" }, { text: "Log Out", onPress: performLogout }]);
    }
  };

  const handleSuggestionPress = (topic) => {
    router.push({ 
        pathname: '/(student)/lesson', 
        params: { topicId: topic.id, topicName: topic.name, coverImage: topic.image_url } 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good Morning,</Text>
          <Text style={styles.username}>{userName} 👋</Text>
          <Text style={styles.subText}>
             {isOwner ? 'System Owner' : isWorker ? 'Content Admin' : isTeacher ? 'Teacher Mode' : `Class: ${enrolledClass || '...'}`}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', gap: 8 }}>
           
           {/* 👑 OWNER EXCLUSIVE: Master Dashboard */}
           {isOwner && (
               <TouchableOpacity 
                  style={[styles.iconBtn, {backgroundColor: '#212121'}]} 
                  onPress={() => router.push('/(admin)/dashboard')}
               >
                 <Settings color="#fff" size={20} />
               </TouchableOpacity>
           )}

           {/* 🛠️ WORKER TOOLS (Content Creators) */}
           {isWorker && (
             <>
               <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(admin)/upload')}>
                 <UploadCloud color={COLORS.textPrimary} size={20} />
               </TouchableOpacity>
               <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(admin)/manage')}>
                 <Edit3 color={COLORS.textPrimary} size={20} />
               </TouchableOpacity>
               <TouchableOpacity style={[styles.iconBtn, {backgroundColor: '#E3F2FD'}]} onPress={() => router.push('/(admin)/cbt-portal')}>
                 <Cpu color={COLORS.secondary} size={20} />
               </TouchableOpacity>
               <TouchableOpacity style={[styles.iconBtn, {backgroundColor: '#FFF3E0'}]} onPress={() => router.push('/(admin)/soft-skills-studio')}>
                  <Zap color="orange" size={20} />
               </TouchableOpacity>
             </>
           )}

           {/* 👨‍🏫 TEACHER TOOLS */}
           {isTeacher && (
               <TouchableOpacity style={[styles.iconBtn, {backgroundColor: '#E8F5E9'}]} onPress={() => router.push('/(teacher)/dashboard')}>
                  <Users color="green" size={20} />
               </TouchableOpacity>
           )}

           {/* ⚡ STUDENT TOOLS */}
           <TouchableOpacity style={[styles.iconBtn, {backgroundColor: '#E3F2FD'}]} onPress={() => router.push('/(student)/my-classrooms')}>
              <Users color={COLORS.secondary} size={20} />
           </TouchableOpacity>

           <TouchableOpacity style={[styles.iconBtn, {backgroundColor: '#FFF3E0'}]} onPress={() => router.push('/(student)/skills')}>
              <Zap color="orange" size={20} />
           </TouchableOpacity>

           <TouchableOpacity style={[styles.iconBtn, {backgroundColor: '#E1F5FE'}]} onPress={() => router.push('/(student)/leaderboard')}>
              <BarChart2 color="#0288D1" size={20} />
           </TouchableOpacity>

           <TouchableOpacity style={[styles.iconBtn, {backgroundColor: '#FFF8E1'}]} onPress={() => router.push('/(student)/results')}>
              <Trophy color="#FFC107" size={20} />
           </TouchableOpacity>

           {/* 👤 PROFILE */}
           <TouchableOpacity style={[styles.iconBtn, { backgroundColor: '#F0F2F5' }]} onPress={() => router.push('/(student)/profile')}>
             <User color={COLORS.textPrimary} size={20} />
           </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        
        {/* PICK OF THE WEEK */}
        {suggestedTopics.length > 0 && (
          <View style={styles.suggestionSection}>
            <Text style={styles.sectionTitle}>Pick of the Week 🔥</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 15, paddingRight: 20 }}>
              {suggestedTopics.map((topic) => (
                <TouchableOpacity key={topic.id} style={styles.suggestionCard} onPress={() => handleSuggestionPress(topic)}>
                  <Image source={{ uri: topic.image_url || 'https://via.placeholder.com/300x200?text=New' }} style={styles.suggestionImage} resizeMode="cover" />
                  <View style={styles.suggestionOverlay}>
                    <Text style={styles.suggestionSubject}>{topic.subjects?.name}</Text>
                    <Text style={styles.suggestionTitle} numberOfLines={2}>{topic.name}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* CLASS TABS */}
        <View style={{ marginBottom: 15 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {ALL_CLASSES.map((cls) => (
                <TouchableOpacity key={cls} style={[styles.tab, activeClassTab === cls && styles.tabActive]} onPress={() => setActiveClassTab(cls)}>
                <Text style={[styles.tabText, activeClassTab === cls && styles.tabTextActive]}>{cls}</Text>
                </TouchableOpacity>
            ))}
            </ScrollView>
        </View>

        {/* SUBJECTS GRID */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
          <Text style={styles.sectionTitle}>{activeClassTab} Subjects</Text>
          {loading && <ActivityIndicator size="small" color={COLORS.primary} />}
        </View>
        
        {!loading && subjects.length === 0 ? (
           <View style={styles.emptyState}>
              <BookOpen size={40} color="#ddd" />
              <Text style={{color: '#999', marginTop: 10}}>No subjects for {activeClassTab} yet.</Text>
           </View>
        ) : (
           <View style={styles.grid}>
             {subjects.map((subject) => {
               const IconComponent = ICON_MAP[subject.icon_name] || BookOpen;
               return (
                 <TouchableOpacity key={subject.id} style={[styles.subjectCard, { borderColor: subject.color }]} onPress={() => router.push({ pathname: '/(student)/[subject]', params: { subject: subject.name } })}>
                   <View style={[styles.iconBox, { backgroundColor: subject.color }]}>
                     <IconComponent color="#fff" size={28} />
                   </View>
                   <Text style={styles.subjectName}>{subject.name}</Text>
                 </TouchableOpacity>
               );
             })}
           </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 20 },
  greeting: { fontSize: 16, color: COLORS.textSecondary },
  username: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  subText: { fontSize: 12, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  
  iconBtn: { padding: 8, backgroundColor: '#F0F2F5', borderRadius: 40 },
  
  tab: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 25, backgroundColor: '#F0F2F5', borderWidth: 1, borderColor: 'transparent' },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#fff', fontWeight: 'bold' },

  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 15 },
  
  suggestionSection: { marginBottom: 30 },
  suggestionCard: { width: 260, height: 160, borderRadius: 16, overflow: 'hidden', marginRight: 5, backgroundColor: '#000' },
  suggestionImage: { width: '100%', height: '100%', opacity: 0.8 },
  suggestionOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 15,  backgroundColor: 'rgba(0,0,0,0.4)' }, 
  suggestionSubject: { color: COLORS.primary, fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 },
  suggestionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  subjectCard: { width: '48%', backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: COLORS.stroke },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  subjectName: { fontSize: 16, fontWeight: 'bold', color: COLORS.textPrimary },
  emptyState: { padding: 40, alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, borderColor: '#eee' }
});