import { createHomeStyles } from "@/assets/styles/home.styles";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import TodoInput from "@/components/TodoInput";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import useTheme, { ColorScheme } from "@/hooks/useTheme";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Todos Screen Component (for logged in users)
import { GenericId } from "convex/values";

type Todo = Doc<"todos">;

export default function MainScreen() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { colors } = useTheme();

  // Show loading while auth is being determined
  if (!isLoaded) {
    return <LoadingSpinner />;
  }

  // Show appropriate screen based on auth state
  if (isSignedIn && user) {
    return <TodosScreen user={user} colors={colors} />;
  } else {
    return <HomeScreen colors={colors} />;
  }
}

function TodosScreen({ user, colors }: { user: any; colors: ColorScheme }) {
  const [editingId, setEditingId] = useState<Id<"todos"> | null>(null);
  const [editText, setEditText] = useState("");
  const homeStyles = createHomeStyles(colors);

  const todos = useQuery(api.todos.getTodos, { userId: user.id });
  const toggleTodo = useMutation(api.todos.toggleTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);
  const updateTodo = useMutation(api.todos.updateTodo);

  const isLoading = todos === undefined;

  if (isLoading) return <LoadingSpinner />;

  interface HandleToggleTodo {
    (id: Id<"todos">): Promise<void>;
  }

  const handleToggleTodo: HandleToggleTodo = async (id) => {
    try {
      await toggleTodo({ id });
    } catch (error) {
      console.log("Error toggling todo", error);
      Alert.alert("Error", "Failed to toggle todo");
    }
  };

  interface HandleDeleteTodo {
    (id: Id<"todos">): Promise<void>;
  }

  const handleDeleteTodo: HandleDeleteTodo = async (id) => {
    Alert.alert("Delete Todo", "Are you sure you want to delete this todo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteTodo({ id }),
      },
    ]);
  };

  const handleEditTodo = (todo: {
    _id: GenericId<"todos">;
    _creationTime: number;
    text: string;
    userId: string;
    isCompleted: boolean;
  }) => {
    setEditText(todo.text);
    setEditingId(todo._id);
  };

  const handleSaveEdit = async () => {
    if (editingId) {
      try {
        await updateTodo({ id: editingId, text: editText.trim() });
        setEditingId(null);
        setEditText("");
      } catch (error) {
        console.log("Error updating todo", error);
        Alert.alert("Error", "Failed to update todo");
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const renderTodoItem = ({ item }: { item: Todo }) => {
    const isEditing = editingId === item._id;
    return (
      <View style={homeStyles.todoItemWrapper}>
        <LinearGradient
          colors={colors.gradients.surface}
          style={homeStyles.todoItem}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <TouchableOpacity
            style={homeStyles.checkbox}
            activeOpacity={0.7}
            onPress={() => handleToggleTodo(item._id)}
          >
            <LinearGradient
              colors={
                item.isCompleted
                  ? colors.gradients.success
                  : colors.gradients.muted
              }
              style={[
                homeStyles.checkboxInner,
                {
                  borderColor: item.isCompleted ? "transparent" : colors.border,
                },
              ]}
            >
              {item.isCompleted && (
                <Ionicons name="checkmark" size={18} color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {isEditing ? (
            <View style={homeStyles.editContainer}>
              <TextInput
                style={homeStyles.editInput}
                value={editText}
                onChangeText={setEditText}
                autoFocus
                multiline
                placeholder="Edit your todo..."
                placeholderTextColor={colors.textMuted}
              />
              <View style={homeStyles.editButtons}>
                <TouchableOpacity onPress={handleSaveEdit} activeOpacity={0.8}>
                  <LinearGradient
                    colors={colors.gradients.success}
                    style={homeStyles.editButton}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={homeStyles.editButtonText}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCancelEdit}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={colors.gradients.muted}
                    style={homeStyles.editButton}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                    <Text style={homeStyles.editButtonText}>Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={homeStyles.todoTextContainer}>
              <Text
                style={[
                  homeStyles.todoText,
                  item.isCompleted && {
                    textDecorationLine: "line-through",
                    color: colors.textMuted,
                    opacity: 0.6,
                  },
                ]}
              >
                {item.text}
              </Text>

              <View style={homeStyles.todoActions}>
                <TouchableOpacity
                  onPress={() => handleEditTodo(item)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={colors.gradients.warning}
                    style={homeStyles.actionButton}
                  >
                    <Ionicons name="pencil" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteTodo(item._id)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={colors.gradients.danger}
                    style={homeStyles.actionButton}
                  >
                    <Ionicons name="trash" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={colors.gradients.background}
      style={homeStyles.container}
    >
      <StatusBar barStyle={colors.statusBarStyle} />
      <SafeAreaView style={homeStyles.safeArea}>
        <Header />
        <TodoInput />
        <FlatList
          data={todos}
          renderItem={renderTodoItem}
          keyExtractor={(item) => item._id}
          style={homeStyles.todoList}
          contentContainerStyle={homeStyles.todoListContent}
          ListEmptyComponent={<EmptyState />}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

// Home Screen Component (for non-logged in users)
function HomeScreen({ colors }: { colors: ColorScheme }) {
  const handleSignInPress = () => {
    router.push("/sign-in");
  };

  return (
    <ScrollView
      style={[homeScreenStyles.container, { backgroundColor: colors.bg }]}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle={colors.statusBarStyle} />

      {/* Hero Section */}
      <LinearGradient
        colors={colors.gradients.primary}
        style={homeScreenStyles.heroSection}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView>
          <View style={homeScreenStyles.heroContent}>
            <View style={homeScreenStyles.logoContainer}>
              <View
                style={[
                  homeScreenStyles.logoCircle,
                  { backgroundColor: "rgba(255,255,255,0.2)" },
                ]}
              >
                <Ionicons name="checkmark-done" size={40} color="white" />
              </View>
            </View>

            <Text style={homeScreenStyles.heroTitle}>TodoMaster</Text>
            <Text style={homeScreenStyles.heroSubtitle}>
              Your personal productivity companion
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Stats Section */}
      <View
        style={[
          homeScreenStyles.statsSection,
          { backgroundColor: colors.surface },
        ]}
      >
        <Text style={[homeScreenStyles.sectionTitle, { color: colors.text }]}>
          Join thousands of productive users
        </Text>

        <View style={homeScreenStyles.statsContainer}>
          <View style={homeScreenStyles.statItem}>
            <Text
              style={[homeScreenStyles.statNumber, { color: colors.primary }]}
            >
              10K+
            </Text>
            <Text
              style={[homeScreenStyles.statLabel, { color: colors.textMuted }]}
            >
              Active Users
            </Text>
          </View>

          <View
            style={[
              homeScreenStyles.statDivider,
              { backgroundColor: colors.border },
            ]}
          />

          <View style={homeScreenStyles.statItem}>
            <Text
              style={[homeScreenStyles.statNumber, { color: colors.success }]}
            >
              1M+
            </Text>
            <Text
              style={[homeScreenStyles.statLabel, { color: colors.textMuted }]}
            >
              Tasks Completed
            </Text>
          </View>

          <View
            style={[
              homeScreenStyles.statDivider,
              { backgroundColor: colors.border },
            ]}
          />

          <View style={homeScreenStyles.statItem}>
            <Text
              style={[homeScreenStyles.statNumber, { color: colors.warning }]}
            >
              99.9%
            </Text>
            <Text
              style={[homeScreenStyles.statLabel, { color: colors.textMuted }]}
            >
              Uptime
            </Text>
          </View>
        </View>
      </View>

      {/* CTA Section */}
      <View style={homeScreenStyles.ctaSection}>
        <View
          style={[
            homeScreenStyles.ctaCard,
            { backgroundColor: colors.surface },
          ]}
        >
          <Ionicons name="rocket" size={32} color={colors.primary} />
          <Text style={[homeScreenStyles.ctaTitle, { color: colors.text }]}>
            Ready to boost your productivity?
          </Text>
          <Text
            style={[
              homeScreenStyles.ctaDescription,
              { color: colors.textMuted },
            ]}
          >
            Sign in now and start organizing your life like never before
          </Text>

          <TouchableOpacity
            style={[
              homeScreenStyles.signInButton,
              { backgroundColor: colors.primary },
            ]}
            onPress={handleSignInPress}
            activeOpacity={0.8}
          >
            <Ionicons name="log-in" size={20} color="white" />
            <Text style={homeScreenStyles.signInText}>Sign In Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Home Screen Styles
const homeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heroSection: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  heroContent: {
    alignItems: "center",
    paddingTop: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 18,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
  statsSection: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 32,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
  ctaSection: {
    padding: 20,
    paddingBottom: 40,
  },
  ctaCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  signInButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  signInText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 8,
  },
});
