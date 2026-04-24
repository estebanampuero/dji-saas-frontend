export interface Drone {
  id: string;
  serial_number: string;
  nickname: string;
  model: string;
  is_online: boolean;
  last_seen: string;
  firmware_version: string;
}

export interface Telemetry {
  sn?: string;
  lat: number;
  lng: number;
  altitude: number;
  horizontal_speed: number;
  vertical_speed: number;
  heading: number;
  battery_percent: number;
  battery_voltage: number;
  battery_temp: number;
  remaining_flight_time: number;
  satellite_count: number;
  gps_level: number;
  rtk_state: boolean;
  rc_signal_quality: number;
  gimbal_pitch: number;
  gimbal_roll: number;
  gimbal_yaw: number;
  wind_speed: number;
  flight_mode: string;
  is_flying: boolean;
  ts: string;
}

export interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  type: string;
  message: string;
  drone_sn?: string;
  nickname?: string;
  created_at: string;
  resolved: boolean;
}

export interface Stats {
  total_drones: number;
  total_flights: number;
  total_flight_hours: number;
  highest_altitude_m: number;
  total_distance_km: number;
  open_alerts: number;
  telemetry_records: number;
}
