import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Recipe, SubscriptionState, AdminSettings } from './src/types';
import {
  getStoredRecipes,
  getSubscriptionState,
  getAdminSettings,
  saveRecipe,
  getFavorites,
  toggleFavorite,
} from './src/utils/storage';
import { extractYouTubeId } from './src/utils/youtube';

import { Header } from './src/components/Header';
import { HomeScreen } from './src/screens/HomeScreen';
import { RecipeDetailScreen } from './src/screens/RecipeDetailScreen';
import { AdminScreen } from './src/screens/AdminScreen';
import { UserActivationModal } from './src/components/UserActivationModal';
import { AdminLoginModal } from './src/components/AdminLoginModal';
import { RecipeFormModal } from './src/components/RecipeFormModal';

export default function App() {
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  // App data state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionState>({
    isSubscribed: false,
    activeCode: null,
    planName: null,
    expiresAt: null,
    isLifetime: false,
    activatedAt: null,
  });
  const [settings, setSettings] = useState<AdminSettings>({
    requireSubscription: true,
    freeRecipesCount: 2,
    supportContact: '+966500000000',
    noticeBanner: 'مرحباً بك في المنصة الشاملة لتركيبات المنظفات الاحترافية',
  });
  const [favorites, setFavorites] = useState<(string | number)[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Navigation & View state
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState<boolean>(false);

  // Admin state
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState<boolean>(false);

  // User Activation Modal
  const [isActivationModalOpen, setIsActivationModalOpen] = useState<boolean>(false);

  // Recipe Add/Edit Modal
  const [isRecipeFormOpen, setIsRecipeFormOpen] = useState<boolean>(false);
  const [recipeToEdit, setRecipeToEdit] = useState<Recipe | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyWithVideo, setOnlyWithVideo] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    try {
      const [storedRecipes, storedSub, storedSettings, storedFavs] = await Promise.all([
        getStoredRecipes(),
        getSubscriptionState(),
        getAdminSettings(),
        getFavorites(),
      ]);

      setRecipes(storedRecipes);
      setSubscription(storedSub);
      setSettings(storedSettings);
      setFavorites(storedFavs);

      // If a recipe was selected, keep it updated with latest version
      if (selectedRecipe) {
        const found = storedRecipes.find(r => String(r.id) === String(selectedRecipe.id));
        if (found) setSelectedRecipe(found);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedRecipe]);

  useEffect(() => {
    loadData();
  }, []);

  // Total recipes with video count
  const totalWithVideoCount = recipes.filter(r => Boolean(extractYouTubeId(r.youtubeUrl))).length;
  const carCareCount = recipes.filter(r => r.mainSection === 'car_care').length;
  const householdCount = recipes.filter(r => r.mainSection === 'household').length;

  // Toggle favorite
  const handleToggleFavorite = async (recipeId: string | number) => {
    const updated = await toggleFavorite(recipeId);
    setFavorites(updated);
  };

  // Recipe edit from detail or home
  const handleEditRecipe = (recipe: Recipe) => {
    setRecipeToEdit(recipe);
    setIsRecipeFormOpen(true);
  };

  const handleSaveRecipeFromModal = async (saved: Recipe) => {
    const updated = await saveRecipe(saved);
    setRecipes(updated);
    setIsRecipeFormOpen(false);
    if (selectedRecipe && String(selectedRecipe.id) === String(saved.id)) {
      setSelectedRecipe(saved);
    }
  };

  // Admin Login success
  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setIsAdminLoginOpen(false);
    setIsAdminPanelOpen(true);
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    setIsAdminPanelOpen(false);
  };

  if (!fontsLoaded || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.mainWrapper}>
        {/* If Admin Panel is Open */}
        {isAdminPanelOpen ? (
          <AdminScreen
            onClose={() => setIsAdminPanelOpen(false)}
            onRefreshData={loadData}
          />
        ) : selectedRecipe ? (
          /* Recipe Detail Screen */
          <RecipeDetailScreen
            recipe={selectedRecipe}
            onBack={() => setSelectedRecipe(null)}
            isAdmin={isAdmin}
            onEditRecipe={handleEditRecipe}
            isFavorite={favorites.some(id => String(id) === String(selectedRecipe.id))}
            onToggleFavorite={() => handleToggleFavorite(selectedRecipe.id)}
          />
        ) : (
          /* Home Screen with Header */
          <View style={{ flex: 1 }}>
            <Header
              subscription={subscription}
              isAdmin={isAdmin}
              onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
              onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
              onLogoutAdmin={handleAdminLogout}
              onOpenUserActivation={() => setIsActivationModalOpen(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onlyWithVideo={onlyWithVideo}
              onToggleOnlyWithVideo={() => setOnlyWithVideo(!onlyWithVideo)}
              recipesCount={recipes.length}
              carCareCount={carCareCount}
              householdCount={householdCount}
              totalWithVideoCount={totalWithVideoCount}
            />

            <HomeScreen
              recipes={recipes}
              subscription={subscription}
              settings={settings}
              isAdmin={isAdmin}
              onSelectRecipe={(r) => setSelectedRecipe(r)}
              onOpenActivationModal={() => setIsActivationModalOpen(true)}
              onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
              onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
              onEditRecipeAdmin={handleEditRecipe}
              onRefresh={loadData}
              searchQuery={searchQuery}
              selectedCategory={selectedCategory}
              onlyWithVideo={onlyWithVideo}
            />
          </View>
        )}

        {/* User Activation Modal (Enter 8-character code) */}
        <UserActivationModal
          visible={isActivationModalOpen}
          onClose={() => setIsActivationModalOpen(false)}
          subscription={subscription}
          onSubscriptionUpdated={(newSub) => {
            setSubscription(newSub);
            loadData();
          }}
        />

        {/* Admin Secret Login Modal (Password: mounirath1977@) */}
        <AdminLoginModal
          visible={isAdminLoginOpen}
          onClose={() => setIsAdminLoginOpen(false)}
          onSuccess={handleAdminLoginSuccess}
        />

        {/* Recipe Add / Edit Modal */}
        <RecipeFormModal
          visible={isRecipeFormOpen}
          recipeToEdit={recipeToEdit}
          onClose={() => setIsRecipeFormOpen(false)}
          onSave={handleSaveRecipeFromModal}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
});
