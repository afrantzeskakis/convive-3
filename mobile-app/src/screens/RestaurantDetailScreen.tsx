import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchRestaurantDetails, requestMeetup } from '../api/services';
import { useAuth } from '../context/AuthContext';

const RestaurantDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { id } = route.params;
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  
  // Get restaurant details
  const { 
    data: restaurant, 
    isLoading,
    error,
  } = useQuery({
    queryKey: ['restaurant', id],
    queryFn: () => fetchRestaurantDetails(id),
  });

  // Create meetup mutation
  const createMeetupMutation = useMutation({
    mutationFn: (data) => requestMeetup(data),
    onSuccess: (data) => {
      Alert.alert(
        "Success",
        "Your dining reservation has been requested. We'll notify you when it's confirmed.",
        [
          { 
            text: "View Details", 
            onPress: () => navigation.navigate('Meetup', { id: data.id }) 
          },
          { text: "OK" }
        ]
      );
    },
    onError: (error) => {
      Alert.alert("Error", error.message || "Failed to request meetup. Please try again.");
    }
  });

  const handleRequestMeetup = () => {
    if (!selectedDate || !selectedTime) {
      Alert.alert("Required", "Please select a date and time for your dining experience");
      return;
    }
    
    // Combine date and time
    const dateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':');
    dateTime.setHours(parseInt(hours), parseInt(minutes));
    
    createMeetupMutation.mutate({
      restaurantId: id,
      scheduledDate: dateTime.toISOString(),
      numberOfGuests: 6 // Default to 6 guests plus 1 host
    });
  };

  // Generate available dates (next 14 days)
  const getAvailableDates = () => {
    const dates = [];
    const now = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date();
      date.setDate(now.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Available time slots
  const timeSlots = [
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
  ];

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#334155" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading restaurant details</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Restaurant Image */}
        <Image 
          source={{ uri: restaurant?.imageUrl || 'https://placehold.co/600x400/png' }} 
          style={styles.restaurantImage}
        />
        
        {/* Restaurant Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.restaurantName}>{restaurant?.name}</Text>
          <Text style={styles.cuisineType}>{restaurant?.cuisineType} Cuisine</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Location:</Text>
            <Text style={styles.infoValue}>{restaurant?.location}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Price Range:</Text>
            <Text style={styles.infoValue}>
              {'$'.repeat(restaurant?.priceRange || 3)}
            </Text>
          </View>
          
          <View style={styles.divider} />
          
          <Text style={styles.descriptionTitle}>About</Text>
          <Text style={styles.description}>{restaurant?.description}</Text>
          
          <View style={styles.divider} />
          
          {/* Select Date Section */}
          <Text style={styles.sectionTitle}>Select Date</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.dateScrollView}
          >
            {getAvailableDates().map((date, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.dateButton,
                  selectedDate && date.toDateString() === new Date(selectedDate).toDateString() 
                    ? styles.selectedDateButton 
                    : null
                ]}
                onPress={() => setSelectedDate(date.toISOString())}
              >
                <Text style={styles.dateDay}>{date.getDate()}</Text>
                <Text style={styles.dateMonth}>
                  {date.toLocaleString('default', { month: 'short' })}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {/* Select Time Section */}
          <Text style={styles.sectionTitle}>Select Time</Text>
          <View style={styles.timeContainer}>
            {timeSlots.map((time) => (
              <TouchableOpacity 
                key={time}
                style={[
                  styles.timeButton,
                  selectedTime === time ? styles.selectedTimeButton : null
                ]}
                onPress={() => setSelectedTime(time)}
              >
                <Text 
                  style={[
                    styles.timeText,
                    selectedTime === time ? styles.selectedTimeText : null
                  ]}
                >
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Request Button */}
          <TouchableOpacity 
            style={styles.requestButton}
            onPress={handleRequestMeetup}
            disabled={createMeetupMutation.isPending}
          >
            {createMeetupMutation.isPending ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.requestButtonText}>Request Dining Experience</Text>
            )}
          </TouchableOpacity>
          
          <Text style={styles.requestNote}>
            * Your request will be reviewed and confirmed based on availability
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  restaurantImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  detailsContainer: {
    padding: 24,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#334155', // slate-700
    marginBottom: 4,
  },
  cuisineType: {
    fontSize: 16,
    color: '#64748b', // slate-500
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    color: '#64748b', // slate-500
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: '#334155', // slate-700
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0', // slate-200
    marginVertical: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155', // slate-700
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: '#64748b', // slate-500
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155', // slate-700
    marginBottom: 16,
  },
  dateScrollView: {
    marginBottom: 24,
  },
  dateButton: {
    width: 64,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc', // slate-50
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
  },
  selectedDateButton: {
    backgroundColor: '#334155', // slate-700
    borderColor: '#334155', // slate-700
  },
  dateDay: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#334155', // slate-700
  },
  dateMonth: {
    fontSize: 14,
    color: '#64748b', // slate-500
    marginTop: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  timeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc', // slate-50
    borderWidth: 1,
    borderColor: '#e2e8f0', // slate-200
    marginRight: 12,
    marginBottom: 12,
  },
  selectedTimeButton: {
    backgroundColor: '#334155', // slate-700
    borderColor: '#334155', // slate-700
  },
  timeText: {
    fontSize: 14,
    color: '#334155', // slate-700
  },
  selectedTimeText: {
    color: 'white',
  },
  requestButton: {
    backgroundColor: '#334155', // slate-700
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  requestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  requestNote: {
    fontSize: 12,
    color: '#94a3b8', // slate-400
    marginTop: 8,
    textAlign: 'center',
  },
});

export default RestaurantDetailScreen;