import { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { supabase } from "../../lib/supabase";
import { Picker } from "@react-native-picker/picker";

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
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  async function loadTransactions() {

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const { data: txns } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: rules } = await supabase
      .from("user_merchant_rules")
      .select("*")
      .eq("user_id", user.id);

    const ruleMap = {};

    rules?.forEach((r) => {
      ruleMap[r.merchant.toLowerCase()] = r.category;
    });

    const updatedTransactions = txns.map((t) => {

      const merchant = t.description?.toLowerCase();

      if (ruleMap[merchant]) {
        return { ...t, category: ruleMap[merchant] };
      }

      return t;
    });

    setTransactions(updatedTransactions || []);
  }

  async function updateCategory(transactionId, newCategory) {

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    const transaction = transactions.find(t => t.id === transactionId);

    await supabase
      .from("transactions")
      .update({ category: newCategory })
      .eq("id", transactionId);

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

    setEditingCategoryId(null);
  }

  function renderTransaction(item) {

    const time = new Date(item.created_at).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });

    return (

      <View key={item.id} style={styles.card}>

        <View style={styles.left}>

          <View style={styles.icon}>
            <Text>💳</Text>
          </View>

          <View>

            <Text style={styles.merchant}>
              {item.description}
            </Text>

            <View style={styles.tags}>

              {editingCategoryId === item.id ? (

                <Picker
                  selectedValue={item.category}
                  style={{ width: 150, color: "white" }}
                  dropdownIconColor="white"
                  onValueChange={(value) =>
                    updateCategory(item.id, value)
                  }
                >
                  {CATEGORY_OPTIONS.map(cat => (
                    <Picker.Item key={cat} label={cat} value={cat} />
                  ))}
                </Picker>

              ) : (

                <TouchableOpacity
                  onPress={() => setEditingCategoryId(item.id)}
                >
                  <Text style={styles.category}>
                    {item.category || item.type}
                  </Text>
                </TouchableOpacity>

              )}

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

    );
  }

  const sortedTransactions = [...transactions]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const groups = {};

  sortedTransactions.forEach((t) => {

    const d = new Date(t.created_at);

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let label;

    if (d.toDateString() === today.toDateString()) {
      label = "Today";
    } else if (d.toDateString() === yesterday.toDateString()) {
      label = "Yesterday";
    } else {
      label = d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric"
      });
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(t);

  });

  return (

    <ScrollView style={styles.container}>

      {/* CATEGORY SUMMARY */}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>

        {CATEGORY_OPTIONS.map((cat, index) => {

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
            "#a855f7",
            "#10b981"
          ];

          return (

            <View
              key={cat}
              style={[
                styles.categoryCard,
                { backgroundColor: colors[index % colors.length] }
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

      </ScrollView>

      {/* GROUPED TRANSACTIONS */}

      {Object.entries(groups).map(([label, txns]) => (

        <View key={label}>

          <Text style={styles.dateHeader}>
            {label}
          </Text>

          {txns.map((t) => renderTransaction(t))}

        </View>

      ))}

    </ScrollView>

  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 16,
  },

  dateHeader: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4
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

  categoryCard: {
    minWidth: 90,
    padding: 10,
    borderRadius: 10,
    marginRight: 8,
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
  }

});