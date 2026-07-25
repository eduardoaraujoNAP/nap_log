import { router, Stack } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { statusLabel } from "../src/domain/activity";
import { useApp } from "../src/session/AppContext";
import { colors } from "../src/ui/theme";

export default function Journey() {
  const {
    activities,
    journeyActive,
    locationPermission,
    toggleJourney,
    pending,
    syncing,
    conflicts,
    syncError,
    synchronize,
    logout,
  } = useApp();
  const routeName = activities.find((item) => item.routeName)?.routeName;
  return (
    <View style={styles.page}>
      <Stack.Screen
        options={{
          title: "Minha jornada",
          headerRight: () => (
            <Pressable
              onPress={() => {
                void logout();
                router.replace("/login");
              }}
            >
              <Text style={styles.link}>Sair</Text>
            </Pressable>
          ),
        }}
      />
      <View style={styles.hero}>
        <View>
          <Text style={styles.eyebrow}>
            {routeName?.toUpperCase() ?? "ROTA NÃO PUBLICADA"}
          </Text>
          <Text style={styles.title}>
            {journeyActive
              ? "Jornada em andamento"
              : routeName
                ? "Pronto para iniciar?"
                : "Aguardando planejamento"}
          </Text>
        </View>
        <Text style={styles.metric}>
          {activities.length}
          <Text style={styles.metricLabel}> paradas</Text>
        </Text>
      </View>
      <Pressable
        disabled={!routeName}
        style={[
          styles.journeyButton,
          journeyActive && styles.stopButton,
          !routeName && styles.disabledButton,
        ]}
        onPress={toggleJourney}
      >
        <Text style={styles.buttonText}>
          {journeyActive ? "Encerrar jornada" : "Iniciar jornada"}
        </Text>
      </Pressable>
      <View style={styles.sync}>
        <View style={styles.dot} />
        <Text style={[styles.syncText, { flex: 1 }]}>
          {locationPermission.includes("denied")
            ? "Localização não autorizada"
            : syncError
              ? syncError
              : conflicts
                ? String(conflicts) + " conflito(s) precisam de revisão"
                : pending
                  ? String(pending) + " alteração(ões) pendentes"
                  : "Tudo sincronizado"}
        </Text>
        <Pressable onPress={synchronize}>
          <Text style={styles.link}>
            {syncing ? "Sincronizando…" : "Sincronizar"}
          </Text>
        </Pressable>
      </View>
      <Text style={styles.section}>ROTEIRO DE HOJE</Text>
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 30 }}
        renderItem={({ item, index }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/activity/${item.id}`)}
          >
            <View style={styles.order}>
              <Text style={styles.orderText}>{index + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Text style={styles.code}>{item.code}</Text>
                <Text style={styles.badge}>{statusLabel[item.status]}</Text>
              </View>
              <Text style={styles.customer}>{item.customer}</Text>
              <Text style={styles.address}>{item.address}</Text>
              <Text style={styles.window}>
                {item.kind} · {item.window}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 18 },
  link: { color: colors.primary, fontWeight: "700" },
  hero: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 22,
  },
  eyebrow: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  title: { fontSize: 24, color: colors.ink, fontWeight: "800", marginTop: 6 },
  metric: { color: colors.primary, fontSize: 25, fontWeight: "800" },
  metricLabel: { fontSize: 13, color: colors.muted, fontWeight: "500" },
  journeyButton: {
    marginTop: 18,
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
  },
  stopButton: { backgroundColor: colors.ink },
  disabledButton: { opacity: 0.45 },
  buttonText: { color: "white", fontWeight: "800" },
  sync: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 16,
    backgroundColor: colors.primarySoft,
    borderRadius: 10,
    padding: 11,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  syncText: { color: colors.primary, fontSize: 12, fontWeight: "600" },
  section: {
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "800",
    color: colors.muted,
    marginBottom: 10,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    padding: 16,
    marginBottom: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  order: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  orderText: { color: colors.primary, fontWeight: "800" },
  row: { flexDirection: "row", justifyContent: "space-between" },
  code: { fontSize: 11, fontWeight: "800", color: colors.muted },
  badge: { fontSize: 10, fontWeight: "700", color: colors.primary },
  customer: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    marginTop: 5,
  },
  address: { color: colors.muted, marginTop: 4, fontSize: 13 },
  window: { color: colors.ink, marginTop: 10, fontWeight: "600", fontSize: 12 },
});
