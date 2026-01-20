import { router, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, GraduationCap } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { COLORS } from '../../constants/theme';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const { role } = useLocalSearchParams(); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        // 1. Sign Up Logic
        const { data: { user }, error } = await supabase.auth.signUp({ email, password });
        
        if (error) throw error;
        
        if (user) {
          // 2. Create Profile Entry (CRITICAL: Save Email Here)
          const { error: profileError } = await supabase.from('profiles').insert([{ 
            id: user.id, 
            email: email, // 👈 THIS IS REQUIRED FOR LINKING PARENTS/TEACHERS
            role: role || 'student',
            full_name: '',
            class_level: null 
          }]);

          if (profileError) throw profileError;
        }
        
        Alert.alert('Success', 'Account created! Please complete your profile setup.');
      } else {
        // 3. Login Logic
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* 🔙 NAVIGATION HEADER */}
        <View style={styles.navHeader}>
          <TouchableOpacity 
            // Use replace to safely go back to Welcome screen without history loops
            onPress={() => router.replace('/(auth)/welcome')} 
            style={styles.backButton}
          >
            <ChevronLeft color={COLORS.textPrimary} size={28} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Content Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
             <GraduationCap size={32} color={COLORS.primary} />
          </View>
          
          <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back!'}</Text>
          <Text style={styles.subtitle}>
            You are logging in as a <Text style={styles.highlight}>{role || 'Student'}</Text>
          </Text>
        </View>

        {/* Form Section */}
        <View style={styles.form}>
          <Input 
            label="Email Address" 
            placeholder="name@example.com" 
            value={email} 
            onChangeText={setEmail} 
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <Input 
            label="Password" 
            placeholder="••••••••" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
          />

          <View style={{ height: 20 }} />

          <Button 
            title={isSignUp ? "Create Account" : "Sign In"} 
            onPress={handleAuth} 
            isLoading={loading} 
          />
          
          <Button 
            title={isSignUp ? "Already have an account? Sign In" : "No account? Create One"} 
            onPress={() => setIsSignUp(!isSignUp)} 
            variant="outline" 
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    maxWidth: 500, 
    width: '100%',
    alignSelf: 'center', 
  },
  // Navigation Styles
  navHeader: {
    width: '100%',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginLeft: -8, 
  },
  backText: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Header Styles
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoBadge: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  highlight: {
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  form: {
    width: '100%',
  },
});