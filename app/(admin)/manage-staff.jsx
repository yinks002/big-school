import { router } from 'expo-router';
import { ChevronLeft, Search, Shield, ShieldOff, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function ManageStaffScreen() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // Fetch everyone except students to manage roles (or fetch everyone if you want to promote students)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false }); // Get newest users first

    if (error) Alert.alert("Error", error.message);
    setUsers(data || []);
    setLoading(false);
  };

  const handleUpdateRole = async (id, currentRole, name) => {
    // Logic: Toggle between 'admin' (Worker) and 'student'/'teacher'
    // Prevent changing other Super Admins
    if (currentRole === 'super_admin') {
        return Alert.alert("Restricted", "You cannot modify another Super Admin.");
    }

    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    const action = newRole === 'admin' ? 'Promote' : 'Revoke';

    Alert.alert(
        `${action} Access?`,
        `Are you sure you want to ${action.toLowerCase()} ${name}?`,
        [
            { text: "Cancel", style: "cancel" },
            { text: "Confirm", onPress: async () => {
                const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
                if (error) Alert.alert("Error", error.message);
                else {
                    Alert.alert("Success", `User is now a ${newRole}`);
                    fetchUsers();
                }
            }}
        ]
    );
  };

  const handleDeleteUser = async (id, name) => {
      Alert.alert("Delete User?", `This will verify wipe ${name}'s account and data.`, [
          { text: "Cancel" },
          { text: "Delete", style: "destructive", onPress: async () => {
              // Delete from public profile (Trigger should handle auth user if set up, or manual cleanup needed)
              const { error } = await supabase.from('profiles').delete().eq('id', id);
              if (error) Alert.alert("Error", error.message);
              else {
                  fetchUsers();
                  Alert.alert("Deleted", "User removed.");
              }
          }}
      ]);
  };

  const filteredUsers = users.filter(u => 
     (u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><ChevronLeft size={28} color="#000" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Staff & User Management</Text>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchBox}>
         <Search size={20} color="#999" />
         <TextInput 
            style={styles.input} 
            placeholder="Search by name or email..." 
            value={search}
            onChangeText={setSearch}
         />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {loading ? <ActivityIndicator color={COLORS.primary} style={{marginTop: 50}} /> : (
            filteredUsers.map(user => (
                <View key={user.id} style={styles.userCard}>
                    <View style={styles.avatar}>
                        <Text style={{fontWeight:'bold', color:'#fff'}}>{(user.full_name || 'U').charAt(0)}</Text>
                    </View>
                    <View style={{flex:1, marginLeft: 10}}>
                        <Text style={styles.name}>{user.full_name || 'No Name'}</Text>
                        <Text style={styles.email}>{user.email}</Text>
                        <View style={[styles.roleBadge, 
                            user.role === 'super_admin' ? {backgroundColor: '#000'} :
                            user.role === 'admin' ? {backgroundColor: COLORS.primary} :
                            {backgroundColor: '#eee'}
                        ]}>
                            <Text style={[styles.roleText, (user.role === 'admin' || user.role === 'super_admin') ? {color:'#fff'} : {color:'#666'}]}>
                                {user.role === 'admin' ? 'CONTENT ADMIN' : user.role === 'super_admin' ? 'OWNER' : user.role.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    {/* ACTIONS */}
                    {user.role !== 'super_admin' && (
                        <View style={{flexDirection:'row', gap: 10}}>
                            <TouchableOpacity onPress={() => handleUpdateRole(user.id, user.role, user.full_name)}>
                                {user.role === 'admin' ? <ShieldOff color="orange" size={24} /> : <Shield color={COLORS.primary} size={24} />}
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => handleDeleteUser(user.id, user.full_name)}>
                                <Trash2 color="red" size={24} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 15, borderRadius: 12, height: 50, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  input: { flex: 1, marginLeft: 10, height: '100%' },
  
  userCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, borderRadius: 16, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.05, elevation: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.secondary, alignItems: 'center', justifyContent: 'center' },
  name: { fontWeight: 'bold', fontSize: 16, color: COLORS.textPrimary },
  email: { fontSize: 12, color: '#999', marginBottom: 4 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  roleText: { fontSize: 10, fontWeight: 'bold' }
});