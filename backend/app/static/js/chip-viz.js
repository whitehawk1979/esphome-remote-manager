// Chip Visualization Module
// Grafikus chip megjelenítés periféria bekötési logikával

// Peripheral library for drag & drop - searchable catalog
const PERIPHERAL_LIBRARY = [
    // Temperature/Humidity
    { id: 'dht11', name: 'DHT11', category: 'Hőmérséklet/Pára', type: 'sensor', pins: 1, icon: 'thermostat' },
    { id: 'dht22', name: 'DHT22', category: 'Hőmérséklet/Pára', type: 'sensor', pins: 1, icon: 'thermostat' },
    { id: 'ds18b20', name: 'DS18B20', category: 'Hőmérséklet/Pára', type: 'sensor', pins: 1, icon: 'thermostat' },
    { id: 'bme280', name: 'BME280', category: 'Hőmérséklet/Pára', type: 'sensor', pins: 2, icon: 'compress', bus: 'I2C' },
    { id: 'bmp280', name: 'BMP280', category: 'Hőmérséklet/Pára', type: 'sensor', pins: 2, icon: 'compress', bus: 'I2C' },
    { id: 'aht20', name: 'AHT20', category: 'Hőmérséklet/Pára', type: 'sensor', pins: 2, icon: 'thermostat', bus: 'I2C' },
    { id: 'sht3x', name: 'SHT3x', category: 'Hőmérséklet/Pára', type: 'sensor', pins: 2, icon: 'thermostat', bus: 'I2C' },
    { id: 'sht4x', name: 'SHT4x', category: 'Hőmérséklet/Pára', type: 'sensor', pins: 2, icon: 'thermostat', bus: 'I2C' },
    { id: 'dht20', name: 'DHT20 (AHT10)', category: 'Hőmérséklet/Pára', type: 'sensor', pins: 2, icon: 'thermostat', bus: 'I2C' },
    { id: 'htu21d', name: 'HTU21D', category: 'Hőmérséklet/Pára', type: 'sensor', pins: 2, icon: 'thermostat', bus: 'I2C' },
    { id: 'si7021', name: 'SI7021', category: 'Hőmérséklet/Pára', type: 'sensor', pins: 2, icon: 'thermostat', bus: 'I2C' },
    { id: 'tmp102', name: 'TMP102', category: 'Hőmérséklet/Pára', type: 'sensor', pins: 2, icon: 'thermostat', bus: 'I2C' },
    { id: 'tmp117', name: 'TMP117', category: 'Hőmérséklet/Pára', type: 'sensor', pins: 2, icon: 'thermostat', bus: 'I2C' },
    { id: 'lm75', name: 'LM75', category: 'Hőmérséklet/Pára', type: 'sensor', pins: 2, icon: 'thermostat', bus: 'I2C' },
    
    // CO2
    { id: 'scd4x', name: 'SCD4x', category: 'CO2', type: 'sensor', pins: 2, icon: 'co2', bus: 'I2C' },
    { id: 'scd30', name: 'SCD30', category: 'CO2', type: 'sensor', pins: 2, icon: 'co2', bus: 'I2C' },
    { id: 'mhz19', name: 'MH-Z19', category: 'CO2', type: 'sensor', pins: 2, icon: 'co2', bus: 'UART' },
    { id: 'senseairs8', name: 'SenseAir S8', category: 'CO2', type: 'sensor', pins: 2, icon: 'co2', bus: 'UART' },
    { id: 'ccs811', name: 'CCS811', category: 'CO2', type: 'sensor', pins: 2, icon: 'co2', bus: 'I2C' },
    
    // Air Quality
    { id: 'pms5003', name: 'PMS5003', category: 'Levegő Minőség', type: 'sensor', pins: 2, icon: 'air', bus: 'UART' },
    { id: 'pms7003', name: 'PMS7003', category: 'Levegő Minőség', type: 'sensor', pins: 2, icon: 'air', bus: 'UART' },
    { id: 'sds011', name: 'SDS011', category: 'Levegő Minőség', type: 'sensor', pins: 2, icon: 'air', bus: 'UART' },
    { id: 'pm1006', name: 'PM1006', category: 'Levegő Minőség', type: 'sensor', pins: 2, icon: 'air', bus: 'UART' },
    { id: 'ens210', name: 'ENS210', category: 'Levegő Minőség', type: 'sensor', pins: 2, icon: 'air', bus: 'I2C' },
    
    // Presence/Motion
    { id: 'ld2410', name: 'LD2410', category: 'Jelenlét', type: 'sensor', pins: 2, icon: 'sensors', bus: 'UART' },
    { id: 'ld1125h', name: 'LD1125H', category: 'Jelenlét', type: 'sensor', pins: 2, icon: 'sensors', bus: 'UART' },
    { id: 'ld2410s', name: 'LD2410S', category: 'Jelenlét', type: 'sensor', pins: 2, icon: 'sensors', bus: 'UART' },
    { id: 'rcwl0516', name: 'RCWL-0516', category: 'Jelenlét', type: 'sensor', pins: 1, icon: 'sensors' },
    { id: 'am312', name: 'AM312', category: 'Jelenlét', type: 'sensor', pins: 1, icon: 'sensors' },
    { id: 'sr501', name: 'HC-SR501', category: 'Jelenlét', type: 'sensor', pins: 1, icon: 'sensors' },
    { id: 'mmwave', name: 'mmWave Radar', category: 'Jelenlét', type: 'sensor', pins: 2, icon: 'sensors', bus: 'UART' },
    
    // Distance
    { id: 'vl53l0x', name: 'VL53L0X', category: 'Távolság', type: 'sensor', pins: 2, icon: 'straighten', bus: 'I2C' },
    { id: 'vl53l1x', name: 'VL53L1X', category: 'Távolság', type: 'sensor', pins: 2, icon: 'straighten', bus: 'I2C' },
    { id: 'hcsr04', name: 'HC-SR04', category: 'Távolság', type: 'sensor', pins: 2, icon: 'straighten' },
    { id: 'hcsr05', name: 'HC-SR05', category: 'Távolság', type: 'sensor', pins: 2, icon: 'straighten' },
    { id: 'tfmini', name: 'TFMini', category: 'Távolság', type: 'sensor', pins: 2, icon: 'straighten', bus: 'UART' },
    { id: 'tof10120', name: 'TOF10120', category: 'Távolság', type: 'sensor', pins: 2, icon: 'straighten', bus: 'UART' },
    
    // Light
    { id: 'bh1750', name: 'BH1750', category: 'Fény', type: 'sensor', pins: 2, icon: 'light_mode', bus: 'I2C' },
    { id: 'tsl2561', name: 'TSL2561', category: 'Fény', type: 'sensor', pins: 2, icon: 'light_mode', bus: 'I2C' },
    { id: 'tsl2591', name: 'TSL2591', category: 'Fény', type: 'sensor', pins: 2, icon: 'light_mode', bus: 'I2C' },
    { id: 'veml7700', name: 'VEML7700', category: 'Fény', type: 'sensor', pins: 2, icon: 'light_mode', bus: 'I2C' },
    { id: 'veml6030', name: 'VEML6030', category: 'Fény', type: 'sensor', pins: 2, icon: 'light_mode', bus: 'I2C' },
    { id: 'max44009', name: 'MAX44009', category: 'Fény', type: 'sensor', pins: 2, icon: 'light_mode', bus: 'I2C' },
    
    // Display
    { id: 'ssd1306', name: 'SSD1306 OLED', category: 'Kijelző', type: 'display', pins: 2, icon: 'display_settings', bus: 'I2C' },
    { id: 'ssd1309', name: 'SSD1309 OLED', category: 'Kijelző', type: 'display', pins: 2, icon: 'display_settings', bus: 'I2C' },
    { id: 'ssd1322', name: 'SSD1322 OLED', category: 'Kijelző', type: 'display', pins: 2, icon: 'display_settings', bus: 'I2C' },
    { id: 'ssd1327', name: 'SSD1327 OLED', category: 'Kijelző', type: 'display', pins: 2, icon: 'display_settings', bus: 'I2C' },
    { id: 'sh1106', name: 'SH1106 OLED', category: 'Kijelző', type: 'display', pins: 2, icon: 'display_settings', bus: 'I2C' },
    { id: 'st7789', name: 'ST7789 TFT', category: 'Kijelző', type: 'display', pins: 4, icon: 'display_settings', bus: 'SPI' },
    { id: 'st7735', name: 'ST7735 TFT', category: 'Kijelző', type: 'display', pins: 4, icon: 'display_settings', bus: 'SPI' },
    { id: 'ili9341', name: 'ILI9341 TFT', category: 'Kijelző', type: 'display', pins: 4, icon: 'display_settings', bus: 'SPI' },
    { id: 'ili9488', name: 'ILI9488 TFT', category: 'Kijelző', type: 'display', pins: 4, icon: 'display_settings', bus: 'SPI' },
    { id: 'waveshare_epaper', name: 'Waveshare e-Paper', category: 'Kijelző', type: 'display', pins: 4, icon: 'display_settings', bus: 'SPI' },
    { id: 'inkplate', name: 'Inkplate', category: 'Kijelző', type: 'display', pins: 4, icon: 'display_settings', bus: 'SPI' },
    
    // Input Devices
    { id: 'rotary', name: 'Rotary Encoder', category: 'Bemenet', type: 'input', pins: 2, icon: 'rotate_right' },
    { id: 'rotary_ec11', name: 'EC11 Rotary', category: 'Bemenet', type: 'input', pins: 2, icon: 'rotate_right' },
    { id: 'keypad', name: 'Keypad 4x4', category: 'Bemenet', type: 'input', pins: 8, icon: 'keyboard' },
    { id: 'keypad_3x4', name: 'Keypad 3x4', category: 'Bemenet', type: 'input', pins: 7, icon: 'keyboard' },
    { id: 'touch', name: 'Touch Sensor', category: 'Bemenet', type: 'input', pins: 1, icon: 'touch_app' },
    { id: 'ttp223', name: 'TTP223 Touch', category: 'Bemenet', type: 'input', pins: 1, icon: 'touch_app' },
    { id: 'cap1188', name: 'CAP1188 Touch', category: 'Bemenet', type: 'input', pins: 2, icon: 'touch_app', bus: 'I2C' },
    { id: 'mpr121', name: 'MPR121 Touch', category: 'Bemenet', type: 'input', pins: 2, icon: 'touch_app', bus: 'I2C' },
    
    // Output Devices
    { id: 'relay', name: 'Relay', category: 'Kimenet', type: 'output', pins: 1, icon: 'power' },
    { id: 'relay_2ch', name: 'Relay 2CH', category: 'Kimenet', type: 'output', pins: 2, icon: 'power' },
    { id: 'relay_4ch', name: 'Relay 4CH', category: 'Kimenet', type: 'output', pins: 4, icon: 'power' },
    { id: 'led', name: 'LED', category: 'Kimenet', type: 'output', pins: 1, icon: 'lightbulb' },
    { id: 'ledc', name: 'LED PWM', category: 'Kimenet', type: 'output', pins: 1, icon: 'lightbulb' },
    { id: 'ws2812', name: 'WS2812B LED', category: 'Kimenet', type: 'output', pins: 1, icon: 'light_mode' },
    { id: 'apa102', name: 'APA102 LED', category: 'Kimenet', type: 'output', pins: 2, icon: 'light_mode' },
    { id: 'sk6812', name: 'SK6812 LED', category: 'Kimenet', type: 'output', pins: 1, icon: 'light_mode' },
    { id: 'servo', name: 'Servo', category: 'Kimenet', type: 'output', pins: 1, icon: 'settings' },
    { id: 'stepper', name: 'Stepper Motor', category: 'Kimenet', type: 'output', pins: 4, icon: 'settings' },
    { id: 'pca9685', name: 'PCA9685 PWM', category: 'Kimenet', type: 'output', pins: 2, icon: 'settings', bus: 'I2C' },
    
    // Communication
    { id: 'uart', name: 'UART Device', category: 'Kommunikáció', type: 'comm', pins: 2, icon: 'cable', bus: 'UART' },
    { id: 'i2c', name: 'I2C Device', category: 'Kommunikáció', type: 'comm', pins: 2, icon: 'cable', bus: 'I2C' },
    { id: 'spi', name: 'SPI Device', category: 'Kommunikáció', type: 'comm', pins: 4, icon: 'cable', bus: 'SPI' },
    { id: 'rs485', name: 'RS485', category: 'Kommunikáció', type: 'comm', pins: 2, icon: 'cable', bus: 'UART' },
    { id: 'canbus', name: 'CAN Bus', category: 'Kommunikáció', type: 'comm', pins: 2, icon: 'cable' },
    { id: 'modbus', name: 'Modbus', category: 'Kommunikáció', type: 'comm', pins: 2, icon: 'cable', bus: 'UART' },
    
    // Power Monitoring
    { id: 'hlw8012', name: 'HLW8012', category: 'Energia', type: 'sensor', pins: 3, icon: 'bolt' },
    { id: 'cse7766', name: 'CSE7766', category: 'Energia', type: 'sensor', pins: 2, icon: 'bolt', bus: 'UART' },
    { id: 'ade7953', name: 'ADE7953', category: 'Energia', type: 'sensor', pins: 2, icon: 'bolt', bus: 'I2C' },
    { id: 'atm90e26', name: 'ATM90E26', category: 'Energia', type: 'sensor', pins: 4, icon: 'bolt', bus: 'SPI' },
    { id: 'atm90e32', name: 'ATM90E32', category: 'Energia', type: 'sensor', pins: 2, icon: 'bolt', bus: 'I2C' },
    { id: 'ina219', name: 'INA219', category: 'Energia', type: 'sensor', pins: 2, icon: 'bolt', bus: 'I2C' },
    { id: 'ina219', name: 'INA219', category: 'Energia', type: 'sensor', pins: 2, icon: 'bolt', bus: 'I2C' },
    { id: 'ina260', name: 'INA260', category: 'Energia', type: 'sensor', pins: 2, icon: 'bolt', bus: 'I2C' },
    { id: 'ina3221', name: 'INA3221', category: 'Energia', type: 'sensor', pins: 2, icon: 'bolt', bus: 'I2C' },
    { id: 'pzem004t', name: 'PZEM-004T', category: 'Energia', type: 'sensor', pins: 2, icon: 'bolt', bus: 'UART' },
    { id: 'pzemac', name: 'PZEM-014/016', category: 'Energia', type: 'sensor', pins: 2, icon: 'bolt', bus: 'UART' },
    
    // Gas Sensors
    { id: 'mq2', name: 'MQ-2', category: 'Gáz', type: 'sensor', pins: 1, icon: 'gas_meter' },
    { id: 'mq3', name: 'MQ-3', category: 'Gáz', type: 'sensor', pins: 1, icon: 'gas_meter' },
    { id: 'mq4', name: 'MQ-4', category: 'Gáz', type: 'sensor', pins: 1, icon: 'gas_meter' },
    { id: 'mq5', name: 'MQ-5', category: 'Gáz', type: 'sensor', pins: 1, icon: 'gas_meter' },
    { id: 'mq7', name: 'MQ-7', category: 'Gáz', type: 'sensor', pins: 1, icon: 'gas_meter' },
    { id: 'mq135', name: 'MQ-135', category: 'Gáz', type: 'sensor', pins: 1, icon: 'gas_meter' },
    { id: 'mhz19', name: 'MH-Z19B', category: 'Gáz', type: 'sensor', pins: 2, icon: 'co2', bus: 'UART' },
    { id: 'scd30', name: 'SCD30', category: 'Gáz', type: 'sensor', pins: 2, icon: 'co2', bus: 'I2C' },
    
    // Magnetic/Hall
    { id: 'a3144', name: 'A3144 Hall', category: 'Mágnes', type: 'sensor', pins: 1, icon: 'explore' },
    { id: 'hall', name: 'Hall Sensor', category: 'Mágnes', type: 'sensor', pins: 1, icon: 'explore' },
    { id: 'reed', name: 'Reed Switch', category: 'Mágnes', type: 'sensor', pins: 1, icon: 'explore' },
    
    // Sound/Audio
    { id: 'microphone', name: 'Microphone', category: 'Hang', type: 'sensor', pins: 1, icon: 'mic' },
    { id: 'i2s_microphone', name: 'I2S Microphone', category: 'Hang', type: 'sensor', pins: 3, icon: 'mic', bus: 'I2S' },
    { id: 'i2s_speaker', name: 'I2S Speaker', category: 'Hang', type: 'output', pins: 3, icon: 'volume_up', bus: 'I2S' },
    { id: 'pcm5102', name: 'PCM5102 DAC', category: 'Hang', type: 'output', pins: 3, icon: 'volume_up', bus: 'I2S' },
    { id: 'max98357a', name: 'MAX98357A', category: 'Hang', type: 'output', pins: 3, icon: 'volume_up', bus: 'I2S' },
    
    // Buttons/Switches
    { id: 'button', name: 'Button', category: 'Bemenet', type: 'input', pins: 1, icon: 'radio_button_checked' },
    { id: 'switch', name: 'Switch', category: 'Bemenet', type: 'input', pins: 1, icon: 'toggle_on' },
    { id: 'binary_sensor', name: 'Binary Sensor', category: 'Bemenet', type: 'input', pins: 1, icon: 'sensors' },
];

// Export for global use
window.PERIPHERAL_LIBRARY = PERIPHERAL_LIBRARY;

// Peripheral definitions with pin requirements - Extended
const PERIPHERAL_TYPES = {
    // Temperature/Humidity Sensors
    'dht11': { name: 'DHT11', type: 'sensor', pins: [{ name: 'DATA', pin: 'GPIO', required: true }], icon: 'thermostat', power: '3.3-5V', current: '1mA', notes: 'Single wire, 10kΩ pull-up' },
    'dht22': { name: 'DHT22', type: 'sensor', pins: [{ name: 'DATA', pin: 'GPIO', required: true }], icon: 'thermostat', power: '3.3-5V', current: '1.5mA', notes: 'Single wire, 10kΩ pull-up' },
    'ds18b20': { name: 'DS18B20', type: 'sensor', pins: [{ name: 'DATA', pin: 'GPIO', required: true }], icon: 'thermostat', power: '3.3-5V', current: '1mA', notes: 'OneWire, 4.7kΩ pull-up required' },
    'dht': { name: 'DHT', type: 'sensor', pins: [{ name: 'DATA', pin: 'GPIO', required: true }], icon: 'thermostat', power: '3.3-5V', current: '1mA', notes: 'Single wire' },
    
    // I2C Environmental Sensors
    'bmp280': { name: 'BMP280', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'compress', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up required' },
    'bme280': { name: 'BME280', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'compress', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up required' },
    'bme680': { name: 'BME680', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'air', power: '3.3V', current: '18mA', notes: 'I2C 4.7kΩ pull-up, gas sensor' },
    'aht10': { name: 'AHT10', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'thermostat', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up required' },
    'aht20': { name: 'AHT20', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'thermostat', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up required' },
    'aht21': { name: 'AHT21', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'thermostat', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up required' },
    'sht3x': { name: 'SHT3x', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'thermostat', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up required' },
    'sht4x': { name: 'SHT4x', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'thermostat', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up required' },
    'si7021': { name: 'SI7021', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'thermostat', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up required' },
    
    // CO2 Sensors
    'scd4x': { name: 'SCD4x', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'co2', power: '3.3-5V', current: '15mA', notes: 'I2C, requires calibration' },
    'scd40': { name: 'SCD40', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'co2', power: '3.3-5V', current: '15mA', notes: 'I2C, requires calibration' },
    'scd41': { name: 'SCD41', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'co2', power: '3.3-5V', current: '15mA', notes: 'I2C, requires calibration' },
    'mhz19': { name: 'MH-Z19', type: 'sensor', pins: [{ name: 'TX', pin: 'GPIO', bus: 'UART' }, { name: 'RX', pin: 'GPIO', bus: 'UART' }], icon: 'co2', power: '5V', current: '30mA', notes: 'UART 9600 baud' },
    'senseair_s8': { name: 'SenseAir S8', type: 'sensor', pins: [{ name: 'TX', pin: 'GPIO', bus: 'UART' }, { name: 'RX', pin: 'GPIO', bus: 'UART' }], icon: 'co2', power: '5V', current: '30mA', notes: 'UART 9600 baud' },
    
    // Air Quality Sensors
    'pms5003': { name: 'PMS5003', type: 'sensor', pins: [{ name: 'TX', pin: 'GPIO', bus: 'UART' }, { name: 'RX', pin: 'GPIO', bus: 'UART' }], icon: 'air', power: '5V', current: '100mA', notes: 'UART 9600 baud' },
    'pms7003': { name: 'PMS7003', type: 'sensor', pins: [{ name: 'TX', pin: 'GPIO', bus: 'UART' }, { name: 'RX', pin: 'GPIO', bus: 'UART' }], icon: 'air', power: '5V', current: '100mA', notes: 'UART 9600 baud' },
    'pmsx003': { name: 'PMSx003', type: 'sensor', pins: [{ name: 'TX', pin: 'GPIO', bus: 'UART' }, { name: 'RX', pin: 'GPIO', bus: 'UART' }], icon: 'air', power: '5V', current: '100mA', notes: 'UART 9600 baud' },
    'sds011': { name: 'SDS011', type: 'sensor', pins: [{ name: 'TX', pin: 'GPIO', bus: 'UART' }, { name: 'RX', pin: 'GPIO', bus: 'UART' }], icon: 'air', power: '5V', current: '70mA', notes: 'UART 9600 baud' },
    
    // Presence Sensors (mmWave)
    'ld2410': { name: 'LD2410', type: 'sensor', pins: [{ name: 'TX', pin: 'GPIO', bus: 'UART' }, { name: 'RX', pin: 'GPIO', bus: 'UART' }], icon: 'sensors', power: '5V', current: '50mA', notes: 'UART 256000 baud, 5V logic' },
    'ld2410c': { name: 'LD2410C', type: 'sensor', pins: [{ name: 'TX', pin: 'GPIO', bus: 'UART' }, { name: 'RX', pin: 'GPIO', bus: 'UART' }], icon: 'sensors', power: '5V', current: '50mA', notes: 'UART 256000 baud, 5V logic' },
    'ld1125h': { name: 'LD1125H', type: 'sensor', pins: [{ name: 'TX', pin: 'GPIO', bus: 'UART' }, { name: 'RX', pin: 'GPIO', bus: 'UART' }], icon: 'sensors', power: '5V', current: '40mA', notes: 'UART connection' },
    'mr24hpc1': { name: 'MR24HPC1', type: 'sensor', pins: [{ name: 'TX', pin: 'GPIO', bus: 'UART' }, { name: 'RX', pin: 'GPIO', bus: 'UART' }], icon: 'sensors', power: '5V', current: '60mA', notes: 'UART 9600 baud' },
    
    // Distance Sensors
    'vl53l0x': { name: 'VL53L0X', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'straighten', power: '3.3V', current: '19mA', notes: 'I2C 4.7kΩ pull-up, TOF sensor' },
    'vl53l1x': { name: 'VL53L1X', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'straighten', power: '3.3V', current: '19mA', notes: 'I2C 4.7kΩ pull-up, TOF sensor' },
    'hcsr04': { name: 'HC-SR04', type: 'sensor', pins: [{ name: 'TRIG', pin: 'GPIO' }, { name: 'ECHO', pin: 'GPIO' }], icon: 'straighten', power: '5V', current: '15mA', notes: '5V logic on ECHO pin' },
    'rcwl0516': { name: 'RCWL-0516', type: 'sensor', pins: [{ name: 'OUT', pin: 'GPIO' }], icon: 'motion_photos_on', power: '5V', current: '5mA', notes: 'Microwave motion sensor' },
    
    // Current/Voltage Sensors
    'ina219': { name: 'INA219', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'bolt', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up, shunt required' },
    'ina226': { name: 'INA226', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'bolt', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up, shunt required' },
    'ina3221': { name: 'INA3221', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'bolt', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up, 3-channel' },
    
    // Displays
    'ssd1306': { name: 'SSD1306 OLED', type: 'display', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'screenshot_monitor', power: '3.3V', current: '20mA', notes: 'I2C 4.7kΩ pull-up' },
    'ssd1309': { name: 'SSD1309 OLED', type: 'display', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'screenshot_monitor', power: '3.3V', current: '20mA', notes: 'I2C 4.7kΩ pull-up' },
    'st7789': { name: 'ST7789 TFT', type: 'display', pins: [{ name: 'CS', pin: 'GPIO' }, { name: 'DC', pin: 'GPIO' }, { name: 'RST', pin: 'GPIO' }, { name: 'MOSI', pin: 'GPIO', bus: 'SPI' }, { name: 'CLK', pin: 'GPIO', bus: 'SPI' }], icon: 'screenshot_monitor', power: '3.3V', current: '25mA', notes: 'SPI connection' },
    'st7735': { name: 'ST7735 TFT', type: 'display', pins: [{ name: 'CS', pin: 'GPIO' }, { name: 'DC', pin: 'GPIO' }, { name: 'RST', pin: 'GPIO' }, { name: 'MOSI', pin: 'GPIO', bus: 'SPI' }, { name: 'CLK', pin: 'GPIO', bus: 'SPI' }], icon: 'screenshot_monitor', power: '3.3V', current: '25mA', notes: 'SPI connection' },
    'ili9341': { name: 'ILI9341 TFT', type: 'display', pins: [{ name: 'CS', pin: 'GPIO' }, { name: 'DC', pin: 'GPIO' }, { name: 'RST', pin: 'GPIO' }, { name: 'MOSI', pin: 'GPIO', bus: 'SPI' }, { name: 'CLK', pin: 'GPIO', bus: 'SPI' }, { name: 'MISO', pin: 'GPIO', bus: 'SPI' }], icon: 'screenshot_monitor', power: '3.3V', current: '50mA', notes: 'SPI connection, touch optional' },
    'ili9488': { name: 'ILI9488 TFT', type: 'display', pins: [{ name: 'CS', pin: 'GPIO' }, { name: 'DC', pin: 'GPIO' }, { name: 'RST', pin: 'GPIO' }, { name: 'MOSI', pin: 'GPIO', bus: 'SPI' }, { name: 'CLK', pin: 'GPIO', bus: 'SPI' }], icon: 'screenshot_monitor', power: '3.3V', current: '50mA', notes: 'SPI connection' },
    'ws2812b': { name: 'WS2812B LED', type: 'display', pins: [{ name: 'DATA', pin: 'GPIO' }], icon: 'lightbulb', power: '5V', current: '60mA/LED', notes: 'External power for >8 LEDs' },
    'tm1637': { name: 'TM1637 Display', type: 'display', pins: [{ name: 'CLK', pin: 'GPIO' }, { name: 'DIO', pin: 'GPIO' }], icon: 'screenshot_monitor', power: '5V', current: '20mA', notes: '2-wire interface' },
    'max7219': { name: 'MAX7219 Matrix', type: 'display', pins: [{ name: 'CS', pin: 'GPIO' }, { name: 'DIN', pin: 'GPIO', bus: 'SPI' }, { name: 'CLK', pin: 'GPIO', bus: 'SPI' }], icon: 'screenshot_monitor', power: '5V', current: '100mA', notes: 'SPI connection' },
    
    // Input Devices
    'rotary_encoder': { name: 'Rotary Encoder', type: 'input', pins: [{ name: 'A', pin: 'GPIO' }, { name: 'B', pin: 'GPIO' }, { name: 'SW', pin: 'GPIO', optional: true }], icon: 'settings', power: '3.3V', current: '1mA', notes: 'Pull-up resistors recommended' },
    'keypad_4x4': { name: 'Keypad 4x4', type: 'input', pins: [{ name: 'R1', pin: 'GPIO' }, { name: 'R2', pin: 'GPIO' }, { name: 'R3', pin: 'GPIO' }, { name: 'R4', pin: 'GPIO' }, { name: 'C1', pin: 'GPIO' }, { name: 'C2', pin: 'GPIO' }, { name: 'C3', pin: 'GPIO' }, { name: 'C4', pin: 'GPIO' }], icon: 'keyboard', power: '3.3V', current: '5mA', notes: '8 GPIO pins required' },
    'button': { name: 'Button', type: 'input', pins: [{ name: 'IN', pin: 'GPIO' }], icon: 'radio_button_checked', power: '3.3V', current: '1mA', notes: 'Internal pull-up available' },
    'touch': { name: 'Touch Sensor', type: 'input', pins: [{ name: 'OUT', pin: 'GPIO' }], icon: 'touch_app', power: '3.3V', current: '1mA', notes: 'Capacitive touch' },
    'mpr121': { name: 'MPR121 Touch', type: 'input', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'touch_app', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up, 12 touch channels' },
    'ttp223': { name: 'TTP223 Touch', type: 'input', pins: [{ name: 'OUT', pin: 'GPIO' }], icon: 'touch_app', power: '3.3V', current: '1mA', notes: 'Single touch pad' },
    
    // RFID/NFC
    'rc522': { name: 'RC522 RFID', type: 'communication', pins: [{ name: 'CS', pin: 'GPIO' }, { name: 'MOSI', pin: 'GPIO', bus: 'SPI' }, { name: 'MISO', pin: 'GPIO', bus: 'SPI' }, { name: 'CLK', pin: 'GPIO', bus: 'SPI' }], icon: 'nfc', power: '3.3V', current: '20mA', notes: 'SPI connection' },
    'pn532': { name: 'PN532 NFC', type: 'communication', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'nfc', power: '3.3V', current: '50mA', notes: 'I2C or UART mode' },
    
    // Communication
    'uart_device': { name: 'UART Device', type: 'communication', pins: [{ name: 'TX', pin: 'GPIO', bus: 'UART' }, { name: 'RX', pin: 'GPIO', bus: 'UART' }], icon: 'swap_horiz', power: '3.3-5V', current: '~50mA', notes: 'Check voltage levels' },
    'rs485': { name: 'RS485', type: 'communication', pins: [{ name: 'TX', pin: 'GPIO', bus: 'UART' }, { name: 'RX', pin: 'GPIO', bus: 'UART' }, { name: 'DE', pin: 'GPIO', optional: true }], icon: 'swap_horiz', power: '5V', current: '50mA', notes: 'MAX485 transceiver required' },
    'can_bus': { name: 'CAN Bus', type: 'communication', pins: [{ name: 'TX', pin: 'GPIO' }, { name: 'RX', pin: 'GPIO' }], icon: 'swap_horiz', power: '3.3V', current: '50mA', notes: 'CAN transceiver required' },
    'ethernet': { name: 'W5500 Ethernet', type: 'communication', pins: [{ name: 'CS', pin: 'GPIO' }, { name: 'MOSI', pin: 'GPIO', bus: 'SPI' }, { name: 'MISO', pin: 'GPIO', bus: 'SPI' }, { name: 'CLK', pin: 'GPIO', bus: 'SPI' }, { name: 'RST', pin: 'GPIO', optional: true }], icon: 'lan', power: '3.3V', current: '150mA', notes: 'SPI connection' },
    
    // LoRa/RF
    'sx1276': { name: 'SX1276 LoRa', type: 'communication', pins: [{ name: 'CS', pin: 'GPIO' }, { name: 'MOSI', pin: 'GPIO', bus: 'SPI' }, { name: 'MISO', pin: 'GPIO', bus: 'SPI' }, { name: 'CLK', pin: 'GPIO', bus: 'SPI' }, { name: 'DIO0', pin: 'GPIO' }], icon: 'wifi', power: '3.3V', current: '100mA', notes: 'SPI + DIO pins' },
    'sx1278': { name: 'SX1278 LoRa', type: 'communication', pins: [{ name: 'CS', pin: 'GPIO' }, { name: 'MOSI', pin: 'GPIO', bus: 'SPI' }, { name: 'MISO', pin: 'GPIO', bus: 'SPI' }, { name: 'CLK', pin: 'GPIO', bus: 'SPI' }, { name: 'DIO0', pin: 'GPIO' }], icon: 'wifi', power: '3.3V', current: '100mA', notes: 'SPI + DIO pins' },
    'cc1101': { name: 'CC1101 RF', type: 'communication', pins: [{ name: 'CS', pin: 'GPIO' }, { name: 'MOSI', pin: 'GPIO', bus: 'SPI' }, { name: 'MISO', pin: 'GPIO', bus: 'SPI' }, { name: 'CLK', pin: 'GPIO', bus: 'SPI' }], icon: 'wifi', power: '3.3V', current: '30mA', notes: '433MHz RF module' },
    'nrf24l01': { name: 'nRF24L01', type: 'communication', pins: [{ name: 'CS', pin: 'GPIO' }, { name: 'CE', pin: 'GPIO' }, { name: 'MOSI', pin: 'GPIO', bus: 'SPI' }, { name: 'MISO', pin: 'GPIO', bus: 'SPI' }, { name: 'CLK', pin: 'GPIO', bus: 'SPI' }], icon: 'wifi', power: '3.3V', current: '15mA', notes: '2.4GHz RF module' },
    
    // Actuators
    'relay': { name: 'Relay', type: 'actuator', pins: [{ name: 'IN', pin: 'GPIO' }], icon: 'power', power: '5V', current: '70mA', notes: 'Optocoupler recommended' },
    'servo': { name: 'Servo', type: 'actuator', pins: [{ name: 'PWM', pin: 'GPIO' }], icon: 'settings_remote', power: '5V', current: '500mA', notes: 'External power recommended' },
    'stepper': { name: 'Stepper Motor', type: 'actuator', pins: [{ name: 'IN1', pin: 'GPIO' }, { name: 'IN2', pin: 'GPIO' }, { name: 'IN3', pin: 'GPIO' }, { name: 'IN4', pin: 'GPIO' }], icon: 'settings', power: '5-12V', current: '500mA+', notes: 'Driver board required' },
    'pwm': { name: 'PWM Output', type: 'actuator', pins: [{ name: 'PWM', pin: 'GPIO' }], icon: 'tune', power: '3.3V', current: '20mA', notes: 'PWM frequency configurable' },
    
    // Lights
    'rgbw': { name: 'RGBW Light', type: 'actuator', pins: [{ name: 'R', pin: 'GPIO' }, { name: 'G', pin: 'GPIO' }, { name: 'B', pin: 'GPIO' }, { name: 'W', pin: 'GPIO' }], icon: 'lightbulb', power: '5-12V', current: '1A/m', notes: 'External power required' },
    'cct': { name: 'CCT Light', type: 'actuator', pins: [{ name: 'CW', pin: 'GPIO' }, { name: 'WW', pin: 'GPIO' }], icon: 'lightbulb', power: '5-12V', current: '500mA', notes: 'External power required' },
    'led_strip': { name: 'LED Strip', type: 'actuator', pins: [{ name: 'DATA', pin: 'GPIO' }], icon: 'lightbulb', power: '5-12V', current: '60mA/LED', notes: 'External power for >8 LEDs' },
    
    // Climate
    'thermostat': { name: 'Thermostat', type: 'actuator', pins: [{ name: 'HEAT', pin: 'GPIO' }, { name: 'COOL', pin: 'GPIO', optional: true }], icon: 'thermostat', power: '3.3V', current: '10mA', notes: 'Relay output required' },
    'fan': { name: 'Fan Control', type: 'actuator', pins: [{ name: 'PWM', pin: 'GPIO' }], icon: 'fan', power: '12V', current: '200mA', notes: 'MOSFET/relay required' },
    
    // I/O Expanders
    'pcf8574': { name: 'PCF8574', type: 'communication', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'developer_board', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up, 8 GPIO' },
    'pcf8575': { name: 'PCF8575', type: 'communication', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'developer_board', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up, 16 GPIO' },
    'mcp23017': { name: 'MCP23017', type: 'communication', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'developer_board', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up, 16 GPIO' },
    'mcp23008': { name: 'MCP23008', type: 'communication', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'developer_board', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up, 8 GPIO' },
    
    // Weight/Load
    'hx711': { name: 'HX711 Load Cell', type: 'sensor', pins: [{ name: 'DT', pin: 'GPIO' }, { name: 'SCK', pin: 'GPIO' }], icon: 'scale', power: '3.3V', current: '1.5mA', notes: '24-bit ADC for load cells' },
    
    // Gesture/Touch
    'apds9960': { name: 'APDS9960 Gesture', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'swipe', power: '3.3V', current: '1mA', notes: 'I2C 4.7kΩ pull-up, gesture + proximity' },
    
    // Other
    'custom_gpio': { name: 'Custom GPIO', type: 'sensor', pins: [{ name: 'PIN', pin: 'GPIO' }], icon: 'memory' }
};

// Peripheral power and connection requirements - Extended
const PERIPHERAL_REQUIREMENTS = {
    // Temperature/Humidity Sensors
    'dht11': { power: '3.3-5V', current: '~1mA', notes: 'Single wire, 10kΩ pull-up' },
    'dht22': { power: '3.3-5V', current: '~1.5mA', notes: 'Single wire, 10kΩ pull-up' },
    'ds18b20': { power: '3.3-5V', current: '~1mA', notes: 'OneWire, 4.7kΩ pull-up required' },
    
    // I2C Environmental Sensors
    'bmp280': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up required' },
    'bme280': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up required' },
    'bme680': { power: '3.3V', current: '~18mA', notes: 'I2C 4.7kΩ pull-up, gas sensor' },
    'aht10': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up required' },
    'aht20': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up required' },
    'aht21': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up required' },
    'sht3x': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up required' },
    'sht4x': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up required' },
    'si7021': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up required' },
    
    // CO2 Sensors
    'scd4x': { power: '3.3-5V', current: '~15mA', notes: 'I2C, requires calibration' },
    'scd40': { power: '3.3-5V', current: '~15mA', notes: 'I2C, requires calibration' },
    'scd41': { power: '3.3-5V', current: '~15mA', notes: 'I2C, requires calibration' },
    'mhz19': { power: '5V', current: '~30mA', notes: 'UART 9600 baud' },
    'senseair_s8': { power: '5V', current: '~30mA', notes: 'UART 9600 baud' },
    
    // Air Quality Sensors
    'pms5003': { power: '5V', current: '~100mA', notes: 'UART 9600 baud' },
    'pms7003': { power: '5V', current: '~100mA', notes: 'UART 9600 baud' },
    'pmsx003': { power: '5V', current: '~100mA', notes: 'UART 9600 baud' },
    'sds011': { power: '5V', current: '~70mA', notes: 'UART 9600 baud' },
    
    // Presence Sensors (mmWave)
    'ld2410': { power: '5V', current: '~50mA', notes: 'UART 256000 baud, 5V logic' },
    'ld2410c': { power: '5V', current: '~50mA', notes: 'UART 256000 baud, 5V logic' },
    'ld1125h': { power: '5V', current: '~40mA', notes: 'UART connection' },
    'mr24hpc1': { power: '5V', current: '~60mA', notes: 'UART 9600 baud' },
    
    // Distance Sensors
    'vl53l0x': { power: '3.3V', current: '~19mA', notes: 'I2C 4.7kΩ pull-up, TOF sensor' },
    'vl53l1x': { power: '3.3V', current: '~19mA', notes: 'I2C 4.7kΩ pull-up, TOF sensor' },
    'hcsr04': { power: '5V', current: '~15mA', notes: '5V logic on ECHO pin' },
    'rcwl0516': { power: '5V', current: '~5mA', notes: 'Microwave motion sensor' },
    
    // Current/Voltage Sensors
    'ina219': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up, shunt required' },
    'ina226': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up, shunt required' },
    'ina3221': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up, 3-channel' },
    
    // Displays
    'ssd1306': { power: '3.3V', current: '~20mA', notes: 'I2C 4.7kΩ pull-up' },
    'ssd1309': { power: '3.3V', current: '~20mA', notes: 'I2C 4.7kΩ pull-up' },
    'st7789': { power: '3.3V', current: '~25mA', notes: 'SPI connection' },
    'st7735': { power: '3.3V', current: '~25mA', notes: 'SPI connection' },
    'ili9341': { power: '3.3V', current: '~50mA', notes: 'SPI connection, touch optional' },
    'ili9488': { power: '3.3V', current: '~50mA', notes: 'SPI connection' },
    'ws2812b': { power: '5V', current: '~60mA/LED', notes: 'External power for >8 LEDs' },
    'tm1637': { power: '5V', current: '~20mA', notes: '2-wire interface' },
    'max7219': { power: '5V', current: '~100mA', notes: 'SPI connection' },
    
    // Input Devices
    'rotary_encoder': { power: '3.3V', current: '~1mA', notes: 'Pull-up resistors recommended' },
    'keypad_4x4': { power: '3.3V', current: '~5mA', notes: '8 GPIO pins required' },
    'button': { power: '3.3V', current: '~1mA', notes: 'Internal pull-up available' },
    'touch': { power: '3.3V', current: '~1mA', notes: 'Capacitive touch' },
    'mpr121': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up, 12 touch channels' },
    'ttp223': { power: '3.3V', current: '~1mA', notes: 'Single touch pad' },
    
    // RFID/NFC
    'rc522': { power: '3.3V', current: '~20mA', notes: 'SPI connection' },
    'pn532': { power: '3.3V', current: '~50mA', notes: 'I2C or UART mode' },
    
    // Communication
    'uart_device': { power: '3.3-5V', current: '~50mA', notes: 'Check voltage levels' },
    'rs485': { power: '5V', current: '~50mA', notes: 'MAX485 transceiver required' },
    'can_bus': { power: '3.3V', current: '~50mA', notes: 'CAN transceiver required' },
    'ethernet': { power: '3.3V', current: '~150mA', notes: 'SPI connection' },
    
    // LoRa/RF
    'sx1276': { power: '3.3V', current: '~100mA', notes: 'SPI + DIO pins' },
    'sx1278': { power: '3.3V', current: '~100mA', notes: 'SPI + DIO pins' },
    'cc1101': { power: '3.3V', current: '~30mA', notes: '433MHz RF module' },
    'nrf24l01': { power: '3.3V', current: '~15mA', notes: '2.4GHz RF module' },
    
    // Actuators
    'relay': { power: '5V', current: '~70mA', notes: 'Optocoupler recommended' },
    'servo': { power: '5V', current: '~500mA', notes: 'External power recommended' },
    'stepper': { power: '5-12V', current: '~500mA+', notes: 'Driver board required' },
    'pwm': { power: '3.3V', current: '~20mA', notes: 'PWM frequency configurable' },
    
    // Lights
    'rgbw': { power: '5-12V', current: '~1A/m', notes: 'External power required' },
    'cct': { power: '5-12V', current: '~500mA', notes: 'External power required' },
    'led_strip': { power: '5-12V', current: '~60mA/LED', notes: 'External power for >8 LEDs' },
    
    // Climate
    'thermostat': { power: '3.3V', current: '~10mA', notes: 'Relay output required' },
    'fan': { power: '12V', current: '~200mA', notes: 'MOSFET/relay required' },
    
    // I/O Expanders
    'pcf8574': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up, 8 GPIO' },
    'pcf8575': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up, 16 GPIO' },
    'mcp23017': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up, 16 GPIO' },
    'mcp23008': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up, 8 GPIO' },
    
    // Weight/Load
    'hx711': { power: '3.3V', current: '~1.5mA', notes: '24-bit ADC for load cells' },
    
    // Gesture/Touch
    'apds9960': { power: '3.3V', current: '~1mA', notes: 'I2C 4.7kΩ pull-up, gesture + proximity' }
};

// Board pin definitions - Accurate pin layouts based on actual board schematics
// Format: leftPins/rightPins for 2-sided boards, topPins/rightPins/bottomPins/leftPins for 4-sided boards
// usbPosition: 'top-left' | 'top-center' | 'bottom-left' | 'bottom-center' | 'left' | 'right'
// Board variants - multiple versions of same chip with different pinouts
const BOARD_VARIANTS = {
    'esp32': {
        displayName: 'ESP32 DevKit V1',
        variants: ['esp32dev', 'esp32dev36'],
        variantLabels: {
            'esp32dev': '30-pin (DOIT Classic)',
            'esp32dev36': '36-pin (Extended)'
        }
    },
    'esp32-s3': {
        displayName: 'ESP32-S3 DevKitC-1',
        variants: ['esp32-s3-devkitc-1'],
        variantLabels: {
            'esp32-s3-devkitc-1': 'Standard'
        }
    },
    'esp32-s3-box': {
        displayName: 'ESP32-S3-Box',
        variants: ['esp32-s3-box', 'esp32-s3-box-3'],
        variantLabels: {
            'esp32-s3-box': 'Box (Original)',
            'esp32-s3-box-3': 'Box-3'
        }
    }
};

const BOARD_PINS = {
    // ESP32 Classic - DOIT DevKit V1 30-pin version (most common)
    'esp32dev': {
        name: 'ESP32 DevKit V1 (30-pin)',
        // USB at top-left corner
        usbPosition: 'top-left',
        // Left side (J1) - fentről lefelé: EN, VP(36), VN(39), D34, D35, D32, D33, D25, D26, D27, D14, D12, D13, GND, D4
        // GPIO only (13 GPIO on left side header)
        leftPins: [36, 39, 34, 35, 32, 33, 25, 26, 27, 14, 12, 13, 4],
        // Right side (J2) - fentről lefelé: VIN, GND, TX(1), RX(3), D19, D18, D5, D17, D16, D15, D8, D7, D6, D11, D10
        // GPIO only (13 GPIO on right side header)
        rightPins: [3, 1, 19, 18, 5, 17, 16, 15, 8, 7, 6, 11, 10],
        totalPins: 26,
        pinLabels: { 
            1: 'TX0', 3: 'RX0', 4: 'D4', 5: 'D5', 6: 'D6', 7: 'D7', 8: 'D8', 10: 'D10', 11: 'D11', 12: 'D12', 13: 'D13', 14: 'D14', 15: 'D15', 16: 'D16', 17: 'D17', 18: 'D18', 19: 'D19', 25: 'D25', 26: 'D26', 27: 'D27', 32: 'D32', 33: 'D33', 34: 'D34', 35: 'D35', 36: 'VP', 39: 'VN'
        },
        notes: 'DOIT 30-pin version, GPIO6-11 flash (not exposed), ADC2 shared with WiFi',
        // Pinout reference table
        pinoutReference: [
            { pin: 0, label: 'D0/BOOT', type: 'GPIO', note: 'Boot mode (strapping)', warn: true },
            { pin: 1, label: 'TX0', type: 'UART', note: 'UART0 TX (USB)' },
            { pin: 2, label: 'D2/LED', type: 'GPIO', note: 'Onboard LED' },
            { pin: 3, label: 'RX0', type: 'UART', note: 'UART0 RX (USB)' },
            { pin: 4, label: 'D4', type: 'GPIO', note: 'Touch 0' },
            { pin: 5, label: 'D5', type: 'GPIO', note: 'Touch 1' },
            { pin: 12, label: 'D12', type: 'GPIO', note: 'Touch 5, MISO' },
            { pin: 13, label: 'D13', type: 'GPIO', note: 'Touch 4, MOSI' },
            { pin: 14, label: 'D14', type: 'GPIO', note: 'Touch 6, SCK' },
            { pin: 15, label: 'D15', type: 'GPIO', note: 'Touch 3, SS' },
            { pin: 16, label: 'D16', type: 'GPIO', note: 'I2C SDA (default)' },
            { pin: 17, label: 'D17', type: 'GPIO', note: 'I2C SCL (default)' },
            { pin: 18, label: 'D18', type: 'GPIO', note: 'Touch 7, MOSI' },
            { pin: 19, label: 'D19', type: 'GPIO', note: 'Touch 8, MISO' },
            { pin: 21, label: 'D21/SDA', type: 'I2C', note: 'Touch 7, I2C SDA' },
            { pin: 22, label: 'D22/SCL', type: 'I2C', note: 'Touch 6, I2C SCL' },
            { pin: 23, label: 'D23', type: 'GPIO', note: 'Touch 5' },
            { pin: 25, label: 'D25', type: 'GPIO', note: 'DAC 1' },
            { pin: 26, label: 'D26', type: 'GPIO', note: 'DAC 2' },
            { pin: 27, label: 'D27', type: 'GPIO', note: 'Touch 0' },
            { pin: 32, label: 'D32', type: 'GPIO', note: 'Touch 9' },
            { pin: 33, label: 'D33', type: 'GPIO', note: 'Touch 8' },
            { pin: 34, label: 'D34', type: 'INPUT', note: 'Input only', warn: true },
            { pin: 35, label: 'D35', type: 'INPUT', note: 'Input only', warn: true },
            { pin: 36, label: 'VP', type: 'INPUT', note: 'Input only, ADC1_CH0', warn: true },
            { pin: 39, label: 'VN', type: 'INPUT', note: 'Input only, ADC1_CH3', warn: true }
        ]
    },
    // ESP32 Classic - DOIT DevKit V1 36-pin version (extended)
    'esp32dev36': {
        name: 'ESP32 DevKit V1 (36-pin)',
        usbPosition: 'top-left',
        // Left side - extended with D2, D0 (BOOT)
        leftPins: [36, 39, 34, 35, 32, 33, 25, 26, 27, 14, 12, 13, 4, 0, 2],
        // Right side - extended with D9, D21, D22, D23
        rightPins: [3, 1, 19, 18, 5, 17, 16, 15, 8, 7, 6, 11, 10, 9, 21, 22, 23],
        totalPins: 34,
        pinLabels: { 
            0: 'BOOT', 1: 'TX0', 2: 'LED', 3: 'RX0', 4: 'D4', 5: 'D5', 6: 'D6', 7: 'D7', 8: 'D8', 9: 'D9', 10: 'D10', 11: 'D11', 12: 'D12', 13: 'D13', 14: 'D14', 15: 'D15', 16: 'D16', 17: 'D17', 18: 'D18', 19: 'D19', 21: 'SDA', 22: 'SCL', 23: 'D23', 25: 'D25', 26: 'D26', 27: 'D27', 32: 'D32', 33: 'D33', 34: 'D34', 35: 'D35', 36: 'VP', 39: 'VN'
        },
        notes: 'DOIT 36-pin extended version, GPIO6-11 flash, ADC2 shared with WiFi'
    },
    'esp32': {
        name: 'ESP32 DevKit V1 (36-pin)',
        usbPosition: 'top-left',
        leftPins: [36, 39, 34, 35, 32, 33, 25, 26, 27, 14, 12, 13, 4, 0, 2],
        rightPins: [3, 1, 19, 18, 5, 17, 16, 15, 8, 7, 6, 11, 10, 9, 21, 22, 23],
        totalPins: 34,
        pinLabels: { 
            0: 'BOOT', 1: 'TX0', 2: 'LED', 3: 'RX0', 4: 'D4', 5: 'D5', 6: 'D6', 7: 'D7', 8: 'D8', 9: 'D9', 10: 'D10', 11: 'D11', 12: 'D12', 13: 'D13', 14: 'D14', 15: 'D15', 16: 'D16', 17: 'D17', 18: 'D18', 19: 'D19', 21: 'SDA', 22: 'SCL', 23: 'D23', 25: 'D25', 26: 'D26', 27: 'D27', 32: 'D32', 33: 'D33', 34: 'D34', 35: 'D35', 36: 'VP', 39: 'VN'
        },
        notes: 'DOIT 36-pin extended version, GPIO6-11 flash, ADC2 shared with WiFi'
    },
    // ESP32-S3 variants - DevKitC-1 v1.1 (36-pin J1 + 14-pin J2 header)
    'esp32-s3-devkitc-1': {
        name: 'ESP32-S3 DevKitC-1',
        usbPosition: 'top-left', // Micro-USB (UART) at top-left corner, USB-C on right side
        // Left side (J1) - GPIO0-21, fentről lefelé (ascending)
        // Physical order: 3V3, EN, VP(4), VM(5), D0, D1(TX0), D2, D3(RX0), D4, D5, D6, D7, D8(SDA), D9(SCL), D10, D11, D12, D13, D14, D15, D16, D17, D18, D19, D20, D21, G, 5V
        leftPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
        // Right side (J2) - GPIO35-48, fentről lefelé (descending)
        // Physical order: 5V, G, D48, D47, D46, D45, D44(USB_RX), D43(USB_TX), D42, D41, D40, D39, D38(RGB_LED), D37*, D36*, D35*, 3V3
        rightPins: [48, 47, 46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35],
        totalPins: 36,
        pinLabels: {
            0: 'D0/BOOT', 1: 'TX0', 2: 'D2', 3: 'RX0', 4: 'D4', 5: 'D5', 6: 'D6', 7: 'D7',
            8: 'SDA', 9: 'SCL', 10: 'D10', 11: 'D11', 12: 'D12', 13: 'D13', 14: 'D14', 15: 'D15',
            16: 'D16', 17: 'D17/UART1_TX', 18: 'D18/UART1_RX', 19: 'D19', 20: 'D20', 21: 'D21',
            35: 'D35*', 36: 'D36*', 37: 'D37*', 38: 'D38/RGB_LED', 39: 'D39', 40: 'D40', 41: 'D41', 42: 'D42',
            43: 'USB_TX', 44: 'USB_RX', 45: 'D45', 46: 'D46', 47: 'D47', 48: 'D48'
        },
        notes: '2 USB ports: Micro-USB (UART, top-left) + USB-C (Native USB, right). GPIO22-34 = flash. *GPIO35-37 = Octal PSRAM',
        // Pinout reference table
        pinoutReference: [
            { pin: 0, label: 'D0/BOOT', type: 'GPIO', note: 'Boot mode (strapping)', warn: true },
            { pin: 1, label: 'TX0', type: 'UART', note: 'UART0 TX' },
            { pin: 2, label: 'D2', type: 'GPIO', note: 'Touch 1' },
            { pin: 3, label: 'RX0', type: 'UART', note: 'UART0 RX (strapping)', warn: true },
            { pin: 4, label: 'D4', type: 'GPIO', note: 'Touch 0, ADC1_CH0' },
            { pin: 5, label: 'D5', type: 'GPIO', note: 'Touch 1, ADC1_CH1' },
            { pin: 6, label: 'D6', type: 'GPIO', note: 'Touch 2, ADC1_CH2' },
            { pin: 7, label: 'D7', type: 'GPIO', note: 'Touch 3, ADC1_CH3' },
            { pin: 8, label: 'SDA', type: 'I2C', note: 'I2C SDA (default)' },
            { pin: 9, label: 'SCL', type: 'I2C', note: 'I2C SCL (default)' },
            { pin: 10, label: 'D10', type: 'GPIO', note: 'Touch 6' },
            { pin: 11, label: 'D11', type: 'GPIO', note: 'Touch 7, ADC2_CH0' },
            { pin: 12, label: 'D12', type: 'GPIO', note: 'Touch 8, ADC2_CH1' },
            { pin: 13, label: 'D13', type: 'GPIO', note: 'Touch 9, ADC2_CH2' },
            { pin: 14, label: 'D14', type: 'GPIO', note: 'Touch 10, ADC2_CH3' },
            { pin: 15, label: 'D15', type: 'GPIO', note: 'Touch 11, ADC2_CH4' },
            { pin: 16, label: 'D16', type: 'GPIO', note: 'Touch 12, ADC2_CH5' },
            { pin: 17, label: 'D17/TX1', type: 'UART', note: 'UART1 TX' },
            { pin: 18, label: 'D18/RX1', type: 'UART', note: 'UART1 RX' },
            { pin: 19, label: 'D19', type: 'GPIO', note: 'ADC2_CH8' },
            { pin: 20, label: 'D20', type: 'GPIO', note: 'ADC2_CH9' },
            { pin: 21, label: 'D21', type: 'GPIO', note: 'ADC2_CH7' },
            { pin: 35, label: 'D35*', type: 'GPIO', note: 'Octal PSRAM', warn: true },
            { pin: 36, label: 'D36*', type: 'GPIO', note: 'Octal PSRAM', warn: true },
            { pin: 37, label: 'D37*', type: 'GPIO', note: 'Octal PSRAM', warn: true },
            { pin: 38, label: 'D38/LED', type: 'GPIO', note: 'RGB LED (v1.1)' },
            { pin: 39, label: 'D39', type: 'GPIO', note: 'MTDO' },
            { pin: 40, label: 'D40', type: 'GPIO', note: 'MTDI' },
            { pin: 41, label: 'D41', type: 'GPIO', note: 'MTCK' },
            { pin: 42, label: 'D42', type: 'GPIO', note: 'MTMS' },
            { pin: 43, label: 'USB_TX', type: 'USB', note: 'Native USB TX' },
            { pin: 44, label: 'USB_RX', type: 'USB', note: 'Native USB RX' },
            { pin: 45, label: 'D45', type: 'GPIO', note: 'Strapping pin', warn: true },
            { pin: 46, label: 'D46', type: 'GPIO', note: 'Strapping pin', warn: true },
            { pin: 47, label: 'D47', type: 'GPIO', note: 'SPICLK' },
            { pin: 48, label: 'D48', type: 'GPIO', note: 'RGB LED (v1.0)' }
        ]
    },
    // ESP32-S3-Box-3 (4-sided board with USB-C, LCD, Touch, Speaker, Mic)
    'esp32-s3-box-3': {
        name: 'ESP32-S3-Box-3',
        usbPosition: 'bottom-center', // USB-C at bottom center
        layout: 'rectangle', // 4-sided layout
        // Top side: USB-C connector (no GPIO)
        topPins: [],
        // Right side: Expansion header GPIOs
        rightPins: [4, 5, 6, 7, 8],
        // Bottom side: USB-C connector
        bottomPins: [],
        // Left side: Expansion header GPIOs
        leftPins: [15, 16, 17, 18, 19, 20, 35, 36, 37, 45, 46],
        totalPins: 16,
        pinLabels: { 
            4: 'D4', 5: 'D5', 6: 'D6', 7: 'D7/MIC_DIN', 8: 'D8/SPK_DOUT',
            15: 'D15', 16: 'D16/MCLK', 17: 'D17/BCLK', 18: 'D18/WS',
            19: 'USB_D-', 20: 'USB_D+',
            35: 'D35*', 36: 'D36*', 37: 'D37*', 45: 'D45', 46: 'D46'
        },
        notes: 'LCD, Touch, Speaker, Mic, Gyro, RGB LED built-in. *GPIO35-37 used by Octal PSRAM. USB-C at bottom'
    },
    'esp32-s3-box': {
        name: 'ESP32-S3-Box',
        usbPosition: 'bottom-center',
        layout: 'rectangle',
        rightPins: [4, 5, 6, 7, 8],
        bottomPins: [],
        leftPins: [15, 16, 17, 18, 19, 20, 35, 36, 37, 45, 46],
        totalPins: 16,
        pinLabels: { 
            4: 'D4', 5: 'D5', 6: 'D6', 7: 'D7/MIC_DIN', 8: 'D8/SPK_DOUT',
            15: 'D15', 16: 'D16/MCLK', 17: 'D17/BCLK', 18: 'D18/WS',
            19: 'USB_D-', 20: 'USB_D+',
            35: 'D35*', 36: 'D36*', 37: 'D37*', 45: 'D45', 46: 'D46'
        },
        notes: 'LCD, Touch, Speaker, Mic, Gyro built-in. *GPIO35-37 used by Octal PSRAM. USB-C at bottom'
    },
    // ESP32-S2 variants - DevKitC-1 (J1 20-pin + J2 14-pin = 34 GPIO available)
    'esp32-s2-devkitc-1': {
        name: 'ESP32-S2 DevKitC-1',
        // Left side (J1) - fentről lefelé
        leftPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
        // Right side (J2) - fentről lefelé (descending!)
        rightPins: [46, 45, 44, 43, 42, 41, 40, 39, 38, 37, 36, 35, 34, 33],
        totalPins: 36,
        pinLabels: { 
            0: 'D0/BOOT', 1: 'TX0', 2: 'D2', 3: 'RX0', 4: 'D4', 5: 'D5', 6: 'D6', 7: 'D7', 8: 'SDA', 9: 'SCL', 10: 'D10', 11: 'D11', 12: 'D12', 13: 'D13', 14: 'D14', 15: 'D15', 16: 'D16', 17: 'D17', 18: 'D18', 19: 'D19', 20: 'D20', 21: 'D21',
            33: 'D33', 34: 'D34', 35: 'D35', 36: 'D36', 37: 'D37', 38: 'D38', 39: 'D39', 40: 'D40', 41: 'D41', 42: 'D42', 43: 'TX', 44: 'RX', 45: 'D45', 46: 'D46'
        },
        notes: 'Native USB, single core, GPIO22-32 internal flash'
    },
    // ESP32-C3 variants - DevKitC-2 (J1 10-pin + J2 12-pin = 22 GPIO available)
    'esp32-c3-devkitc-2': {
        name: 'ESP32-C3 DevKitC-2',
        // Left side (J1) - fentről lefelé
        leftPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        // Right side (J2) - fentről lefelé (descending!)
        rightPins: [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
        totalPins: 22,
        pinLabels: { 
            0: 'D0/BOOT', 1: 'TX0', 2: 'D2', 3: 'RX0', 4: 'D4', 5: 'D5', 6: 'SDA', 7: 'SCL', 8: 'D8', 9: 'D9', 10: 'D10',
            11: 'D11*', 12: 'D12*', 13: 'D13*', 14: 'D14*', 15: 'D15*', 16: 'D16*', 17: 'D17*', 18: 'D18', 19: 'D19', 20: 'D20/USB-', 21: 'D21/USB+'
        },
        notes: 'RISC-V, native USB, *GPIO11-17 connected to internal flash'
    },
    'esp32c3': {
        name: 'ESP32-C3 DevKit',
        leftPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        rightPins: [21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11],
        totalPins: 22,
        pinLabels: { 
            0: 'D0/BOOT', 1: 'TX0', 2: 'D2', 3: 'RX0', 4: 'D4', 5: 'D5', 6: 'SDA', 7: 'SCL', 8: 'D8', 9: 'D9', 10: 'D10',
            11: 'D11*', 12: 'D12*', 13: 'D13*', 14: 'D14*', 15: 'D15*', 16: 'D16*', 17: 'D17*', 18: 'D18', 19: 'D19', 20: 'D20/USB-', 21: 'D21/USB+'
        },
        notes: 'RISC-V, native USB, *GPIO11-17 connected to internal flash'
    },
    // ESP32-C6 - DevKitC-1 (J1 16-pin + J2 15-pin = 31 GPIO available)
    'esp32-c6-devkitc-1': {
        name: 'ESP32-C6 DevKitC-1',
        // Left side - fentről lefelé
        leftPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        // Right side - fentről lefelé (descending!)
        rightPins: [30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16],
        totalPins: 31,
        pinLabels: { 
            0: 'D0/BOOT', 1: 'TX0', 2: 'D2', 3: 'RX0', 4: 'D4', 5: 'D5', 6: 'SDA', 7: 'SCL', 8: 'D8', 9: 'D9', 10: 'D10', 11: 'D11', 12: 'D12', 13: 'D13', 14: 'D14', 15: 'D15',
            16: 'D16', 17: 'D17', 18: 'D18', 19: 'D19', 20: 'D20', 21: 'D21', 22: 'D22', 23: 'D23', 24: 'D24', 25: 'D25', 26: 'D26', 27: 'D27', 28: 'D28', 29: 'D29', 30: 'D30'
        },
        notes: 'RISC-V, WiFi 6, Zigbee, Thread'
    },
    // ESP32-H2 - DevKitM-1 (J1 16-pin + J2 12-pin = 28 GPIO available)
    'esp32-h2-devkitm-1': {
        name: 'ESP32-H2 DevKitM-1',
        // Left side - fentről lefelé
        leftPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        // Right side - fentről lefelé (descending!)
        rightPins: [27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16],
        totalPins: 28,
        pinLabels: { 
            0: 'D0/BOOT', 1: 'TX0', 2: 'D2', 3: 'RX0', 4: 'D4', 5: 'D5', 6: 'SDA', 7: 'SCL', 8: 'D8', 9: 'D9', 10: 'D10', 11: 'D11', 12: 'D12', 13: 'D13', 14: 'D14', 15: 'D15',
            16: 'D16', 17: 'D17', 18: 'D18', 19: 'D19', 20: 'D20', 21: 'D21', 22: 'D22', 23: 'D23', 24: 'D24', 25: 'D25', 26: 'D26', 27: 'D27'
        },
        notes: 'RISC-V, Thread/Zigbee, no WiFi'
    },
    // ESP8266 variants - NodeMCU v1.0 (15-pin left + 15-pin right header)
    'esp8266': {
        name: 'ESP8266 NodeMCU',
        // Left side - fentről lefelé: A0, D0, D1, D2, D3, D4, 3V3, GND, D5, D6, D7, D8, RX, TX
        // GPIO only (D0-D8, RX, TX)
        leftPins: [0, 2, 4, 5, 12, 13, 14, 15, 16],
        // Right side - fentről lefelé: VIN, GND, RST, EN, D9, D10, MOSI, MISO, SCLK
        // GPIO only (D9-D10 are same as D0-D2 on some boards)
        rightPins: [16, 14, 12, 13, 0, 2, 4, 5],
        totalPins: 9,
        pinLabels: { 0: 'D3', 2: 'D4/LED', 4: 'D2', 5: 'D1', 12: 'D6/MISO', 13: 'D7/MOSI', 14: 'D5/SCLK', 15: 'D8', 16: 'D0' },
        notes: 'GPIO6-11 connected to flash (not usable)'
    },
    'nodemcu': {
        name: 'NodeMCU ESP8266',
        leftPins: [0, 2, 4, 5, 12, 13, 14, 15, 16],
        rightPins: [16, 14, 12, 13, 0, 2, 4, 5],
        totalPins: 9,
        pinLabels: { 0: 'D3', 2: 'D4/LED', 4: 'D2', 5: 'D1', 12: 'D6/MISO', 13: 'D7/MOSI', 14: 'D5/SCLK', 15: 'D8', 16: 'D0' },
        notes: 'NodeMCU v1.0, GPIO6-11 connected to flash'
    },
    'd1_mini': {
        name: 'Wemos D1 Mini',
        leftPins: [0, 2, 4, 5, 12, 13, 14, 15, 16],
        rightPins: [16, 14, 12, 13, 0, 2, 4, 5],
        totalPins: 9,
        pinLabels: { 0: 'D3', 2: 'D4/LED', 4: 'D2', 5: 'D1', 12: 'D6/MISO', 13: 'D7/MOSI', 14: 'D5/SCLK', 15: 'D8', 16: 'D0' },
        notes: 'Mini form factor, same pins on both sides'
    },
    // ESP32-S3 generic aliases
    'esp32s3': {
        name: 'ESP32-S3',
        leftPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
        rightPins: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48],
        totalPins: 36,
        pinLabels: { 0: 'D0', 1: 'TX0', 2: 'D2', 3: 'RX0', 4: 'D4', 5: 'D5', 6: 'D6', 7: 'D7', 8: 'SDA', 9: 'SCL', 10: 'D10', 11: 'D11', 12: 'D12', 13: 'D13', 14: 'D14', 15: 'D15', 16: 'D16', 17: 'D17', 18: 'D18', 19: 'D19', 20: 'D20', 21: 'D21', 35: 'D35', 36: 'D36', 37: 'D37', 38: 'D38', 39: 'D39', 40: 'D40', 41: 'D41', 42: 'D42', 43: 'TX', 44: 'RX', 45: 'D45', 46: 'D46', 47: 'D47', 48: 'D48' },
        notes: 'Generic ESP32-S3, GPIO22-34 internal flash'
    },
    'ESP32S3': {
        name: 'ESP32-S3',
        leftPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
        rightPins: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48],
        totalPins: 36,
        pinLabels: { 0: 'D0', 1: 'TX0', 2: 'D2', 3: 'RX0', 4: 'D4', 5: 'D5', 6: 'D6', 7: 'D7', 8: 'SDA', 9: 'SCL', 10: 'D10', 11: 'D11', 12: 'D12', 13: 'D13', 14: 'D14', 15: 'D15', 16: 'D16', 17: 'D17', 18: 'D18', 19: 'D19', 20: 'D20', 21: 'D21', 35: 'D35', 36: 'D36', 37: 'D37', 38: 'D38', 39: 'D39', 40: 'D40', 41: 'D41', 42: 'D42', 43: 'TX', 44: 'RX', 45: 'D45', 46: 'D46', 47: 'D47', 48: 'D48' },
        notes: 'Generic ESP32-S3, GPIO22-34 internal flash'
    },
    'ESP32': {
        name: 'ESP32 DevKit',
        leftPins: [36, 39, 34, 35, 32, 33, 25, 26, 27, 14, 12, 13, 4, 0, 2],
        rightPins: [3, 1, 19, 18, 5, 17, 16, 15, 8, 7, 6, 11, 10, 9, 21, 22, 23],
        totalPins: 30,
        pinLabels: { 0: 'BOOT', 1: 'TX0', 3: 'RX0', 12: 'D12', 13: 'D13', 14: 'D14', 15: 'D15', 16: 'D16', 17: 'D17', 18: 'D18', 19: 'D19', 21: 'SDA', 22: 'SCL', 23: 'D23', 25: 'D25', 26: 'D26', 27: 'D27', 32: 'D32', 33: 'D33', 34: 'D34', 35: 'D35', 36: 'VP', 39: 'VN' }
    }
};

// Parse pins from YAML
function parsePinsFromYaml(yaml) {
    const usedPins = {
        gpio: [],
        i2c: [],
        spi: [],
        uart: [],
        onewire: [],
        adc: []
    };
    
    if (!yaml) return usedPins;
    
    // GPIO patterns
    const gpioPatterns = [
        /pin:\s*(?:GPIO)?(\d+)/gi,
        /- pin:\s*(?:GPIO)?(\d+)/gi
    ];
    
    gpioPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(yaml)) !== null) {
            const pinNum = parseInt(match[1]);
            if (!isNaN(pinNum) && pinNum >= 0 && pinNum <= 48) {
                usedPins.gpio.push({
                    pin: 'GPIO' + pinNum,
                    component: 'GPIO',
                    function: 'GPIO'
                });
            }
        }
    });
    
    // I2C pins
    const i2cMatch = yaml.match(/i2c:[\s\S]*?sda:\s*(?:GPIO)?(\d+)[\s\S]*?scl:\s*(?:GPIO)?(\d+)/i);
    if (i2cMatch) {
        usedPins.i2c.push(
            { pin: 'GPIO' + i2cMatch[1], component: 'I2C', function: 'SDA' },
            { pin: 'GPIO' + i2cMatch[2], component: 'I2C', function: 'SCL' }
        );
    }
    
    // SPI pins
    const spiMatch = yaml.match(/spi:[\s\S]*?(?:mosi_pin:\s*(?:GPIO)?(\d+)[\s\S]*?miso_pin:\s*(?:GPIO)?(\d+)[\s\S]*?clk_pin:\s*(?:GPIO)?(\d+)|clk_pin:\s*(?:GPIO)?(\d+)[\s\S]*?mosi_pin:\s*(?:GPIO)?(\d+)[\s\S]*?miso_pin:\s*(?:GPIO)?(\d+))/i);
    if (spiMatch) {
        const mosi = spiMatch[1] || spiMatch[5];
        const miso = spiMatch[2] || spiMatch[6];
        const clk = spiMatch[3] || spiMatch[4];
        if (mosi) usedPins.spi.push({ pin: 'GPIO' + mosi, component: 'SPI', function: 'MOSI' });
        if (miso) usedPins.spi.push({ pin: 'GPIO' + miso, component: 'SPI', function: 'MISO' });
        if (clk) usedPins.spi.push({ pin: 'GPIO' + clk, component: 'SPI', function: 'CLK' });
    }
    
    // UART pins
    const uartMatch = yaml.match(/uart:[\s\S]*?tx_pin:\s*(?:GPIO)?(\d+)[\s\S]*?rx_pin:\s*(?:GPIO)?(\d+)/i);
    if (uartMatch) {
        usedPins.uart.push(
            { pin: 'GPIO' + uartMatch[1], component: 'UART', function: 'TX' },
            { pin: 'GPIO' + uartMatch[2], component: 'UART', function: 'RX' }
        );
    }
    
    // OneWire pins
    const onewireMatch = yaml.match(/one_wire:[\s\S]*?pin:\s*(?:GPIO)?(\d+)/i);
    if (onewireMatch) {
        usedPins.onewire.push({ pin: 'GPIO' + onewireMatch[1], component: 'OneWire', function: 'DATA' });
    }
    
    // ADC pins
    let match;
    const adcRegex = /pin:\s*(?:GPIO)?(\d+)[\s\S]*?(?:adc|analog)/gi;
    while ((match = adcRegex.exec(yaml)) !== null) {
        usedPins.adc.push({ pin: 'GPIO' + match[1], component: 'ADC', function: 'ADC' });
    }
    
    return usedPins;
}

// Parse peripherals from YAML - Enhanced version
function parsePeripheralsFromYaml(yaml) {
    const peripherals = [];
    
    if (!yaml) return peripherals;
    
    // Track already added pins to avoid duplicates
    const addedPins = new Set();
    
    // Helper to add peripheral if not duplicate
    function addPeripheral(type, name, pins, bus) {
        const key = type + '-' + pins.map(p => p.pin).join(',');
        if (!addedPins.has(key)) {
            addedPins.add(key);
            peripherals.push({ type, name, pins, bus: bus || 'gpio' });
        }
    }
    
    // I2C bus detection
    const i2cMatch = yaml.match(/i2c:[\s\S]*?sda:\s*(?:GPIO)?(\d+)[\s\S]*?scl:\s*(?:GPIO)?(\d+)/i);
    const i2cSda = i2cMatch ? i2cMatch[1] : null;
    const i2cScl = i2cMatch ? i2cMatch[2] : null;
    
    // UART bus detection - multiple patterns
    const uartMatch = yaml.match(/uart:[\s\S]*?(?:rx_pin:\s*(?:GPIO)?(\d+)[\s\S]*?tx_pin:\s*(?:GPIO)?(\d+)|tx_pin:\s*(?:GPIO)?(\d+)[\s\S]*?rx_pin:\s*(?:GPIO)?(\d+))/i);
    const uartRx = uartMatch ? (uartMatch[1] || uartMatch[4]) : null;
    const uartTx = uartMatch ? (uartMatch[2] || uartMatch[3]) : null;
    
    // OneWire detection
    const onewireMatch = yaml.match(/one_wire:[\s\S]*?pin:\s*(?:GPIO)?(\d+)/i);
    const onewirePin = onewireMatch ? onewireMatch[1] : null;
    
    // SPI detection
    const spiMatch = yaml.match(/spi:[\s\S]*?(?:mosi_pin:\s*(?:GPIO)?(\d+)[\s\S]*?miso_pin:\s*(?:GPIO)?(\d+)[\s\S]*?clk_pin:\s*(?:GPIO)?(\d+)|clk_pin:\s*(?:GPIO)?(\d+)[\s\S]*?mosi_pin:\s*(?:GPIO)?(\d+)[\s\S]*?miso_pin:\s*(?:GPIO)?(\d+))/i);
    const spiMosi = spiMatch ? (spiMatch[1] || spiMatch[5]) : null;
    const spiMiso = spiMatch ? (spiMatch[2] || spiMatch[6]) : null;
    const spiClk = spiMatch ? (spiMatch[3] || spiMatch[4]) : null;
    
    // Status LED detection
    const statusLedMatch = yaml.match(/status_led:[\s\S]*?pin:[\s\S]*?number:\s*(?:GPIO)?(\d+)/i) || yaml.match(/status_led:[\s\S]*?pin:\s*(?:GPIO)?(\d+)/i);
    if (statusLedMatch) {
        addPeripheral('status_led', 'Status LED', [{ name: 'LED', pin: 'GPIO' + statusLedMatch[1] }], 'gpio');
    }
    
    // LED Strip (WS2812B, NeoPixel)
    const ledStripMatch = yaml.match(/esp32_rmt_led_strip[\s\S]*?pin:\s*(?:GPIO)?(\d+)/i);
    if (ledStripMatch) {
        addPeripheral('ws2812b', 'WS2812B LED Strip', [{ name: 'DATA', pin: 'GPIO' + ledStripMatch[1] }], 'gpio');
    }
    
    // I2C devices detection - check for multiple devices on same bus
    if (i2cSda && i2cScl) {
        // AHT10/AHT20/AHT21
        const ahtMatch = yaml.match(/platform:\s*aht1[02]/i);
        if (ahtMatch) {
            const pType = PERIPHERAL_TYPES['aht20'] || PERIPHERAL_TYPES['aht10'];
            addPeripheral('aht20', (pType && pType.name) || 'AHT20 Temp/Hum', [
                { name: 'SDA', pin: 'GPIO' + i2cSda, bus: 'I2C' },
                { name: 'SCL', pin: 'GPIO' + i2cScl, bus: 'I2C' }
            ], 'i2c');
        }
        
        // BMP280
        const bmpMatch = yaml.match(/platform:\s*bmp280/i);
        if (bmpMatch) {
            addPeripheral('bmp280', 'BMP280 Pressure/Temp', [
                { name: 'SDA', pin: 'GPIO' + i2cSda, bus: 'I2C' },
                { name: 'SCL', pin: 'GPIO' + i2cScl, bus: 'I2C' }
            ], 'i2c');
        }
        
        // BME280
        const bmeMatch = yaml.match(/platform:\s*bme280/i);
        if (bmeMatch) {
            addPeripheral('bme280', 'BME280 Temp/Hum/Pressure', [
                { name: 'SDA', pin: 'GPIO' + i2cSda, bus: 'I2C' },
                { name: 'SCL', pin: 'GPIO' + i2cScl, bus: 'I2C' }
            ], 'i2c');
        }
        
        // SHT3x/SHT4x
        const shtMatch = yaml.match(/platform:\s*sht[34]x?/i);
        if (shtMatch) {
            addPeripheral('sht3x', 'SHT3x Temp/Hum', [
                { name: 'SDA', pin: 'GPIO' + i2cSda, bus: 'I2C' },
                { name: 'SCL', pin: 'GPIO' + i2cScl, bus: 'I2C' }
            ], 'i2c');
        }
        
        // SCD4x
        const scdMatch = yaml.match(/platform:\s*scd4x?/i);
        if (scdMatch) {
            addPeripheral('scd4x', 'SCD4x CO2', [
                { name: 'SDA', pin: 'GPIO' + i2cSda, bus: 'I2C' },
                { name: 'SCL', pin: 'GPIO' + i2cScl, bus: 'I2C' }
            ], 'i2c');
        }
        
        // If no I2C devices found, show bus indicator
        if (!peripherals.some(p => p.bus === 'i2c')) {
            addPeripheral('i2c_bus', 'I2C Bus', [
                { name: 'SDA', pin: 'GPIO' + i2cSda, bus: 'I2C' },
                { name: 'SCL', pin: 'GPIO' + i2cScl, bus: 'I2C' }
            ], 'i2c');
        }
    }
    
    // UART devices - LD1125H mmWave
    if (uartRx && uartTx) {
        const ldMatch = yaml.match(/ld1125h|LD1125H|mmWave/i);
        if (ldMatch) {
            addPeripheral('ld1125h', 'LD1125H mmWave Presence', [
                { name: 'RX', pin: 'GPIO' + uartRx, bus: 'UART' },
                { name: 'TX', pin: 'GPIO' + uartTx, bus: 'UART' }
            ], 'uart');
        } else {
            addPeripheral('uart_bus', 'UART Bus', [
                { name: 'RX', pin: 'GPIO' + uartRx, bus: 'UART' },
                { name: 'TX', pin: 'GPIO' + uartTx, bus: 'UART' }
            ], 'uart');
        }
    }
    
    // DHT sensors
    const dhtMatches = [...yaml.matchAll(/platform:\s*dht[\s\S]*?pin:\s*(?:GPIO)?(\d+)/gi)];
    dhtMatches.forEach((m, i) => {
        const model = yaml.match(/model:\s*(\w+)/i);
        const modelName = model ? model[1].toUpperCase() : 'DHT22';
        addPeripheral('dht22', 'DHT ' + modelName + ' ' + (i + 1), [{ name: 'DATA', pin: 'GPIO' + m[1] }], 'gpio');
    });
    
    // ADC sensors
    const adcMatches = [...yaml.matchAll(/platform:\s*adc[\s\S]*?pin:\s*(?:GPIO)?(\d+)/gi)];
    adcMatches.forEach((m, i) => {
        addPeripheral('adc', 'ADC Sensor ' + (i + 1), [{ name: 'IN', pin: 'GPIO' + m[1] }], 'adc');
    });
    
    // GPIO binary sensors
    const gpioBinaryMatches = [...yaml.matchAll(/platform:\s*gpio[\s\S]*?(?:pin:[\s\S]*?number:\s*(?:GPIO)?(\d+)|pin:\s*(?:GPIO)?(\d+))/gi)];
    gpioBinaryMatches.forEach((m, i) => {
        const pinNum = m[1] || m[2];
        if (pinNum) {
            addPeripheral('button', 'Button ' + (i + 1), [{ name: 'IN', pin: 'GPIO' + pinNum }], 'gpio');
        }
    });
    
    // GPIO switches/relays
    const switchMatches = [...yaml.matchAll(/platform:\s*gpio[\s\S]*?pin:\s*(?:GPIO)?(\d+)/gi)];
    switchMatches.forEach((m, i) => {
        // Skip if already added as binary sensor
        if (!peripherals.some(p => p.pins.some(pin => pin.pin === 'GPIO' + m[1]))) {
            addPeripheral('relay', 'Relay ' + (i + 1), [{ name: 'OUT', pin: 'GPIO' + m[1] }], 'actuator');
        }
    });
    
    // OneWire / Dallas
    if (onewirePin) {
        addPeripheral('ds18b20', 'Dallas Temperature', [{ name: 'DATA', pin: 'GPIO' + onewirePin, bus: 'OneWire' }], 'onewire');
    }
    
    return peripherals;
}

// Calculate pin statistics
function calculatePinStatistics(usedPins, boardPins) {
    const allPins = [...(boardPins.leftPins || []), ...(boardPins.rightPins || [])];
    const usedPinNums = new Set();
    
    Object.values(usedPins).flat().filter(Boolean).forEach(pin => {
        const pinNum = parseInt((pin.pin || '').toString().replace('GPIO', ''));
        if (!isNaN(pinNum)) {
            usedPinNums.add(pinNum);
        }
    });
    
    return {
        totalPins: boardPins.totalPins || allPins.length,
        usedPins: usedPinNums.size,
        freePins: (boardPins.totalPins || allPins.length) - usedPinNums.size
    };
}

// Render peripheral card
function renderPeripheralCard(peripheral) {
    const pType = PERIPHERAL_TYPES[peripheral.type] || { name: peripheral.type, type: 'sensor', icon: 'memory' };
    const iconClass = pType.type;
    const reqs = PERIPHERAL_REQUIREMENTS[peripheral.type] || {};
    
    return '<div class="peripheral-card ' + iconClass + '">' +
        '<div class="peripheral-header">' +
            '<span class="material-icons peripheral-icon">' + (pType.icon || 'memory') + '</span>' +
            '<div class="peripheral-name">' + (peripheral.name || pType.name) + '</div>' +
        '</div>' +
        '<div class="peripheral-pins">' +
            (peripheral.pins && peripheral.pins.map(function(pin) {
                return '<div class="peripheral-pin ' + (pin.bus ? pin.bus.toLowerCase() : 'gpio') + '">' +
                    '<strong>' + pin.name + ':</strong> ' + pin.pin +
                '</div>';
            }).join('') || '') +
        '</div>' +
        (reqs.power ? '<div class="peripheral-power"><span class="power-badge' + (reqs.power.indexOf('5V') !== -1 ? ' v5' : '') + '">' + reqs.power + ' • ' + reqs.current + '</span></div>' : '') +
        (reqs.notes ? '<div class="peripheral-notes">' + reqs.notes + '</div>' : '') +
    '</div>';
}

// Render connection diagram
function renderConnectionDiagram(peripherals, boardPins) {
    return '<div class="connection-diagram">' +
        '<h4 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">' +
            '<span class="material-icons">cable</span>' +
            'Pin Connections' +
        '</h4>' +
        (peripherals && peripherals.map(function(p) { return renderConnectionRow(p, boardPins); }).join('') || '') +
    '</div>';
}

// Render connection row
function renderConnectionRow(peripheral, boardPins) {
    const pType = PERIPHERAL_TYPES[peripheral.type] || { name: peripheral.type, icon: 'memory' };
    const pins = peripheral.pins && peripheral.pins.map(function(p) { return p.pin; }).join(', ') || '';
    
    return '<div class="connection-row">' +
        '<div class="connection-node chip">' +
            '<span class="material-icons">developer_board</span>' +
            '<small>ESP32</small>' +
        '</div>' +
        '<div class="connection-line" data-pins="' + pins + '"></div>' +
        '<div class="connection-node peripheral">' +
            '<span class="material-icons">' + (pType.icon || 'memory') + '</span>' +
            '<small>' + (peripheral.name || pType.name) + '</small>' +
        '</div>' +
    '</div>';
}

// Render spider pins - LEFT COLUMN (pins descending), RIGHT COLUMN (pins ascending)
function renderSpiderPins(boardPins, pinConnections, peripherals) {
    // Ensure boardPins has valid arrays
    var leftPins = boardPins && boardPins.leftPins ? boardPins.leftPins : [];
    var rightPins = boardPins && boardPins.rightPins ? boardPins.rightPins : [];
    
    // Build peripheral lookup
    var peripheralLookup = {};
    if (peripherals && Array.isArray(peripherals)) {
        peripherals.forEach(function(p) {
            if (p.pins && Array.isArray(p.pins)) {
                p.pins.forEach(function(pin) {
                    var pinNum = parseInt((pin.pin || '').toString().replace('GPIO', ''));
                    if (!isNaN(pinNum) && !peripheralLookup[pinNum]) {
                        peripheralLookup[pinNum] = { name: p.name, type: p.type, icon: p.icon || 'memory' };
                    }
                });
            }
        });
    }
    
    var pinLabels = {
        0: 'BOOT', 1: 'TX0', 3: 'RX0', 16: 'RX2', 17: 'TX2',
        21: 'SDA', 22: 'SCL', 25: 'DAC1', 26: 'DAC2',
        34: 'IN34', 35: 'IN35', 36: 'VP', 39: 'VN'
    };
    
    // Render a single pin row
    function renderPin(pinNum, side) {
        var connections = pinConnections[pinNum] || [];
        var peripheral = peripheralLookup[pinNum];
        var isUsed = connections.length > 0 || peripheral;
        var label = pinLabels[pinNum] || ('GPIO' + pinNum);
        
        var pinType = 'gpio';
        var connectorClass = '';
        var peripheralClass = '';
        var functionText = '';
        var peripheralText = '';
        
        if (connections.length > 0) {
            var conn = connections[0];
            pinType = (conn.component || 'gpio').toLowerCase();
            connectorClass = pinType;
            peripheralClass = pinType;
            functionText = conn.function || conn.component || 'GPIO';
        }
        
        if (peripheral) {
            peripheralText = peripheral.name;
            if (connections.length === 0) {
                pinType = peripheral.type || 'gpio';
                connectorClass = pinType;
                peripheralClass = pinType;
            }
        }
        
        if (side === 'left') {
            return '<div class="pin-row ' + (isUsed ? 'used' : '') + '">' +
                '<span class="pin-number ' + (isUsed ? 'used' : '') + '">' + pinNum + '</span>' +
                '<span class="pin-label ' + (isUsed ? 'used' : '') + '">' + label + '</span>' +
                '<div class="pin-connector ' + connectorClass + '"></div>' +
                '<span class="pin-function">' + functionText + '</span>' +
                (peripheral ? '<span class="pin-peripheral ' + peripheralClass + '"><span class="material-icons peripheral-icon" style="font-size: 12px;">' + peripheral.icon + '</span>' + peripheralText + '</span>' : '') +
            '</div>';
        } else {
            return '<div class="pin-row pin-right ' + (isUsed ? 'used' : '') + '">' +
                (peripheral ? '<span class="pin-peripheral ' + peripheralClass + '"><span class="material-icons peripheral-icon" style="font-size: 12px;">' + peripheral.icon + '</span>' + peripheralText + '</span>' : '') +
                '<span class="pin-function">' + functionText + '</span>' +
                '<div class="pin-connector ' + connectorClass + '"></div>' +
                '<span class="pin-label ' + (isUsed ? 'used' : '') + '">' + label + '</span>' +
                '<span class="pin-number ' + (isUsed ? 'used' : '') + '">' + pinNum + '</span>' +
            '</div>';
        }
    }
    
    // Handle empty pins array
    if (leftPins.length === 0 && rightPins.length === 0) {
        return '<div class="pin-row"><span style="color: var(--text-secondary);">No pins configured for this board</span></div>';
    }
    
    // Sort pins - left pins descending (bottom to top), right pins ascending
    var leftSorted = leftPins.slice().sort(function(a, b) { return b - a; });
    var rightSorted = rightPins.slice().sort(function(a, b) { return a - b; });
    
    var leftHtml = leftSorted.map(function(pin) { return renderPin(pin, 'left'); }).join('');
    var rightHtml = rightSorted.map(function(pin) { return renderPin(pin, 'right'); }).join('');
    
    return '<div class="pin-columns">' +
        '<div class="pin-column pin-column-left">' + leftHtml + '</div>' +
        '<div class="pin-column pin-column-right">' + rightHtml + '</div>' +
    '</div>';
}

// Render full chip visualization with peripherals - Spider style
function renderFullChipVisualization(deviceName, platform, board, yamlContent) {
    var boardPins = BOARD_PINS[board] || BOARD_PINS['esp32dev'];
    var usedPins = parsePinsFromYaml(yamlContent || '');
    var peripherals = parsePeripheralsFromYaml(yamlContent || '');
    
    var container = document.createElement('div');
    container.className = 'chip-visualization';
    
    // Statistics
    var stats = calculatePinStatistics(usedPins, boardPins);
    
    // Build pin connections map
    var pinConnections = {};
    Object.values(usedPins).flat().filter(Boolean).forEach(function(pin) {
        var pinNum = parseInt((pin.pin || '').toString().replace('GPIO', ''));
        if (!isNaN(pinNum)) {
            if (!pinConnections[pinNum]) pinConnections[pinNum] = [];
            pinConnections[pinNum].push(pin);
        }
    });
    
    // Get all used pin numbers sorted
    var allPins = boardPins.leftPins.concat(boardPins.rightPins);
    var usedPinNums = Object.keys(pinConnections).map(Number).filter(function(n) { return allPins.includes(n); }).sort(function(a, b) { return a - b; });
    
    container.innerHTML = '<style>' +
        '.spider-chip-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 16px; }' +
        '.spider-chip { background: linear-gradient(135deg, var(--bg-secondary, #1a1a2e) 0%, var(--bg, #16213e) 100%); border: 2px solid var(--border, #333); border-radius: 12px; padding: 20px; margin: 10px 0; }' +
        '.spider-chip-header { text-align: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--border, #333); }' +
        '.spider-chip-header h3 { margin: 0; color: var(--text-primary, #fff); font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 8px; }' +
        '.spider-chip-header .chip-badge { background: var(--primary, #4a90d9); color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }' +
        '.pin-rows { display: flex; flex-direction: column; gap: 2px; }' +
        '.pin-columns { display: flex; gap: 0; justify-content: center; }' +
        '.pin-column { flex: 0 0 auto; display: flex; flex-direction: column; gap: 2px; min-width: 180px; }' +
        '.pin-column-left { text-align: right; padding-right: 8px; border-right: 2px solid var(--border, #333); }' +
        '.pin-column-right { text-align: left; padding-left: 8px; border-left: 2px solid var(--border, #333); }' +
        '.chip-center-column { display: flex; flex-direction: column; align-items: center; justify-content: center; min-width: 120px; padding: 16px; background: linear-gradient(135deg, var(--bg-secondary, #1a1a2e) 0%, var(--bg, #16213e) 100%); border-radius: 8px; margin: 0 4px; }' +
        '.chip-icon-large { font-size: 48px; color: var(--primary, #4a90d9); margin-bottom: 8px; }' +
        '.chip-name-large { font-size: 14px; font-weight: 600; color: var(--text-primary, #fff); text-align: center; word-break: break-word; }' +
        '.chip-platform { font-size: 11px; color: var(--text-secondary, #888); margin-top: 4px; }' +
        '.peripherals-column { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 200px; max-width: 280px; }' +
        '.peripheral-mini { background: var(--bg-secondary, #1a1a2e); border: 1px solid var(--border, #333); border-radius: 6px; padding: 6px 8px; font-size: 11px; display: flex; align-items: center; gap: 6px; }' +
        '.peripheral-mini.left { flex-direction: row-reverse; text-align: right; }' +
        '.peripheral-mini .peripheral-icon-mini { font-size: 14px; color: var(--primary, #4a90d9); }' +
        '.peripheral-mini .peripheral-name-mini { font-weight: 500; color: var(--text-primary, #fff); }' +
        '.peripheral-mini .peripheral-pins-mini { font-size: 10px; color: var(--text-secondary, #888); }' +
        '.peripheral-mini.i2c { border-left: 3px solid #4caf50; }' +
        '.peripheral-mini.spi { border-left: 3px solid #9c27b0; }' +
        '.peripheral-mini.uart { border-left: 3px solid #2196f3; }' +
        '.peripheral-mini.adc { border-left: 3px solid #ff9800; }' +
        '.peripheral-mini.onewire { border-left: 3px solid #00bcd4; }' +
        '.peripheral-mini.left.i2c { border-left: none; border-right: 3px solid #4caf50; }' +
        '.peripheral-mini.left.spi { border-left: none; border-right: 3px solid #9c27b0; }' +
        '.peripheral-mini.left.uart { border-left: none; border-right: 3px solid #2196f3; }' +
        '.peripheral-mini.left.adc { border-left: none; border-right: 3px solid #ff9800; }' +
        '.peripheral-mini.left.onewire { border-left: none; border-right: 3px solid #00bcd4; }' +
        '.power-badge { display: inline-flex; align-items: center; gap: 2px; font-size: 9px; padding: 1px 4px; border-radius: 3px; background: rgba(76, 175, 80, 0.2); color: #4caf50; }' +
        '.power-badge.v5 { background: rgba(255, 152, 0, 0.2); color: #ff9800; }' +
        '.main-layout { display: flex; gap: 0; align-items: flex-start; }' +
        '.pin-row { display: flex; align-items: center; font-size: 12px; padding: 4px 8px; border-radius: 4px; transition: background 0.2s; }' +
        '.pin-row:hover { background: rgba(74, 144, 217, 0.1); }' +
        '.pin-row.used { background: rgba(74, 144, 217, 0.05); }' +
        '.pin-row.pin-right { flex-direction: row-reverse; }' +
        '.pin-number { font-weight: 600; min-width: 30px; text-align: center; color: var(--text-secondary, #888); }' +
        '.pin-number.used { color: var(--primary, #4a90d9); }' +
        '.pin-connector { width: 60px; height: 2px; background: var(--border, #333); margin: 0 8px; position: relative; }' +
        '.pin-connector.used { background: var(--primary, #4a90d9); }' +
        '.pin-connector.i2c { background: #4caf50; }' +
        '.pin-connector.spi { background: #9c27b0; }' +
        '.pin-connector.uart { background: #2196f3; }' +
        '.pin-connector.adc { background: #ff9800; }' +
        '.pin-connector.onewire { background: #00bcd4; }' +
        '.pin-label { min-width: 80px; color: var(--text-secondary, #888); }' +
        '.pin-label.used { color: var(--text-primary, #fff); font-weight: 500; }' +
        '.pin-function { flex: 1; color: var(--primary, #4a90d9); font-size: 11px; padding-left: 8px; border-left: 1px solid var(--border, #333); }' +
        '.pin-peripheral { background: var(--bg-secondary, #1a1a2e); padding: 2px 8px; border-radius: 12px; font-size: 11px; color: var(--text-primary, #fff); margin-left: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }' +
        '.pin-peripheral.i2c { background: #2e7d32; }' +
        '.pin-peripheral.spi { background: #6a1b9a; }' +
        '.pin-peripheral.uart { background: #1565c0; }' +
        '.pin-peripheral.adc { background: #e65100; }' +
        '.pin-peripheral.onewire { background: #00838f; }' +
        '.peripheral-icon { font-size: 14px; margin-right: 4px; }' +
        '.chip-stats-row { display: flex; justify-content: center; gap: 24px; margin-top: 16px; padding-top: 12px; border-top: 1px solid var(--border, #333); }' +
        '.stat-item { text-align: center; }' +
        '.stat-value { font-size: 18px; font-weight: 600; color: var(--primary, #4a90d9); }' +
        '.stat-label { font-size: 10px; color: var(--text-secondary, #888); text-transform: uppercase; }' +
    '</style>' +
    '<div class="spider-chip-container">' +
        '<div class="spider-chip">' +
            '<div class="spider-chip-header">' +
                '<h3>' +
                    '<span class="material-icons" style="font-size: 20px;">memory</span>' +
                    deviceName +
                    '<span class="chip-badge">' + platform + ' - ' + (boardPins.name || board) + '</span>' +
                '</h3>' +
            '</div>' +
            '<div class="pin-rows">' +
                renderSpiderPins(boardPins, pinConnections, peripherals) +
            '</div>' +
            '<div class="chip-stats-row">' +
                '<div class="stat-item">' +
                    '<div class="stat-value">' + stats.usedPins + '</div>' +
                    '<div class="stat-label">Used</div>' +
                '</div>' +
                '<div class="stat-item">' +
                    '<div class="stat-value">' + stats.freePins + '</div>' +
                    '<div class="stat-label">Free</div>' +
                '</div>' +
                '<div class="stat-item">' +
                    '<div class="stat-value">' + peripherals.length + '</div>' +
                    '<div class="stat-label">Peripherals</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
    '</div>';
    
    return container;
}

// Export functions for global use
window.renderFullChipVisualization = renderFullChipVisualization;
window.parsePeripheralsFromYaml = parsePeripheralsFromYaml;
window.parsePinsFromYaml = parsePinsFromYaml;
window.PERIPHERAL_TYPES = PERIPHERAL_TYPES;
window.BOARD_PINS = BOARD_PINS;
window.BOARD_VARIANTS = BOARD_VARIANTS;

// Get board group from board name
function getBoardGroup(boardName) {
    for (var group in BOARD_VARIANTS) {
        if (BOARD_VARIANTS[group].variants.includes(boardName)) {
            return group;
        }
    }
    return null;
}

// Get board display name
function getBoardDisplayName(boardName) {
    var group = getBoardGroup(boardName);
    if (group && BOARD_VARIANTS[group]) {
        return BOARD_VARIANTS[group].displayName;
    }
    var boardPins = BOARD_PINS[boardName];
    return boardPins ? boardPins.name : boardName;
}
window.PERIPHERAL_REQUIREMENTS = PERIPHERAL_REQUIREMENTS;

// Pin conflict detector
function detectPinConflicts(yamlContent) {
    const conflicts = [];
    const pinUsage = {};
    
    if (!yamlContent) return conflicts;
    
    // Parse YAML to find pin assignments
    const pinPattern = /(?:pin:|number:)\s*(?:GPIO)?(\d+)/gi;
    const sdaPattern = /sda:\s*(?:GPIO)?(\d+)/gi;
    const sclPattern = /scl:\s*(?:GPIO)?(\d+)/gi;
    const txPattern = /tx_pin:\s*(?:GPIO)?(\d+)/gi;
    const rxPattern = /rx_pin:\s*(?:GPIO)?(\d+)/gi;
    
    let match;
    
    // Find all pin assignments
    while ((match = pinPattern.exec(yamlContent)) !== null) {
        const pin = parseInt(match[1]);
        const line = yamlContent.substring(0, match.index).split('\n').length;
        if (!pinUsage[pin]) pinUsage[pin] = [];
        pinUsage[pin].push({ line: line, context: getLineContext(yamlContent, match.index) });
    }
    
    while ((match = sdaPattern.exec(yamlContent)) !== null) {
        const pin = parseInt(match[1]);
        const line = yamlContent.substring(0, match.index).split('\n').length;
        if (!pinUsage[pin]) pinUsage[pin] = [];
        pinUsage[pin].push({ line: line, context: 'I2C SDA' });
    }
    
    while ((match = sclPattern.exec(yamlContent)) !== null) {
        const pin = parseInt(match[1]);
        const line = yamlContent.substring(0, match.index).split('\n').length;
        if (!pinUsage[pin]) pinUsage[pin] = [];
        pinUsage[pin].push({ line: line, context: 'I2C SCL' });
    }
    
    while ((match = txPattern.exec(yamlContent)) !== null) {
        const pin = parseInt(match[1]);
        const line = yamlContent.substring(0, match.index).split('\n').length;
        if (!pinUsage[pin]) pinUsage[pin] = [];
        pinUsage[pin].push({ line: line, context: 'UART TX' });
    }
    
    while ((match = rxPattern.exec(yamlContent)) !== null) {
        const pin = parseInt(match[1]);
        const line = yamlContent.substring(0, match.index).split('\n').length;
        if (!pinUsage[pin]) pinUsage[pin] = [];
        pinUsage[pin].push({ line: line, context: 'UART RX' });
    }
    
    // Find conflicts (same pin used by multiple components)
    Object.keys(pinUsage).forEach(function(pin) {
        if (pinUsage[pin].length > 1) {
            // Check if it's a shared bus (I2C, SPI) - those are OK
            const contexts = pinUsage[pin].map(u => u.context);
            const isSharedBus = contexts.every(c => c.includes('I2C') || c.includes('SPI'));
            
            if (!isSharedBus) {
                conflicts.push({
                    pin: parseInt(pin),
                    usages: pinUsage[pin],
                    severity: 'error',
                    message: `GPIO${pin} is used by ${pinUsage[pin].length} components`
                });
            }
        }
    });
    
    return conflicts;
}

function getLineContext(yamlContent, index) {
    const lines = yamlContent.split('\n');
    const lineNum = yamlContent.substring(0, index).split('\n').length;
    
    // Find component context (look backwards for platform/platform line)
    for (let i = Math.max(0, lineNum - 5); i < lineNum; i++) {
        const line = lines[i] || '';
        if (line.includes('platform:') || line.includes('- platform:')) {
            return line.trim();
        }
    }
    
    return 'Unknown component';
}

window.detectPinConflicts = detectPinConflicts;