import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

interface Word {
  word: string;
  phonetic: string;
  definition: string;
  detailedMeaning: string;
  sentences: string[];
}

const VOCAB_POOL: Word[] = [
  { word: 'Resilience', phonetic: '/rɪˈzɪl.jəns/', definition: 'The capacity to recover quickly from difficulties.', detailedMeaning: 'Resilience is the process and outcome of successfully adapting to difficult or challenging life experiences, especially through mental, emotional, and behavioral flexibility.', sentences: ['She showed great resilience after the setback.', 'Economic resilience is crucial for a country\'s stability.'] },
  { word: 'Eloquence', phonetic: '/ˈel.ə.kwəns/', definition: 'Fluent or persuasive speaking or writing.', detailedMeaning: 'The quality of delivering a clear, strong message. It\'s about expressing yourself in a way that is convincing and powerful.', sentences: ['The senator\'s eloquence won over the audience.', 'He writes with such eloquence and grace.'] },
  { word: 'Ephemeral', phonetic: '/ɪˈfem.ər.əl/', definition: 'Lasting for a very short time.', detailedMeaning: 'Something that is short-lived or transitory. In nature, many things like blossoms or morning dew are ephemeral.', sentences: ['The beauty of sunset is ephemeral.', 'Social media trends are often ephemeral.'] },
  { word: 'Pensive', phonetic: '/ˈpen.sɪv/', definition: 'Engaged in, involving, or reflecting deep or serious thought.', detailedMeaning: 'A state of dreaming or thinking deeply about something, often with a touch of sadness or seriousness.', sentences: ['She sat by the window in a pensive mood.', 'The cold rain put him in a pensive state of mind.'] },
  { word: 'Luminous', phonetic: '/ˈluː.mɪ.nəs/', definition: 'Giving off light; bright or shining.', detailedMeaning: 'Full of or shedding light; bright or shining, especially in the dark. It can also refer to something very clear and easy to understand.', sentences: ['The moon gave a luminous glow to the room.', 'Her luminous eyes sparkled with joy.'] },
  { word: 'Serendipity', phonetic: '/ˌser.ənˈdɪp.ə.ti/', definition: 'The occurrence of events by chance in a happy way.', detailedMeaning: 'Finding something good without looking for it. It\'s the accident of finding something valuable or agreeable.', sentences: ['Nature has created many miracles by serendipity.', 'It was pure serendipity that we met in Paris.'] },
  { word: 'Mellifluous', phonetic: '/meˈlɪf.lu.əs/', definition: 'Sweet or musical; pleasant to hear.', detailedMeaning: 'A sound that is smooth and sweet as if it were flowing with honey. Often used to describe voices or music.', sentences: ['The singer has a mellifluous voice.', 'I love the mellifluous sound of the cello.'] },
  { word: 'Ineffable', phonetic: '/ɪnˈef.ə.bəl/', definition: 'Too great or extreme to be expressed in words.', detailedMeaning: 'Something that is so incredible or beautiful that it cannot be described with language.', sentences: ['The ineffable beauty of the Grand Canyon.', 'I felt an ineffable sense of relief.'] },
  { word: 'Halcyon', phonetic: '/ˈhæl.si.ən/', definition: 'Denoting a period of time in the past that was idyllically happy and peaceful.', detailedMeaning: 'Calm, peaceful, and tranquil. Often used to describe days of youth or a golden age.', sentences: ['We recall the halcyon days of our youth.', 'The halcyon weather continued for a week.'] },
  { word: 'Petrichor', phonetic: '/ˈpet.rɪ.kɔːr/', definition: 'A pleasant smell that frequently accompanies the first rain after a long period of warm, dry weather.', detailedMeaning: 'The earthy scent produced when rain falls on dry soil. The word comes from Greek \'petra\' (stone) and \'ichor\' (the fluid that flows in the veins of the gods).', sentences: ['The petrichor was strong after the afternoon storm.', 'I love the smell of petrichor in the garden.'] },
  { word: 'Aurora', phonetic: '/ɔːˈrɔː.rə/', definition: 'A natural electrical phenomenon characterized by the appearance of streams of reddish or greenish light in the sky.', detailedMeaning: 'The dawn; also the beautiful display of lights in the sky (Northern/Southern Lights) caused by solar wind.', sentences: ['The aurora borealis was visible from our cabin.', 'She woke up at the first light of aurora.'] },
  { word: 'Ethereal', phonetic: '/iˈθɪə.ri.əl/', definition: 'Extremely delicate and light in a way that seems too perfect for this world.', detailedMeaning: 'Heavenly or spiritual. Something so light and airy it doesn\'t seem of the earth.', sentences: ['The music had an ethereal quality.', 'She looked ethereal in the moonlight.'] },
  { word: 'Solitude', phonetic: '/ˈsɒl.ɪ.tjuːd/', definition: 'The state or situation of being alone.', detailedMeaning: 'Solitude is the state of being alone without being lonely. It is a positive and constructive state of engagement with oneself.', sentences: ['She savored her few hours of freedom and solitude.', 'The mountains offered the perfect solitude he needed.'] },
  { word: 'Quintessential', phonetic: '/ˌkwɪn.tɪˈsen.ʃəl/', definition: 'Representing the most perfect or typical example of a quality or class.', detailedMeaning: 'The most essential part of something; the purest form. It represents the very essence of a thing.', sentences: ['He was the quintessential tough guy.', 'Watermelons are the quintessential summer fruit.'] },
  { word: 'Euphoria', phonetic: '/juːˈfɔː.ri.ə/', definition: 'A feeling or state of intense excitement and happiness.', detailedMeaning: 'An overwhelming feeling of well-being, happiness, and excitement. A high state of joy.', sentences: ['The team was in a state of euphoria after winning.', 'A sense of euphoria swept over the crowd.'] },
  { word: 'Labyrinthine', phonetic: '/ˌlæb.əˈrɪn.θaɪn/', definition: 'Like a labyrinth; irregular and twisting.', detailedMeaning: 'Extremely complex and difficult to follow. Like a maze with many complicated paths.', sentences: ['The city\'s labyrinthine streets were hard to navigate.', 'The plot of the movie was labyrinthine.'] },
  { word: 'Sempiternal', phonetic: '/ˌsem.piˈtɜː.nəl/', definition: 'Everlasting; eternal.', detailedMeaning: 'Something that lives forever and never ends. Often used in a poetic or philosophical context.', sentences: ['The sempiternal beauty of the stars.', 'They promised sempiternal friendship.'] },
  { word: 'Oblivion', phonetic: '/əˈblɪv.i.ən/', definition: 'The state of being unaware or unconscious of what is happening.', detailedMeaning: 'The state of being forgotten, or the state of not knowing what is going on around you.', sentences: ['He drank himself into oblivion.', 'The memory of that event faded into oblivion.'] },
  { word: 'Panacea', phonetic: '/ˌpæn.əˈsiː.ə/', definition: 'A solution or remedy for all difficulties or diseases.', detailedMeaning: 'A universal cure. Something that is believed to solve all problems.', sentences: ['Technology is not a panacea for all social ills.', 'They view the new law as a panacea for the economy.'] },
  { word: 'Surreptitious', phonetic: '/ˌsʌr.əpˈtɪʃ.əs/', definition: 'Kept secret, especially because it would not be approved of.', detailedMeaning: 'Done by stealth; secret or unauthorized. Often used when describing something done quietly to avoid notice.', sentences: ['They exchanged surreptitious glances.', 'He made a surreptitious recording of the meeting.'] },
];

const ACCENT_COLOR = '#5D6DFF';

export function VocabularyChallenge({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [words, setWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [showStudyMore, setShowStudyMore] = useState(false);
  const [accent, setAccent] = useState<'US' | 'UK'>('US');

  useEffect(() => {
    const shuffled = [...VOCAB_POOL].sort(() => 0.5 - Math.random());
    setWords(shuffled.slice(0, 20));
  }, []);

  const word = words[currentIndex];

  const nextWord = useCallback(() => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowDefinition(false);
      setShowStudyMore(false);
    }
  }, [currentIndex, words.length]);

  const prevWord = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setShowDefinition(false);
      setShowStudyMore(false);
    }
  }, [currentIndex]);

  if (words.length === 0) return null;

  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={24} color={LifeMonkColors.text} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerLabel}>VOCABULARY CHALLENGE</Text>
          <Text style={styles.headerSub}>Day 12/30</Text>
        </View>
        <View style={styles.iconBtn}>
          <Ionicons name="moon-outline" size={20} color={LifeMonkColors.text} />
        </View>
      </View>

      <View style={styles.progressWrap}>
        <Text style={styles.progressLabel}>Current Session</Text>
        <Text style={styles.progressCount}>{currentIndex + 1} / {words.length} words</Text>
      </View>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>

      <View style={styles.cardWrap}>
        <View style={styles.card}>
          <View style={styles.accentRow}>
            {(['US', 'UK'] as const).map((acc) => (
              <Pressable
                key={acc}
                onPress={() => setAccent(acc)}
                style={[styles.accentBtn, accent === acc && styles.accentBtnActive]}
              >
                <Text style={[styles.accentText, accent === acc && styles.accentTextActive]}>{acc}</Text>
              </Pressable>
            ))}
          </View>

          {!showDefinition ? (
            <>
              <Text style={styles.wordText}>{word.word}</Text>
              <Text style={styles.phonetic}>{word.phonetic}</Text>
              <Pressable onPress={() => setShowDefinition(true)} style={styles.seeDefBtn}>
                <Text style={styles.seeDefText}>Tap to see definition</Text>
                <Ionicons name="arrow-forward" size={14} color={ACCENT_COLOR} />
              </Pressable>
              <Pressable style={styles.speakBtn}>
                <Ionicons name="volume-high" size={28} color={ACCENT_COLOR} />
              </Pressable>
            </>
          ) : (
            <>
              <View style={styles.defIconWrap}>
                <Ionicons name="book-outline" size={24} color={ACCENT_COLOR} />
              </View>
              <Text style={styles.defText}>{word.definition}</Text>
              <Pressable onPress={() => setShowDefinition(false)}>
                <Text style={styles.backToWord}>Tap to go back</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 24 }]}>
        <Pressable onPress={() => setShowStudyMore(true)} style={styles.studyMoreBtn}>
          <View style={styles.studyMoreIcon}>
            <Ionicons name="refresh" size={20} color="#FFD93D" />
          </View>
          <Text style={styles.studyMoreText}>Study more</Text>
        </Pressable>
        <Pressable onPress={nextWord} style={styles.knowBtn}>
          <View style={styles.knowIcon}>
            <Ionicons name="checkmark" size={20} color="#FFF" />
          </View>
          <Text style={styles.knowText}>I know this</Text>
        </Pressable>
      </View>

      <Modal visible={showStudyMore} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { paddingTop: insets.top + 16 }]}>
          <Pressable style={styles.modalClose} onPress={() => setShowStudyMore(false)}>
            <Ionicons name="close" size={22} color={LifeMonkColors.text} />
          </Pressable>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.modalLabel}>Detailed Study</Text>
            <Text style={styles.modalWord}>{word.word}</Text>
            <Text style={styles.modalPhonetic}>{word.phonetic}</Text>
            <Text style={styles.modalSectionTitle}>The Meaning</Text>
            <Text style={styles.modalBody}>{word.detailedMeaning}</Text>
            <Text style={styles.modalSectionTitle}>Example Sentences</Text>
            {word.sentences.map((s, idx) => (
              <View key={idx} style={styles.sentenceCard}>
                <Text style={styles.sentenceText}>"{s}"</Text>
              </View>
            ))}
          </ScrollView>
          <Pressable onPress={() => setShowStudyMore(false)} style={styles.modalDoneBtn}>
            <Text style={styles.modalDoneText}>Got it! Back to session</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LifeMonkSpacing.contentPadding,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' },
  headerCenter: { alignItems: 'center' },
  headerLabel: { fontSize: 10, fontWeight: '800', color: LifeMonkColors.textMuted, letterSpacing: 2 },
  headerSub: { fontSize: 14, fontWeight: '800', color: LifeMonkColors.text },
  progressWrap: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, marginTop: 24, paddingHorizontal: 40 },
  progressLabel: { fontSize: 12, fontWeight: '800', color: 'rgba(0,0,0,0.3)' },
  progressCount: { fontSize: 14, fontWeight: '800', color: ACCENT_COLOR },
  progressBar: { height: 6, backgroundColor: 'rgba(93,109,255,0.1)', marginHorizontal: 40, marginTop: 12, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: ACCENT_COLOR, borderRadius: 3 },
  cardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFF',
    borderRadius: 60,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 380,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.01)',
  },
  accentRow: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.03)', padding: 4, borderRadius: 999 },
  accentBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  accentBtnActive: { backgroundColor: ACCENT_COLOR },
  accentText: { fontSize: 10, fontWeight: '800', color: 'rgba(0,0,0,0.3)' },
  accentTextActive: { color: '#FFF' },
  wordText: { fontSize: 44, fontWeight: '800', color: LifeMonkColors.text, marginBottom: 8 },
  phonetic: { fontSize: 16, color: LifeMonkColors.textMuted, marginBottom: 48, fontFamily: 'monospace' },
  seeDefBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  seeDefText: { fontSize: 13, fontWeight: '800', color: ACCENT_COLOR },
  speakBtn: { position: 'absolute', bottom: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#FFF' },
  defIconWrap: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(93,109,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  defText: { fontSize: 20, fontWeight: '700', color: LifeMonkColors.text, textAlign: 'center', paddingHorizontal: 16 },
  backToWord: { marginTop: 24, fontSize: 11, fontWeight: '800', color: 'rgba(0,0,0,0.2)', letterSpacing: 2 },
  footer: { flexDirection: 'row', gap: 16, paddingHorizontal: 24, paddingTop: 16 },
  studyMoreBtn: { flex: 1, height: 80, backgroundColor: '#FFF', borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.02)' },
  studyMoreIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,217,61,0.2)', alignItems: 'center', justifyContent: 'center' },
  studyMoreText: { fontSize: 15, fontWeight: '800', color: LifeMonkColors.text },
  knowBtn: { flex: 1, height: 80, backgroundColor: ACCENT_COLOR, borderRadius: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  knowIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  knowText: { fontSize: 15, fontWeight: '800', color: '#FFF' },
  modalContainer: { flex: 1, backgroundColor: '#FFF' },
  modalClose: { position: 'absolute', top: 16, right: 24, zIndex: 10, width: 40, height: 40, borderRadius: 20, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' },
  modalScroll: { flex: 1 },
  modalScrollContent: { padding: 40, paddingTop: 48, paddingBottom: 24 },
  modalLabel: { fontSize: 12, fontWeight: '800', color: ACCENT_COLOR, letterSpacing: 2, marginBottom: 16 },
  modalWord: { fontSize: 40, fontWeight: '800', color: LifeMonkColors.text, marginBottom: 8 },
  modalPhonetic: { fontSize: 16, color: LifeMonkColors.textMuted, marginBottom: 24, fontFamily: 'monospace' },
  modalSectionTitle: { fontSize: 14, fontWeight: '800', color: 'rgba(0,0,0,0.3)', letterSpacing: 1, marginBottom: 12, marginTop: 24 },
  modalBody: { fontSize: 18, fontWeight: '700', color: LifeMonkColors.text, lineHeight: 26 },
  sentenceCard: { backgroundColor: '#F0F4FF', padding: 20, borderRadius: 24, marginTop: 12, borderLeftWidth: 4, borderLeftColor: ACCENT_COLOR },
  sentenceText: { fontSize: 16, fontWeight: '700', color: LifeMonkColors.text, fontStyle: 'italic' },
  modalDoneBtn: { margin: 24, height: 56, backgroundColor: '#111', borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  modalDoneText: { fontSize: 16, fontWeight: '800', color: '#FFF' },
});
