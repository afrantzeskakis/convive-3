import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchFeaturedRestaurants, fetchUpcomingMeetups } from '../api/services';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = React.useState(false);

  const { 
    data: restaurants, 
    isLoading: restaurantsLoading,
    refetch: refetchRestaurants
  } = useQuery({
    queryKey: ['featuredRestaurants'],
    queryFn: fetchFeaturedRestaurants
  });

  const { 
    data: meetups, 
    isLoading: meetupsLoading,
    refetch: refetchMeetups
  } = useQuery({
    queryKey: ['upcomingMeetups'],
    queryFn: fetchUpcomingMeetups
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchRestaurants(), refetchMeetups()]);
    setRefreshing(false);
  }, [refetchRestaurants, refetchMeetups]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome to Convive</Text>
          <Text style={styles.welcomeSubtitle}>
            Discover exceptional dining experiences with engaging company
          </Text>
          
          <View style={styles.actionButtonContainer}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={() => navigation.navigate('RestaurantList')}
            >
              <Text style={styles.primaryButtonText}>Browse Venues</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Text style={styles.secondaryButtonText}>My Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Featured Restaurants */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Venues</Text>
            <TouchableOpacity onPress={() => navigation.navigate('RestaurantList')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {restaurantsLoading ? (
            <ActivityIndicator size="large" color="#334155" style={styles.loader} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
              {restaurants?.map((restaurant) => (
                <TouchableOpacity 
                  key={restaurant.id} 
                  style={styles.restaurantCard}
                  onPress={() => navigation.navigate('RestaurantDetail', { id: restaurant.id, name: restaurant.name })}
                >
                  <Image 
                    source={{ uri: restaurant.imageUrl || 'https://placehold.co/400x200/png' }} 
                    style={styles.restaurantImage}
                  />
                  <View style={styles.restaurantInfo}>
                    <Text style={styles.restaurantName}>{restaurant.name}</Text>
                    <Text style={styles.restaurantCuisine}>{restaurant.cuisineType}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
        
        {/* Upcoming Meetups */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
          </View>
          
          {meetupsLoading ? (
            <ActivityIndicator size="large" color="#334155" style={styles.loader} />
          ) : meetups && meetups.length > 0 ? (
            meetups.map((meetup) => (
              <TouchableOpacity 
                key={meetup.id} 
                style={styles.meetupCard}
                onPress={() => navigation.navigate('Meetup', { id: meetup.id })}
              >
                <View style={styles.meetupDateBox}>
                  <Text style={styles.meetupDay}>
                    {new Date(meetup.scheduledDate).getDate()}
                  </Text>
                  <Text style={styles.meetupMonth}>
                    {new Date(meetup.scheduledDate).toLocaleString('default', { month: 'short' })}
                  </Text>
                </View>
                
                <View style={styles.meetupDetails}>
                  <Text style={styles.meetupTitle}>{meetup.title}</Text>
                  <Text style={styles.meetupLocation}>{meetup.restaurant.name}</Text>
                  <Text style={styles.meetupTime}>
                    {new Date(meetup.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No upcoming events</Text>
              <Text style={styles.emptyStateSubtext}>Check back soon for new dining experiences</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // slate-50
  },
  scrollView: {
    flex: 1,
  },
  welcomeSection: {
    padding: 24,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0', // slate-200
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#334155', // slate-700
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#64748b', // slate-500
    marginBottom: 24,
  },
  actionButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#334155', // slate-700
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#334155', // slate-700
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#334155', // slate-700
    fontWeight: '600',
    fontSize: 16,
  },
  section: {
    padding: 24,
    backgroundColor: 'white',
    marginTop: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#334155', // slate-700
  },
  seeAllText: {
    color: '#64748b', // slate-500
    fontSize: 14,
  },
  horizontalScroll: {
    marginLeft: -8,
  },
  restaurantCard: {
    width: 250,
    marginRight: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  restaurantImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  restaurantInfo: {
    padding: 12,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155', // slate-700
    marginBottom: 4,
  },
  restaurantCuisine: {
    fontSize: 14,
    color: '#64748b', // slate-500
  },
  meetupCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
  },
  meetupDateBox: {
    width: 60,
    height: 60,
    backgroundColor: '#f1f5f9', // slate-100
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  meetupDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#334155', // slate-700
  },
  meetupMonth: {
    fontSize: 14,
    color: '#64748b', // slate-500
    textTransform: 'uppercase',
  },
  meetupDetails: {
    flex: 1,
  },
  meetupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155', // slate-700
    marginBottom: 4,
  },
  meetupLocation: {
    fontSize: 14,
    color: '#64748b', // slate-500
    marginBottom: 4,
  },
  meetupTime: {
    fontSize: 14,
    color: '#94a3b8', // slate-400
  },
  loader: {
    marginVertical: 24,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
    borderRadius: 12,
    backgroundColor: '#f8fafc', // slate-50
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155', // slate-700
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#64748b', // slate-500
    textAlign: 'center',
  },
});

export default HomeScreen;