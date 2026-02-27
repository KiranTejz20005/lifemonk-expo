import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { LifeMonkColors, LifeMonkSpacing } from '@/constants/lifemonk-theme';

interface Project {
  id: number;
  title: string;
  description: string;
  tech: string[];
  image: string;
}

export function ProjectsScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 1,
      title: 'E-Commerce Nebula',
      description: 'A high-performance online store built with Next.js 14 and Stripe integration.',
      tech: ['React', 'Next.js', 'Tailwind'],
      image: 'https://images.unsplash.com/photo-1557821552-17105176677c?auto=format&fit=crop&q=80&w=400',
    },
    {
      id: 2,
      title: 'DevSocial Connect',
      description: 'Developer-focused social network with real-time chat and job boards.',
      tech: ['Typescript', 'Node.js', 'Socket.io'],
      image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=400',
    },
  ]);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleAddProject = () => {
    if (!newTitle.trim()) return;
    const newProject: Project = {
      id: Date.now(),
      title: newTitle,
      description: newDesc,
      tech: ['Custom'],
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=400',
    };
    setProjects([newProject, ...projects]);
    setNewTitle('');
    setNewDesc('');
    setIsAdding(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={20} color={LifeMonkColors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>My Projects</Text>
        <Pressable onPress={() => setIsAdding(true)} style={styles.addBtn}>
          <Ionicons name="add" size={20} color="#FFF" />
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {projects.map((project) => (
          <View key={project.id} style={styles.card}>
            <View style={styles.cardImageWrap}>
              <Image source={{ uri: project.image }} style={styles.cardImage} />
              <View style={styles.cardBadge}>
                <Ionicons name="open-outline" size={16} color={LifeMonkColors.accentPrimary} />
              </View>
            </View>
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
              <Ionicons name="code-slash" size={20} color={LifeMonkColors.accentPrimary} />
              <Text style={styles.cardTitle}>{project.title}</Text>
            </View>
              <Text style={styles.cardDesc}>{project.description}</Text>
              <View style={styles.techRow}>
                {project.tech.map((t) => (
                  <View key={t} style={styles.techPill}>
                    <Text style={styles.techText}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal visible={isAdding} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setIsAdding(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Project</Text>
              <Pressable onPress={() => setIsAdding(false)}>
                <Ionicons name="close" size={18} color={LifeMonkColors.textMuted} />
              </Pressable>
            </View>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Project Title"
              style={styles.input}
              placeholderTextColor={LifeMonkColors.textMuted}
            />
            <TextInput
              value={newDesc}
              onChangeText={setNewDesc}
              placeholder="Description"
              style={[styles.input, styles.textArea]}
              placeholderTextColor={LifeMonkColors.textMuted}
              multiline
              numberOfLines={4}
            />
            <Button variant="primary" onPress={handleAddProject} style={styles.publishBtn}>
              PUBLISH PROJECT
            </Button>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: LifeMonkSpacing.contentPadding,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: LifeMonkColors.text },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: LifeMonkColors.accentPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: LifeMonkSpacing.contentPadding, paddingBottom: 40, gap: 24 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  cardImageWrap: { height: 176, position: 'relative' },
  cardImage: { width: '100%', height: '100%' },
  cardBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 8,
    borderRadius: 12,
  },
  cardBody: { padding: 24 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: '800', color: LifeMonkColors.text, flex: 1 },
  cardDesc: { fontSize: 14, color: LifeMonkColors.textSecondary, marginBottom: 16 },
  techRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  techPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  techText: { fontSize: 10, fontWeight: '800', color: LifeMonkColors.textMuted, letterSpacing: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 32,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(110,68,255,0.2)',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 12, fontWeight: '800', color: LifeMonkColors.text, letterSpacing: 1 },
  input: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    color: LifeMonkColors.text,
  },
  textArea: { height: 96, textAlignVertical: 'top' },
  publishBtn: { marginTop: 8 },
});
