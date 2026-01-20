import { router } from 'expo-router';
import { GraduationCap, School, User, Users } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

export default function WelcomeScreen() {
  
  const handleRoleSelect = (role) => {
    router.push({ pathname: '/(auth)/login', params: { role } });
  };

  const RoleCard = ({ title, icon, roleId }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => handleRoleSelect(roleId)}
      activeOpacity={0.7}
    >
      <View style={styles.iconBox}>{icon}</View>
      <Text style={styles.cardTitle}>{title}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>the<Text style={{color: COLORS.primary}}>Big</Text>School</Text>
        <Text style={styles.subtitle}>Who is using the app?</Text>
      </View>

      <View style={styles.grid}>
        <RoleCard 
          title="I'm a Student" 
          roleId="student"
          icon={<User size={32} color={COLORS.primary} />} 
        />
        <RoleCard 
          title="I'm a Teacher" 
          roleId="teacher"
          icon={<GraduationCap size={32} color={COLORS.secondary} />} 
        />
        <RoleCard 
          title="I'm a Parent" 
          roleId="parent"
          icon={<Users size={32} color={COLORS.warning} />} 
        />
        <RoleCard 
          title="School Admin" 
          roleId="school_admin"
          icon={<School size={32} color={COLORS.danger} />} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  header: { marginTop: 40, marginBottom: 40, alignItems: 'center' },
  logoText: { fontSize: 32, fontWeight: 'bold', color: COLORS.secondary, marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#666' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, alignItems: 'center', borderWidth: 2, borderColor: COLORS.gray, borderBottomWidth: 5 },
  iconBox: { marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: COLORS.dark },
});