// src/screens/Order/TrackingScreen.js
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { trackingAPI } from '../../api/apiClient';

const TrackingScreen = ({ route }) => {
  const { orderId } = route.params;
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);

  useEffect(() => {
    loadTracking();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      loadTracking();
    }, 10000);

    return () => clearInterval(interval);
  }, [orderId]);

  const loadTracking = async () => {
    try {
      const response = await trackingAPI.getTracking(orderId);
      if (response.data.success) {
        setTracking(response.data.data);
      }
    } catch (error) {
      console.error('Error loading tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      waiting_driver: {
        label: 'Waiting for Driver',
        color: '#FF9800',
        icon: '⏳',
      },
      driver_assigned: {
        label: 'Driver Assigned',
        color: '#2196F3',
        icon: '👤',
      },
      on_the_way: {
        label: 'On the Way',
        color: '#2196F3',
        icon: '🚚',
      },
      arrived: {
        label: 'Driver Arrived',
        color: '#4CAF50',
        icon: '📍',
      },
      delivered: {
        label: 'Delivered',
        color: '#4CAF50',
        icon: '✅',
      },
    };

    return statusMap[status] || {
      label: status,
      color: '#666',
      icon: '📦',
    };
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!tracking || !tracking.tracking) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Tracking information not available</Text>
      </View>
    );
  }

  const { order, tracking: trackingInfo, histories } = tracking;
  const statusInfo = getStatusInfo(trackingInfo.status);

  // Map region
  const hasLocation = trackingInfo.latitude && trackingInfo.longitude;
  const region = hasLocation
    ? {
        latitude: parseFloat(trackingInfo.latitude),
        longitude: parseFloat(trackingInfo.longitude),
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    : {
        latitude: -7.250445,
        longitude: 112.768845,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };

  return (
    <View style={styles.container}>
      {/* Map */}
      {hasLocation ? (
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}
        >
          <Marker
            coordinate={{
              latitude: parseFloat(trackingInfo.latitude),
              longitude: parseFloat(trackingInfo.longitude),
            }}
            title="Driver Location"
            description={trackingInfo.driver_name}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerIcon}>🚚</Text>
            </View>
          </Marker>
        </MapView>
      ) : (
        <View style={styles.noMapContainer}>
          <Text style={styles.noMapText}>📍</Text>
          <Text style={styles.noMapDesc}>Location not available yet</Text>
        </View>
      )}

      {/* Tracking Info */}
      <ScrollView style={styles.infoContainer}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
            <Text style={styles.statusIcon}>{statusInfo.icon}</Text>
          </View>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>{statusInfo.label}</Text>
            <Text style={styles.orderNumber}>Order #{order.order_number}</Text>
          </View>
        </View>

        {/* Driver Info */}
        {trackingInfo.driver_name && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Driver Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{trackingInfo.driver_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{trackingInfo.driver_phone}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Vehicle:</Text>
              <Text style={styles.infoValue}>{trackingInfo.vehicle_number}</Text>
            </View>
            {trackingInfo.estimated_delivery && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>ETA:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(trackingInfo.estimated_delivery)}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Tracking History */}
        {histories && histories.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Tracking History</Text>
            {histories.map((history, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyDot} />
                {index < histories.length - 1 && <View style={styles.historyLine} />}
                <View style={styles.historyContent}>
                  <Text style={styles.historyStatus}>
                    {getStatusInfo(history.status).label}
                  </Text>
                  <Text style={styles.historyDesc}>{history.description}</Text>
                  <Text style={styles.historyDate}>
                    {formatDate(history.created_at)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {trackingInfo.notes && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Notes</Text>
            <Text style={styles.notesText}>{trackingInfo.notes}</Text>
          </View>
        )}
      </ScrollView>

      {/* Refresh Button */}
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={loadTracking}
      >
        <Text style={styles.refreshButtonText}>🔄 Refresh</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#666',
  },
  map: {
    height: 300,
  },
  noMapContainer: {
    height: 300,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noMapText: {
    fontSize: 60,
    marginBottom: 10,
  },
  noMapDesc: {
    fontSize: 14,
    color: '#666',
  },
  markerContainer: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2E7D32',
  },
  markerIcon: {
    fontSize: 24,
  },
  infoContainer: {
    flex: 1,
    padding: 15,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  statusIcon: {
    fontSize: 30,
  },
  statusInfo: {
    flex: 1,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  orderNumber: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  historyItem: {
    flexDirection: 'row',
    position: 'relative',
    marginBottom: 20,
  },
  historyDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2E7D32',
    marginRight: 15,
    marginTop: 5,
  },
  historyLine: {
    position: 'absolute',
    left: 5,
    top: 17,
    width: 2,
    height: '100%',
    backgroundColor: '#ddd',
  },
  historyContent: {
    flex: 1,
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  historyDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  historyDate: {
    fontSize: 12,
    color: '#999',
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  refreshButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default TrackingScreen;