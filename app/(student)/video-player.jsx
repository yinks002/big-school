import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import YoutubePlayer from "react-native-youtube-iframe";
import { COLORS } from '../../constants/theme';

export default function VideoPlayerScreen() {
  const { topicName, videoUrl } = useLocalSearchParams();
  const router = useRouter();

  // 🛠️ UPGRADED HELPER: Handles 'watch?v=' AND 'shorts/'
  const getYoutubeId = (url) => {
    if (!url) return null;
    
    // This regex looks for common YouTube patterns including /shorts/
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    
    // YouTube IDs are always 11 characters
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = getYoutubeId(videoUrl);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft color={COLORS.white} size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{topicName}</Text>
      </View>

      {/* Video Container */}
      <View style={styles.videoContainer}>
        {videoId ? (
          <YoutubePlayer
            height={240} // Height for the video frame
            play={true}  // Auto-play
            videoId={videoId}
          />
        ) : (
          <View style={styles.errorBox}>
            <Text style={{color: '#fff', fontSize: 16}}>Invalid Video Link</Text>
            <Text style={{color: '#aaa', marginTop: 5, fontSize: 12}}>{videoUrl}</Text>
          </View>
        )}
      </View>

      {/* Info Section */}
      <View style={styles.infoSection}>
        <Text style={styles.title}>{topicName}</Text>
        <Text style={styles.subtitle}>Video Lesson</Text>
        
        <View style={styles.divider} />
        
        <Text style={styles.description}>
          Watch this lesson carefully. You can switch to the "Notes" tab to read the detailed summary after watching.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' }, // Dark mode for cinema feel
  
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    position: 'absolute', 
    top: 0, 
    zIndex: 10,
    width: '100%',
  },
  backBtn: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20, marginRight: 10 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', flex: 1 },
  
  videoContainer: { 
    marginTop: 100, 
    height: 240, 
    backgroundColor: '#000', 
    justifyContent: 'center' 
  },
  
  errorBox: { alignItems: 'center', justifyContent: 'center', height: 200, backgroundColor: '#111' },
  
  infoSection: { padding: 20, marginTop: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 5 },
  subtitle: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  
  divider: { height: 1, backgroundColor: '#333', marginVertical: 15 },
  
  description: { color: '#aaa', fontSize: 14, lineHeight: 22 }
});
// https://www.youtube.com/shorts/Im3loIZsV3I