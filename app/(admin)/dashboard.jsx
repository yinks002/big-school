import { router, useFocusEffect } from 'expo-router';
import {
    BookOpen,
    CreditCard, Layers,
    LogOut, Shield,
    TrendingUp,
    Users
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({ students: 0, teachers: 0, revenue: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { count: studentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
      const { count: teacherCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
      
      // Fake Revenue Calc for Demo (Real logic would sum paystack transactions)
      const { count: premiumCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_premium', true);
      const revenue = premiumCount * 2000; 

      setStats({ students: studentCount || 0, teachers: teacherCount || 0, revenue: revenue });

      // Get Recent Signups
      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentUsers(users || []);

    } catch (e) {
      console.log("Admin Dash Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));
  const onRefresh = () => { setRefreshing(true); fetchDashboardData(); };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
            <Text style={styles.headerTitle}>Owner Dashboard</Text>
            <Text style={styles.subText}>System Control Center</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
            <LogOut size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* 💰 FINANCIALS */}
        <View style={styles.revCard}>
            <View>
                <Text style={styles.revLabel}>Total Revenue (Est.)</Text>
                <Text style={styles.revAmount}>₦{stats.revenue.toLocaleString()}</Text>
            </View>
            <View style={styles.revIcon}>
                <TrendingUp size={24} color="#fff" />
            </View>
        </View>
        
        {/* 📊 STATS */}
        <View style={styles.statsRow}>
            <View style={styles.statCard}>
                <Users size={20} color={COLORS.primary} />
                <Text style={styles.statNum}>{stats.students}</Text>
                <Text style={styles.statLabel}>Students</Text>
            </View>
            <View style={styles.statCard}>
                <BookOpen size={20} color={COLORS.secondary} />
                <Text style={styles.statNum}>{stats.teachers}</Text>
                <Text style={styles.statLabel}>Teachers</Text>
            </View>
        </View>

        {/* 🛡️ OWNER TOOLS */}
        <Text style={styles.sectionTitle}>System Management</Text>
        <View style={styles.grid}>
            
            <TouchableOpacity style={styles.toolCard} onPress={() => router.push('/(admin)/manage-staff')}>
                <View style={[styles.iconBox, {backgroundColor: '#E8F5E9'}]}>
                    <Shield size={24} color="green" />
                </View>
                <Text style={styles.toolTitle}>Manage Staff</Text>
                <Text style={styles.toolSub}>Admins & Users</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.toolCard} onPress={() => Alert.alert("Coming Soon", "Detailed Transaction History")}>
                <View style={[styles.iconBox, {backgroundColor: '#FFF3E0'}]}>
                    <CreditCard size={24} color="orange" />
                </View>
                <Text style={styles.toolTitle}>Payments</Text>
                <Text style={styles.toolSub}>Transaction Log</Text>
            </TouchableOpacity>

            {/* Quick Link to Content (Just in case Owner wants to see) */}
            <TouchableOpacity style={styles.toolCard} onPress={() => router.push('/(admin)/manage')}>
                <View style={[styles.iconBox, {backgroundColor: '#F3E5F5'}]}>
                    <Layers size={24} color="purple" />
                </View>
                <Text style={styles.toolTitle}>Content Overview</Text>
                <Text style={styles.toolSub}>Check Content</Text>
            </TouchableOpacity>

        </View>

        {/* 🆕 RECENT ACTIVITY */}
        <Text style={[styles.sectionTitle, {marginTop: 20}]}>Recent Registrations</Text>
        <View style={styles.listContainer}>
            {recentUsers.map((user) => (
                <View key={user.id} style={styles.userRow}>
                    <View style={styles.userAvatar}>
                        <Text style={styles.avatarText}>{(user.full_name || 'U').charAt(0)}</Text>
                    </View>
                    <View style={{flex:1, marginLeft: 10}}>
                        <Text style={styles.userName}>{user.full_name || 'New User'}</Text>
                        <Text style={styles.userRole}>{user.role.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.date}>{new Date(user.created_at).toLocaleDateString()}</Text>
                </View>
            ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: COLORS.textPrimary },
  subText: { fontSize: 14, color: '#666' },
  closeBtn: { padding: 8, backgroundColor: '#eee', borderRadius: 20 },

  revCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#212121', padding: 20, borderRadius: 20, marginBottom: 20 },
  revLabel: { color: '#aaa', fontSize: 14 },
  revAmount: { color: '#fff', fontSize: 30, fontWeight: 'bold' },
  revIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  statCard: { width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 16, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  statNum: { fontSize: 20, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 5 },
  statLabel: { fontSize: 11, color: '#999' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: 15 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  toolCard: { width: '48%', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 5, borderWidth: 1, borderColor: '#eee' },
  iconBox: { width: 45, height: 45, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  toolTitle: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary },
  toolSub: { fontSize: 11, color: '#999' },

  listContainer: { backgroundColor: '#fff', borderRadius: 16, padding: 5 },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.secondary, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold' },
  userName: { fontSize: 14, fontWeight: 'bold', color: COLORS.textPrimary },
  userRole: { fontSize: 10, color: COLORS.primary, fontWeight: 'bold' },
  date: { fontSize: 12, color: '#999' }
});