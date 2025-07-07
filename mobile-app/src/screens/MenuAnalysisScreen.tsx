import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialIcons, Feather, AntDesign } from '@expo/vector-icons';

// This would be implemented in your API services
const fetchMenuItems = async (restaurantId) => {
  // Actual implementation would fetch from your API
  // This is a placeholder for the screen structure
  return [];
};

const MenuAnalysisScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { restaurantId } = route.params || { restaurantId: 1 }; // Default for demo
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  
  // Query to fetch menu items
  const { 
    data: menuItems, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['menuItems', restaurantId],
    queryFn: () => fetchMenuItems(restaurantId),
  });
  
  // Get categories from menu items
  const categories = menuItems 
    ? ['All', ...new Set(menuItems.map(item => item.category))] 
    : ['All'];
  
  // Filter menu items based on search and category
  const filteredItems = menuItems
    ? menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
    : [];
  
  // Upload menu mutation would be implemented here
  const uploadMenuMutation = useMutation({
    mutationFn: (data) => {
      // Placeholder for actual implementation
      return Promise.resolve({ success: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['menuItems', restaurantId]);
      setIsUploadModalVisible(false);
    }
  });
  
  // Handle menu item selection for detailed view
  const handleItemPress = (item) => {
    setSelectedItem(item);
    setIsDetailModalVisible(true);
  };
  
  // Handle document upload
  const handleDocumentUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });
      
      if (!result.canceled) {
        // Process the image
        const uri = result.assets[0].uri;
        uploadMenuMutation.mutate({ uri, restaurantId });
      }
    } catch (error) {
      console.error('Error picking document:', error);
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu Analysis</Text>
        <TouchableOpacity 
          style={styles.uploadButton}
          onPress={() => setIsUploadModalVisible(true)}
        >
          <Feather name="upload" size={18} color="#fff" />
          <Text style={styles.uploadButtonText}>Upload Menu</Text>
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search menu items..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={18} color="#64748b" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
      
      {/* Category Filter */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              selectedCategory === category ? styles.selectedCategoryButton : null
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text 
              style={[
                styles.categoryText,
                selectedCategory === category ? styles.selectedCategoryText : null
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Menu Items List */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#334155" />
          <Text style={styles.loadingText}>Loading menu items...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#ef4444" />
          <Text style={styles.errorText}>Failed to load menu items</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="restaurant-menu" size={48} color="#94a3b8" />
          <Text style={styles.emptyText}>No menu items found</Text>
          <Text style={styles.emptySubtext}>
            {searchQuery || selectedCategory !== 'All' 
              ? 'Try adjusting your search or filters'
              : 'Upload your restaurant menu to get started'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => handleItemPress(item)}
            >
              <Image 
                source={{ uri: item.imageUrl || 'https://placehold.co/100x100/png' }} 
                style={styles.menuItemImage}
              />
              <View style={styles.menuItemDetails}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                <Text style={styles.menuItemDescription} numberOfLines={2}>
                  {item.description}
                </Text>
                <View style={styles.menuItemTags}>
                  {item.allergens?.map((allergen) => (
                    <View key={allergen} style={styles.allergenTag}>
                      <Text style={styles.allergenTagText}>{allergen}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.menuList}
        />
      )}
      
      {/* Upload Menu Modal */}
      <Modal
        visible={isUploadModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsUploadModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Menu</Text>
              <TouchableOpacity onPress={() => setIsUploadModalVisible(false)}>
                <AntDesign name="close" size={24} color="#334155" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalText}>
                Upload your restaurant menu or recipe documents for AI analysis. We support PDF, DOC, and image formats.
              </Text>
              
              <TouchableOpacity 
                style={styles.documentUploadButton}
                onPress={handleDocumentUpload}
              >
                <Feather name="file-plus" size={24} color="#334155" />
                <Text style={styles.documentUploadText}>Select Document</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.documentUploadButton}
                onPress={handleDocumentUpload}
              >
                <Feather name="camera" size={24} color="#334155" />
                <Text style={styles.documentUploadText}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton,
                  uploadMenuMutation.isPending ? styles.disabledButton : null
                ]}
                onPress={() => setIsUploadModalVisible(false)}
                disabled={uploadMenuMutation.isPending}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      
      {/* Item Detail Modal */}
      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <View style={styles.detailModalOverlay}>
          <View style={styles.detailModalContent}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setIsDetailModalVisible(false)}
            >
              <AntDesign name="close" size={24} color="#fff" />
            </TouchableOpacity>
            
            {selectedItem && (
              <ScrollView>
                <Image 
                  source={{ uri: selectedItem.imageUrl || 'https://placehold.co/400x300/png' }} 
                  style={styles.detailImage}
                />
                
                <View style={styles.detailContent}>
                  <Text style={styles.detailName}>{selectedItem.name}</Text>
                  <Text style={styles.detailCategory}>{selectedItem.category}</Text>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Description</Text>
                    <Text style={styles.detailDescription}>{selectedItem.description}</Text>
                  </View>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Ingredients</Text>
                    {selectedItem.ingredients?.map((ingredient, index) => (
                      <View key={index} style={styles.ingredientItem}>
                        <Text style={styles.ingredientName}>{ingredient.name}</Text>
                        <Text style={styles.ingredientDescription}>{ingredient.description}</Text>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Preparation</Text>
                    {selectedItem.techniques?.map((technique, index) => (
                      <View key={index} style={styles.techniqueItem}>
                        <Text style={styles.techniqueName}>{technique.name}</Text>
                        <Text style={styles.techniqueDescription}>{technique.description}</Text>
                      </View>
                    ))}
                  </View>
                  
                  {selectedItem.allergens && selectedItem.allergens.length > 0 && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailSectionTitle}>Allergen Information</Text>
                      <View style={styles.allergenContainer}>
                        {selectedItem.allergens.map((allergen) => (
                          <View key={allergen} style={styles.detailAllergenTag}>
                            <Text style={styles.detailAllergenText}>{allergen}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  
                  <View style={styles.detailSection}>
                    <Text style={styles.detailSectionTitle}>Talking Points</Text>
                    <View style={styles.talkingPointsContainer}>
                      <Text style={styles.talkingPoint}>
                        • The history behind this dish dates back to...
                      </Text>
                      <Text style={styles.talkingPoint}>
                        • The special technique used in preparation involves...
                      </Text>
                      <Text style={styles.talkingPoint}>
                        • This pairs excellently with our house wine because...
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // slate-50
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // slate-200
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#334155', // slate-700
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#334155', // slate-700
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: 'white',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc', // slate-50
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#334155', // slate-700
  },
  categoryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // slate-200
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f8fafc', // slate-50
  },
  selectedCategoryButton: {
    backgroundColor: '#334155', // slate-700
  },
  categoryText: {
    color: '#64748b', // slate-500
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b', // slate-500
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ef4444', // red-500
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#334155', // slate-700
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#334155', // slate-700
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b', // slate-500
    textAlign: 'center',
    maxWidth: 300,
  },
  menuList: {
    padding: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItemImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  menuItemDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155', // slate-700
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#64748b', // slate-500
    marginBottom: 8,
  },
  menuItemTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  allergenTag: {
    backgroundColor: '#fee2e2', // red-100
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
  },
  allergenTagText: {
    fontSize: 12,
    color: '#ef4444', // red-500
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // slate-200
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155', // slate-700
  },
  modalBody: {
    padding: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#64748b', // slate-500
    marginBottom: 20,
    lineHeight: 22,
  },
  documentUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc', // slate-50
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
    borderRadius: 8,
    paddingVertical: 16,
    marginBottom: 16,
  },
  documentUploadText: {
    fontSize: 16,
    color: '#334155', // slate-700
    fontWeight: '600',
    marginLeft: 12,
  },
  modalButton: {
    backgroundColor: '#334155', // slate-700
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#94a3b8', // slate-400
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  detailModalContent: {
    flex: 1,
    backgroundColor: 'white',
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  detailImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  detailContent: {
    padding: 20,
  },
  detailName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#334155', // slate-700
    marginBottom: 4,
  },
  detailCategory: {
    fontSize: 16,
    color: '#64748b', // slate-500
    marginBottom: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155', // slate-700
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // slate-200
    paddingBottom: 8,
  },
  detailDescription: {
    fontSize: 16,
    color: '#64748b', // slate-500
    lineHeight: 24,
  },
  ingredientItem: {
    marginBottom: 12,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155', // slate-700
    marginBottom: 4,
  },
  ingredientDescription: {
    fontSize: 14,
    color: '#64748b', // slate-500
    lineHeight: 20,
  },
  techniqueItem: {
    marginBottom: 12,
  },
  techniqueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155', // slate-700
    marginBottom: 4,
  },
  techniqueDescription: {
    fontSize: 14,
    color: '#64748b', // slate-500
    lineHeight: 20,
  },
  allergenContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailAllergenTag: {
    backgroundColor: '#fee2e2', // red-100
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  detailAllergenText: {
    fontSize: 14,
    color: '#ef4444', // red-500
  },
  talkingPointsContainer: {
    backgroundColor: '#f8fafc', // slate-50
    borderRadius: 8,
    padding: 16,
  },
  talkingPoint: {
    fontSize: 14,
    color: '#334155', // slate-700
    marginBottom: 12,
    lineHeight: 20,
  },
});

export default MenuAnalysisScreen;