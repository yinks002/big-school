import { Slot, usePathname, useRouter, useSegments } from 'expo-router'; // 👈 Added usePathname
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { AuthProvider, useAuth } from '../providers/AuthProvider';

const InitialLayout = () => {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname(); // 👈 reliable path reader
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (loading) return;

    const checkUserPath = async () => {
      // 1. Get current location safely
      const currentPath = pathname || "";
      
      // Check if we are in specific groups/pages
      const inAuthGroup = segments[0] === '(auth)';
      const inTeacherGroup = segments[0] === '(teacher)';
      const inStudentGroup = segments[0] === '(student)';
      const inParentGroup = segments[0] === '(parent)';
      const inAdminGroup = segments[0] === '(admin)'; 
      
      // ✅ ROBUST CHECK: Are we literally sitting on the setup page?
      const isAtSetup = currentPath.includes('setup-profile');

      if (session) {
        // --- LOGGED IN ---
        
        // Optimize: If we are already at setup, STOP checking. Let the user type.
        if (isAtSetup) return;

        // 2. Only check database if we aren't where we are supposed to be
        const needsCheck = !inTeacherGroup && !inStudentGroup && !inParentGroup && !inAdminGroup;

        if (needsCheck || inAuthGroup) {
             setIsChecking(true);
             const { data: profile } = await supabase
               .from('profiles')
               .select('role, class_level, full_name')
               .eq('id', session.user.id)
               .maybeSingle();
             setIsChecking(false);

             // 🚨 3. PROFILE CHECK: If Profile is missing/incomplete -> Force Setup
             if (!profile || !profile.full_name) {
                 router.replace('/(auth)/setup-profile');
                 return;
             }

             const role = profile.role;
             const hasClass = profile.class_level !== null;

             // 🚦 4. ROUTING TRAFFIC CONTROL
             
             // PARENT
             if (role === 'parent') {
                 if (!inParentGroup) router.replace('/(parent)/dashboard');
             }

             // TEACHER
             else if (role === 'teacher') {
                 if (!inTeacherGroup) router.replace('/(teacher)/dashboard');
             } 
             
             // STUDENT / ADMIN
             else if (role === 'student' || role === 'super_admin') {
                 if (role === 'super_admin') {
                     if (!inStudentGroup) router.replace('/(student)/home');
                 } else {
                     if (hasClass) {
                         if (!inStudentGroup) router.replace('/(student)/home');
                     } else {
                         // Double check: if student has no class, they need setup
                         router.replace('/(auth)/setup-profile');
                     }
                 }
             }
        }
      } else {
        // --- NOT LOGGED IN ---
        if (!inAuthGroup) {
          router.replace('/(auth)/welcome');
        }
      }
    };

    checkUserPath();

  }, [session, loading, segments, pathname]); // Added pathname to dependency

  if (loading || isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <Slot />;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <InitialLayout />
    </AuthProvider>
  );
}