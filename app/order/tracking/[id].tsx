// app/order/tracking/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { trackingAPI } from '../../../src/api/apiClient';
import { COLORS } from '../../../src/utils/constants';
import { formatPrice, formatDate } from '../../../src/utils/formatters';

const { width, height } = Dimensions.get('window');

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams();
  const [tracking, setTracking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const mapRef = useRef<MapView>(null);
  
  // ✅ FIX: Gunakan number untuk React Native timer
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    loadTracking();
    
    // ✅ FIX: Cast ke number
    intervalRef.current = setInterval(() => {
      loadTracking(true);
    }, 10000) as unknown as number;

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [id]);

  const loadTracking = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      
      const response = await trackingAPI.getTracking(Number(id));
      
      if (response.data.success) {
        setTracking(response.data.data);
        
        if (response.data.data.driver_location && response.data.data.delivery_location) {
          fitMapToMarkers(
            response.data.data.driver_location,
            response.data.data.delivery_location
          );
        }
      }
    } catch (error) {
      console.error('Error loading tracking:', error);
      if (!silent) {
        Alert.alert('Error', 'Failed to load tracking information');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fitMapToMarkers = (driverLoc: any, deliveryLoc: any) => {
    if (mapRef.current && driverLoc && deliveryLoc) {
      mapRef.current.fitToCoordinates([
        {
          latitude: parseFloat(driverLoc.latitude),
          longitude: parseFloat(driverLoc.longitude),
        },
        {
          latitude: parseFloat(deliveryLoc.latitude),
          longitude: parseFloat(deliveryLoc.longitude),
        },
      ], {
        edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
        animated: true,
      });
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTracking();
  };

  const callDriver = () => {
    if (tracking?.tracking?.driver_phone) {
      Linking.openURL(`tel:${tracking.tracking.driver_phone}`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      waiting_driver: '#FF9800',
      driver_assigned: '#2196F3',
      on_the_way: '#9C27B0',
      arrived: '#FF5722',
      delivered: '#4CAF50',
    };
    return colors[status] || COLORS.gray;
  };

  // ✅ FIX: Tambahkan return type yang spesifik
  const getStatusIcon = (status: string): keyof typeof Ionicons.glyphMap => {
    const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
      waiting_driver: 'time',
      driver_assigned: 'person',
      on_the_way: 'car',
      arrived: 'location',
      delivered: 'checkmark-done',
    };
    return icons[status] || 'information-circle';
  };

  const renderTimeline = () => {
    if (!tracking?.timeline) return null;

    return (
      <View style={styles.timelineContainer}>
        <Text style={styles.sectionTitle}>Order Timeline</Text>
        {tracking.timeline.map((item: any, index: number) => (
          <View key={index} style={styles.timelineItem}>
            <View style={styles.timelineLeft}>
              <View style={[
                styles.timelineIcon,
                { backgroundColor: item.status === 'completed' ? COLORS.success : item.status === 'failed' ? COLORS.error : COLORS.gray }
              ]}>
                {/* ✅ FIX: Pastikan item.icon adalah tipe yang valid */}
                <Ionicons 
                  name={item.icon as keyof typeof Ionicons.glyphMap} 
                  size={16} 
                  color="#fff" 
                />
              </View>
              {index < tracking.timeline.length - 1 && (
                <View style={[
                  styles.timelineLine,
                  { backgroundColor: tracking.timeline[index + 1].status === 'completed' ? COLORS.success : '#ddd' }
                ]} />
              )}
            </View>
            <View style={styles.timelineContent}>
              <Text style={styles.timelineTitle}>{item.title}</Text>
              <Text style={styles.timelineDescription}>{item.description}</Text>
              <Text style={styles.timelineTime}>
                {formatDate(item.timestamp)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading tracking...</Text>
      </View>
    );
  }

  if (!tracking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Tracking information not available</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const driverLoc = tracking.driver_location;
  const deliveryLoc = tracking.delivery_location;
  const hasMap = driverLoc && deliveryLoc;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Track Order</Text>
          <Text style={styles.headerSubtitle}>#{tracking.order.order_number}</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} disabled={refreshing}>
          <Ionicons 
            name="refresh" 
            size={24} 
            color="#fff" 
            style={refreshing ? { opacity: 0.5 } : {}} 
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Map View */}
        {hasMap && (
          <View style={styles.mapContainer}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: parseFloat(driverLoc.latitude),
                longitude: parseFloat(driverLoc.longitude),
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}>
              {/* Driver Marker */}
              <Marker
                coordinate={{
                  latitude: parseFloat(driverLoc.latitude),
                  longitude: parseFloat(driverLoc.longitude),
                }}
                title="Driver Location"
                description={tracking.tracking.driver_name}>
                <View style={styles.driverMarker}>
                  <Ionicons name="car" size={24} color="#fff" />
                </View>
              </Marker>

              {/* Delivery Marker */}
              <Marker
                coordinate={{
                  latitude: parseFloat(deliveryLoc.latitude),
                  longitude: parseFloat(deliveryLoc.longitude),
                }}
                title="Delivery Location"
                description={deliveryLoc.address}>
                <View style={styles.deliveryMarker}>
                  <Ionicons name="home" size={24} color="#fff" />
                </View>
              </Marker>

              {/* Route Line */}
              <Polyline
                coordinates={[
                  {
                    latitude: parseFloat(driverLoc.latitude),
                    longitude: parseFloat(driverLoc.longitude),
                  },
                  {
                    latitude: parseFloat(deliveryLoc.latitude),
                    longitude: parseFloat(deliveryLoc.longitude),
                  },
                ]}
                strokeColor={COLORS.primary}
                strokeWidth={3}
                lineDashPattern={[10, 5]}
              />
            </MapView>

            {/* ETA Badge */}
            {tracking.driver_location.eta_minutes && (
              <View style={styles.etaBadge}>
                <Ionicons name="time" size={16} color={COLORS.primary} />
                <Text style={styles.etaText}>
                  ETA: {tracking.driver_location.eta_minutes} min
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[
            styles.statusIcon,
            { backgroundColor: getStatusColor(tracking.tracking.status) }
          ]}>
            <Ionicons 
              name={getStatusIcon(tracking.tracking.status)} 
              size={32} 
              color="#fff" 
            />
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusTitle}>
              {tracking.tracking.status.replace('_', ' ').toUpperCase()}
            </Text>
            <Text style={styles.statusDescription}>
              {tracking.tracking.notes || 'Your order is being processed'}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${tracking.progress}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>{tracking.progress}% Complete</Text>
        </View>

        {/* Driver Info */}
        {tracking.tracking.driver_name && (
          <View style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={32} color={COLORS.primary} />
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{tracking.tracking.driver_name}</Text>
              <Text style={styles.driverPhone}>{tracking.tracking.driver_phone}</Text>
              {tracking.tracking.vehicle_number && (
                <Text style={styles.driverVehicle}>
                  Vehicle: {tracking.tracking.vehicle_number}
                </Text>
              )}
            </View>
            <TouchableOpacity style={styles.callButton} onPress={callDriver}>
              <Ionicons name="call" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Delivery Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Delivery Address</Text>
          <View style={styles.addressCard}>
            <Ionicons name="location" size={20} color={COLORS.primary} />
            <Text style={styles.addressText}>{deliveryLoc?.address}</Text>
          </View>
        </View>

        {/* Timeline */}
        {renderTimeline()}

        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.gray,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backBtn: {
    padding: 5,
  },
  headerContent: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  mapContainer: {
    height: 300,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  driverMarker: {
    backgroundColor: COLORS.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  deliveryMarker: {
    backgroundColor: COLORS.success,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  etaBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  etaText: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statusInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 5,
  },
  statusDescription: {
    fontSize: 14,
    color: COLORS.gray,
  },
  progressContainer: {
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 5,
    textAlign: 'center',
  },
  driverCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 3,
  },
  driverPhone: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 2,
  },
  driverVehicle: {
    fontSize: 12,
    color: COLORS.gray,
  },
  callButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 12,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 10,
    lineHeight: 20,
  },
  timelineContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 15,
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginTop: 5,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 5,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 3,
  },
  timelineDescription: {
    fontSize: 13,
    color: COLORS.gray,
    marginBottom: 5,
  },
  timelineTime: {
    fontSize: 11,
    color: COLORS.lightGray,
  },
});