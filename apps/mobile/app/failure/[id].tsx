import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { useApp } from "../../src/session/AppContext";
import { colors } from "../../src/ui/theme";

const reasons = [
  "Cliente ausente",
  "Endereço não localizado",
  "Endereço incorreto",
  "Estabelecimento fechado",
  "Recusa do recebimento",
  "Material divergente",
  "Material avariado",
  "Falta de documentação",
  "Veículo com problema",
  "Área de risco",
  "Falta de tempo na rota",
  "Outros",
] as const;

export default function FailureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activities, advance } = useApp();
  const activity = activities.find((item) => item.id === id);
  const [reason, setReason] = useState<string>();
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string>();

  async function submit() {
    if (!reason) {
      setError("Selecione o motivo do insucesso.");
      return;
    }
    if (reason === "Outros" && !comment.trim()) {
      setError("Descreva o motivo quando selecionar Outros.");
      return;
    }
    await advance(id, "failed", { reason, comment: comment.trim() });
    router.replace(`/activity/${id}`);
  }

  if (!activity)
    return <Text style={styles.missing}>Atividade não encontrada.</Text>;

  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: "Registrar insucesso" }} />
      <Text style={styles.title}>Por que a operação não foi concluída?</Text>
      <Text style={styles.copy}>
        {activity.code} · {activity.customer}. O registro ficará disponível
        offline e será confirmado na próxima sincronização.
      </Text>
      {reasons.map((item) => (
        <Pressable
          key={item}
          accessibilityRole="radio"
          accessibilityState={{ checked: reason === item }}
          style={[styles.reason, reason === item && styles.reasonSelected]}
          onPress={() => {
            setReason(item);
            setError(undefined);
          }}
        >
          <Text
            style={[
              styles.reasonText,
              reason === item && styles.reasonTextSelected,
            ]}
          >
            {item}
          </Text>
        </Pressable>
      ))}
      <Text style={styles.label}>Observação</Text>
      <TextInput
        multiline
        value={comment}
        onChangeText={setComment}
        placeholder="Inclua detalhes úteis para a central de operações"
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.submit} onPress={submit}>
        <Text style={styles.submitText}>Salvar insucesso</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 45 },
  missing: { margin: 30, color: colors.muted },
  title: { color: colors.ink, fontSize: 27, fontWeight: "800" },
  copy: {
    color: colors.muted,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },
  reason: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    padding: 14,
  },
  reasonSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  reasonText: { color: colors.ink, fontWeight: "600" },
  reasonTextSelected: { color: colors.primary, fontWeight: "800" },
  label: {
    color: colors.ink,
    fontWeight: "700",
    marginBottom: 7,
    marginTop: 14,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 110,
    padding: 14,
    textAlignVertical: "top",
  },
  error: { color: colors.danger, marginTop: 10 },
  submit: {
    alignItems: "center",
    backgroundColor: colors.danger,
    borderRadius: 13,
    marginTop: 18,
    padding: 16,
  },
  submitText: { color: colors.surface, fontWeight: "800" },
});
