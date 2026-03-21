import { Tabs, router } from "expo-router"
import { Ionicons } from "@expo/vector-icons"
import { supabase } from "../../lib/supabase"
import { TouchableOpacity } from "react-native"

export default function TabsLayout() {

  async function logout() {

    await supabase.auth.signOut()

    router.replace("/")

  }

  return (

    <Tabs
      screenOptions={{
        headerStyle: {
          backgroundColor: "#020617"
        },
        headerTintColor: "white",
        tabBarStyle: {
          backgroundColor: "#020617"
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#94a3b8",

        headerRight: () => (

          <TouchableOpacity
            onPress={logout}
            style={{ marginRight: 15 }}
          >

            <Ionicons
              name="log-out-outline"
              size={22}
              color="white"
            />

          </TouchableOpacity>

        )

      }}

    >

      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          )
        }}
      />



      <Tabs.Screen
        name="subscriptions"
        options={{
          title: "Subscriptions",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="repeat-outline" size={size} color={color} />
          )
        }}
      />
	        <Tabs.Screen
        name="transactions"
        options={{
          title: "Transactions",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card-outline" size={size} color={color} />
          )
        }}
      />

    </Tabs>

  )

}