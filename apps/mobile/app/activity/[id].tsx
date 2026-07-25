import { router, Stack, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ActivityStatus } from "../../src/domain/activity";
import { statusLabel } from "../../src/domain/activity";
import { useApp } from "../../src/session/AppContext";
import { colors } from "../../src/ui/theme";

const next: Partial<
  Record<ActivityStatus, { status: ActivityStatus; label: string }>
> = {
  assigned: { status: "accepted", label: "Aceitar atividade" },
  accepted: { status: "en_route", label: "Iniciar deslocamento" },
  en_route: { status: "on_site", label: "Confirmar chegada" },
  on_site: { status: "in_service", label: "Iniciar atendimento" },
  in_service: { status: "completed", label: "Coletar evidências" },
};
export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activities, advance, syncError } = useApp();
  const item = activities.find((activity) => activity.id === id);
  if (!item)
    return (
      <View style={styles.center}>
        <Text>Atividade não encontrada.</Text>
      </View>
    );
  const action = next[item.status];
  return (
    <ScrollView contentContainerStyle={styles.page}>
      <Stack.Screen options={{ title: item.code }} />
      <Text style={styles.eyebrow}>
        {item.kind.toUpperCase()} · {item.window}
      </Text>
      <Text style={styles.title}>{item.customer}</Text>
      <Text style={styles.status}>{statusLabel[item.status]}</Text>
      <View style={styles.card}>
        <Text style={styles.label}>DESTINO</Text>
        <Text style={styles.value}>{item.address}</Text>
        <Pressable style={styles.secondary}>
          <Text style={styles.secondaryText}>Abrir navegação</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>INSTRUÇÕES</Text>
        <Text style={styles.value}>
          {item.notes ?? "Nenhuma instrução adicional."}
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>EVIDÊNCIAS</Text>
        <Text style={styles.muted}>
          Fotos, recebedor e assinatura serão solicitados de acordo com a
          política desta atividade.
        </Text>
      </View>
      {syncError ? <Text style={styles.error}>{syncError}</Text> : null}
      {action && (
        <Pressable
          style={styles.primary}
          onPress={async () => {
            if (action.status === "completed") {
              router.push(`/evidence/${item.id}`);
              return;
            }
            await advance(item.id, action.status);
          }}
        >
          <Text style={styles.primaryText}>{action.label}</Text>
        </Pressable>
      )}
      {!["completed", "failed"].includes(item.status) && (
        <Pressable onPress={() => router.push("/failure/" + item.id)}>
          <Text style={styles.failure}>Registrar insucesso</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { padding: 20, paddingBottom: 45 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  eyebrow: {
    color: colors.muted,
    fontWeight: "800",
    letterSpacing: 1.3,
    fontSize: 11,
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800",
    marginTop: 8,
  },
  status: {
    alignSelf: "flex-start",
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 22,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.muted,
    fontWeight: "800",
    fontSize: 10,
    letterSpacing: 1.4,
    marginBottom: 9,
  },
  value: { color: colors.ink, fontSize: 16, lineHeight: 23 },
  muted: { color: colors.muted, lineHeight: 21 },
  secondary: {
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
  },
  secondaryText: { color: colors.primary, fontWeight: "800" },
  primary: {
    backgroundColor: colors.primary,
    padding: 17,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 14,
  },
  primaryText: { color: "white", fontWeight: "800", fontSize: 16 },
  error: { color: colors.danger, marginBottom: 8, lineHeight: 20 },
  failure: {
    color: colors.danger,
    fontWeight: "700",
    textAlign: "center",
    padding: 18,
  },
});
