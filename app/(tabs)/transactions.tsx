import { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, AppState, Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import { supabase } from "../../lib/supabase";

const CATEGORY_OPTIONS = [
  "Food",
  "Groceries",
  "Health",
  "Utilities & Bills",
  "Transport",
  "Rent",
  "Entertainment",
  "Shopping",
  "Investments",
  "Income",
  "Other"
];

export default function Transactions() {

  const [transactions, setTransactions] = useState([]);

useEffect(() => {
  let interval

  const startPolling = async () => {
    await loadTransactions()
    interval = setInterval(() => {
      loadTransactions()
    }, 5000)
  }

  const stopPolling = () => {
    if (interval) clearInterval(interval)
  }

  const subscription = AppState.addEventListener("change", state => {
    if (state === "active") {
      startPolling()
    } else {
      stopPolling()
    }
  })

  startPolling()

  return () => {
    stopPolling()
    subscription.remove()
  }
}, [])

  async function loadTransactions() {

    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    setTransactions(data || []);
  }

  async function updateCategory(transactionId, newCategory) {

    const transaction = transactions.find(t => t.id === transactionId);

    await supabase
      .from("transactions")
      .update({ category: newCategory })
      .eq("id", transactionId);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (transaction?.description && user) {

      await supabase
        .from("user_merchant_rules")
        .upsert({
          user_id: user.id,
          merchant: transaction.description,
          category: newCategory
        }, {
          onConflict: "user_id,merchant"
        });

    }

    setTransactions(prev =>
      prev.map(t =>
        t.id === transactionId ? { ...t, category: newCategory } : t
      )
    );
  }

  function openCategorySelector(transactionId) {

    const options = CATEGORY_OPTIONS.map(cat => ({
      text: cat,
      onPress: () => updateCategory(transactionId, cat)
    }));

    options.push({ text: "Cancel", style: "cancel" });

    Alert.alert("Select Category", "", options);
  }

  async function downloadOlderTransactions() {

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const older = transactions.filter(t => {

      const d = new Date(t.created_at);

      return (
        d.toDateString() !== today.toDateString() &&
        d.toDateString() !== yesterday.toDateString()
      );

    });

    if (older.length === 0) {
      Alert.alert("No older transactions available");
      return;
    }

    const header = "Date,Merchant,Amount,Type,Category\n";

    const rows = older
      .map(
        (t) =>
          `${t.created_at},${t.description},${t.amount},${t.type},${t.category}`
      )
      .join("\n");

    const csv = header + rows;

    const fileUri = FileSystem.documentDirectory + "transactions.csv";

    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8
    });

    await Sharing.shareAsync(fileUri);
  }

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const todayTx = transactions.filter(
    t => new Date(t.created_at).toDateString() === today.toDateString()
  );

  const yesterdayTx = transactions.filter(
    t => new Date(t.created_at).toDateString() === yesterday.toDateString()
  );

const combined = transactions.map(t => {

  const d = new Date(t.created_at);

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  let label;

  if (d.toDateString() === today.toDateString()) {
    label = "Today";
  }
  else if (d.toDateString() === yesterday.toDateString()) {
    label = "Yesterday";
  }
  else {
    label = d.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric"
    });
  }

  return {
    ...t,
    group: label
  };

});
combined.sort(
  (a, b) => new Date(b.created_at) - new Date(a.created_at)
);

  function renderItem({ item, index }) {

    const showHeader =
      index === 0 || combined[index - 1].group !== item.group;

    const time = new Date(item.created_at).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    return (

      <View>

        {showHeader && (
          <Text style={styles.dateHeader}>
            {item.group}
          </Text>
        )}

        <View style={styles.card}>

          <View style={styles.left}>

            <View style={styles.icon}>
              <Text>💳</Text>
            </View>

            <View>

              <Text style={styles.merchant}>
                {item.description}
              </Text>

              <View style={styles.tags}>

                <TouchableOpacity
                  onPress={() => openCategorySelector(item.id)}
                >
                  <Text style={styles.category}>
                    {item.category || item.type}
                  </Text>
                </TouchableOpacity>

                <Text style={styles.completed}>
                  completed
                </Text>

              </View>

            </View>

          </View>

          <View style={styles.right}>

            <Text
              style={[
                styles.amount,
                item.type === "debit"
                  ? styles.debit
                  : styles.credit
              ]}
            >
              {item.type === "debit" ? "-" : "+"}₹{item.amount}
            </Text>

            <Text style={styles.time}>
              {time}
            </Text>

          </View>

        </View>

      </View>
    );
  }

  function renderHeader() {

    return (

      <View style={styles.categoryGrid}>

        {CATEGORY_OPTIONS.slice(0, 8).map((cat, index) => {

          const count = transactions.filter(
            (t) => t.category === cat
          ).length;

          const colors = [
            "#3b82f6",
            "#8b5cf6",
            "#f97316",
            "#eab308",
            "#22c55e",
            "#6366f1",
            "#ec4899",
            "#a855f7"
          ];

          return (

            <View
              key={cat}
              style={[
                styles.categoryCard,
                { backgroundColor: colors[index] }
              ]}
            >

              <Text style={styles.categoryName}>
                {cat}
              </Text>

              <Text style={styles.categoryCount}>
                {count}
              </Text>

            </View>

          );

        })}

      </View>

    );
  }

  return (

    <View style={styles.container}>

      <FlatList
        data={combined}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
      />

      <TouchableOpacity
        style={styles.downloadBtn}
        onPress={downloadOlderTransactions}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>
          Download older transactions
        </Text>
      </TouchableOpacity>

    </View>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 16,
    paddingTop: 50
  },

  dateHeader: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16
  },

  categoryCard: {
    width: "23%",
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center"
  },

  categoryName: {
    color: "white",
    fontSize: 11
  },

  categoryCount: {
    color: "white",
    fontSize: 14,
    fontWeight: "600"
  },

  card: {
    backgroundColor: "#0f172a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },

  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },

  icon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#1e293b",
    alignItems: "center",
    justifyContent: "center"
  },

  merchant: {
    color: "white",
    fontWeight: "600",
    fontSize: 14
  },

  tags: {
    flexDirection: "row",
    gap: 6,
    marginTop: 3,
    alignItems: "center"
  },

  category: {
    backgroundColor: "#1e40af",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 10,
    color: "white"
  },

  completed: {
    backgroundColor: "#065f46",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 10,
    color: "white"
  },

  right: {
    alignItems: "flex-end"
  },

  amount: {
    fontSize: 14,
    fontWeight: "600"
  },

  debit: {
    color: "#ef4444"
  },

  credit: {
    color: "#22c55e"
  },

  time: {
    fontSize: 10,
    color: "#94a3b8"
  },

  downloadBtn: {
    backgroundColor: "#334155",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center"
  }

});