/**
 * ESPHome Schema Definition for Monaco Editor Auto-complete
 * Based on ESPHome documentation: https://esphome.io/
 */

// ESPHome Component Categories
const ESPHOME_CATEGORIES = {
    CORE: 'core',
    BUS: 'bus',
    SENSOR: 'sensor',
    BINARY_SENSOR: 'binary_sensor',
    OUTPUT: 'output',
    LIGHT: 'light',
    SWITCH: 'switch',
    DISPLAY: 'display',
    NETWORK: 'network',
    CLIMATE: 'climate',
    COVER: 'cover',
    FAN: 'fan',
    BUTTON: 'button',
    SELECT: 'select',
    NUMBER: 'number',
    TEXT: 'text',
    LOCK: 'lock',
    ALARM: 'alarm',
    MEDIA: 'media',
    TIME: 'time',
    MISC: 'misc'
};

// Common GPIO pin patterns
const GPIO_PINS = {
    esp32: [
        'GPIO0', 'GPIO1', 'GPIO2', 'GPIO3', 'GPIO4', 'GPIO5', 'GPIO6', 'GPIO7',
        'GPIO8', 'GPIO9', 'GPIO10', 'GPIO11', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15',
        'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19', 'GPIO20', 'GPIO21', 'GPIO22', 'GPIO23',
        'GPIO24', 'GPIO25', 'GPIO26', 'GPIO27', 'GPIO32', 'GPIO33', 'GPIO34', 'GPIO35',
        'GPIO36', 'GPIO39'
    ],
    esp8266: [
        'GPIO0', 'GPIO1', 'GPIO2', 'GPIO3', 'GPIO4', 'GPIO5', 'GPIO6', 'GPIO7',
        'GPIO8', 'GPIO9', 'GPIO10', 'GPIO11', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16'
    ],
    // Aliases for ESP8266 D1 Mini style
    d1_mini: {
        'D0': 'GPIO16',
        'D1': 'GPIO5',
        'D2': 'GPIO4',
        'D3': 'GPIO0',
        'D4': 'GPIO2',
        'D5': 'GPIO14',
        'D6': 'GPIO12',
        'D7': 'GPIO13',
        'D8': 'GPIO15',
        'A0': 'ADC0'
    },
    nodemcu: {
        'D0': 'GPIO16',
        'D1': 'GPIO5',
        'D2': 'GPIO4',
        'D3': 'GPIO0',
        'D4': 'GPIO2',
        'D5': 'GPIO14',
        'D6': 'GPIO12',
        'D7': 'GPIO13',
        'D8': 'GPIO15',
        'D9': 'GPIO3',
        'D10': 'GPIO1',
        'A0': 'ADC0'
    }
};

// Legacy compatibility - flatten to array
const GPIO_PINS_FLAT = GPIO_PINS.esp32; // Default to ESP32

// Common I2C addresses
const I2C_ADDRESSES = [
    { value: '0x00', label: '0x00 (General call)' },
    { value: '0x20', label: '0x20 (MCP23017)' },
    { value: '0x21', label: '0x21 (MCP23017)' },
    { value: '0x22', label: '0x22 (MCP23017)' },
    { value: '0x23', label: '0x23 (MCP23017)' },
    { value: '0x27', label: '0x27 (LCD I2C)' },
    { value: '0x3C', label: '0x3C (OLED SSD1306)' },
    { value: '0x3D', label: '0x3D (OLED SSD1306)' },
    { value: '0x40', label: '0x40 (HTU21D, INA219)' },
    { value: '0x44', label: '0x44 (SHT3x)' },
    { value: '0x45', label: '0x45 (SHT3x)' },
    { value: '0x48', label: '0x48 (ADS1115)' },
    { value: '0x49', label: '0x49 (ADS1115)' },
    { value: '0x4A', label: '0x4A (ADS1115)' },
    { value: '0x4B', label: '0x4B (ADS1115)' },
    { value: '0x5A', label: '0x5A (MLX90614)' },
    { value: '0x5B', label: '0x5B (MLX90614)' },
    { value: '0x5C', label: '0x5C (MLX90614)' },
    { value: '0x5D', label: '0x5D (MLX90614)' },
    { value: '0x68', label: '0x68 (DS1307, MPU6050)' },
    { value: '0x76', label: '0x76 (BME280, BMP280)' },
    { value: '0x77', label: '0x77 (BME280, BMP280)' }
];

// ESPHome Top-Level Components
const ESPHOME_TOP_LEVEL = [
    // Core Configuration
    {
        name: 'esphome',
        category: ESPHOME_CATEGORIES.CORE,
        insertText: 'esphome:\n  name: ${1:device_name}\n  friendly_name: ${2:Device Name}\n  comment: ${3:Optional comment}',
        documentation: 'Main ESPHome configuration block. Required for all devices.',
        required: true
    },
    {
        name: 'esp32',
        category: ESPHOME_CATEGORIES.CORE,
        insertText: 'esp32:\n  board: ${1:esp32dev}\n  framework:\n    type: ${2:arduino}',
        documentation: 'ESP32 platform configuration. Choose board type and framework.',
        options: {
            board: ['esp32dev', 'nodemcu-32s', 'esp32-c3-devkitm-1', 'esp32-s2-saola-1', 'esp32-s3-devkitc-1', 'seeed_xiao_esp32s3', 'esp32-p4-function-ev-board'],
            framework: ['arduino', 'esp-idf']
        }
    },
    {
        name: 'esp8266',
        category: ESPHOME_CATEGORIES.CORE,
        insertText: 'esp8266:\n  board: ${1:nodemcuv2}',
        documentation: 'ESP8266 platform configuration.',
        options: {
            board: ['nodemcuv2', 'd1_mini', 'd1_mini_lite', 'd1_mini_pro', 'esp01', 'esp01_1m', 'esp07', 'esp12e', 'esp210', 'esp8266', 'gen4_iot', 'heltec_wifi_kit_8', 'invent_one', 'modwifi', 'nodemcu', 'nodemcuv2', 'oak', 'phoenix_v1', 'phoenix_v2', 'sonoff_basic', 'sonoff_s20', 'sonoff_sv', 'sonoff_th', 'sparkfunBlynk', 'thing', 'thingdev', 'wifi_slot', 'wifiduino', 'wifinfo', 'xinabox_esp03']
        }
    },
    {
        name: 'rp2040',
        category: ESPHOME_CATEGORIES.CORE,
        insertText: 'rp2040:\n  board: ${1:pico}\n  framework:\n    type: ${2:arduino}',
        documentation: 'Raspberry Pi Pico (RP2040) platform configuration.',
        options: {
            board: ['pico', 'pico_w', 'rpipico', 'rpipico2', 'rpipicow']
        }
    },

    // Network
    {
        name: 'wifi',
        category: ESPHOME_CATEGORIES.NETWORK,
        insertText: 'wifi:\n  ssid: !secret wifi_ssid\n  password: !secret wifi_password\n  # Optional: manual IP\n  # manual_ip:\n  #   static_ip: 192.168.1.100\n  #   gateway: 192.168.1.1\n  #   subnet: 255.255.255.0',
        documentation: 'WiFi configuration for connecting to a wireless network.',
        required: true
    },
    {
        name: 'wifi_ap',
        category: ESPHOME_CATEGORIES.NETWORK,
        insertText: 'wifi:\n  ssid: !secret wifi_ssid\n  password: !secret wifi_password\n  ap:\n    ssid: ${1:ESP_Fallback}\n    password: ${2:FallbackPassword}',
        documentation: 'WiFi configuration with fallback access point mode.'
    },
    {
        name: 'ethernet',
        category: ESPHOME_CATEGORIES.NETWORK,
        insertText: 'ethernet:\n  type: ${1:LAN8720}\n  mdc_pin: ${2:GPIO23}\n  mdio_pin: ${3:GPIO18}\n  clk_mode: ${4:GPIO17}\n  phy_addr: ${5:0}',
        documentation: 'Ethernet configuration for wired network connection.'
    },
    {
        name: 'api',
        category: ESPHOME_CATEGORIES.NETWORK,
        insertText: 'api:\n  encryption:\n    key: !secret api_key',
        documentation: 'Home Assistant API configuration. Required for Home Assistant integration.',
        required: true
    },
    {
        name: 'ota',
        category: ESPHOME_CATEGORIES.NETWORK,
        insertText: 'ota:\n  - platform: esphome\n    password: !secret ota_password',
        documentation: 'Over-the-Air update configuration. Allows wireless firmware updates.',
        required: true
    },
    {
        name: 'logger',
        category: ESPHOME_CATEGORIES.NETWORK,
        insertText: 'logger:\n  level: ${1:DEBUG}',
        documentation: 'Logging configuration for debugging. Levels: NONE, ERROR, WARN, INFO, DEBUG, VERBOSE, VERY_VERBOSE.',
        options: {
            level: ['NONE', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'VERBOSE', 'VERY_VERBOSE']
        }
    },
    {
        name: 'web_server',
        category: ESPHOME_CATEGORIES.NETWORK,
        insertText: 'web_server:\n  port: ${1:80}',
        documentation: 'Built-in web server for device control and monitoring.'
    },
    {
        name: 'captive_portal',
        category: ESPHOME_CATEGORIES.NETWORK,
        insertText: 'captive_portal:',
        documentation: 'Captive portal for easy WiFi configuration. Creates a configuration AP if WiFi fails.'
    },
    {
        name: 'mqtt',
        category: ESPHOME_CATEGORIES.NETWORK,
        insertText: 'mqtt:\n  broker: ${1:192.168.1.100}\n  username: !secret mqtt_user\n  password: !secret mqtt_password',
        documentation: 'MQTT broker configuration for external integration.'
    },
    {
        name: 'http_request',
        category: ESPHOME_CATEGORIES.NETWORK,
        insertText: 'http_request:\n  useragent: ${1:esphome/device}\n  timeout: ${2:10s}',
        documentation: 'HTTP request component for making REST API calls.'
    },

    // Bus Configuration
    {
        name: 'i2c',
        category: ESPHOME_CATEGORIES.BUS,
        insertText: 'i2c:\n  sda: ${1:GPIO21}\n  scl: ${2:GPIO22}\n  scan: ${3:true}\n  id: ${4:bus_a}',
        documentation: 'I2C bus configuration for communicating with I2C devices.'
    },
    {
        name: 'spi',
        category: ESPHOME_CATEGORIES.BUS,
        insertText: 'spi:\n  clk_pin: ${1:GPIO18}\n  mosi_pin: ${2:GPIO23}\n  miso_pin: ${3:GPIO19}\n  id: ${4:spi_bus}',
        documentation: 'SPI bus configuration for communicating with SPI devices.'
    },
    {
        name: 'uart',
        category: ESPHOME_CATEGORIES.BUS,
        insertText: 'uart:\n  tx_pin: ${1:GPIO1}\n  rx_pin: ${2:GPIO3}\n  baud_rate: ${3:9600}\n  id: ${4:uart_bus}',
        documentation: 'UART serial bus configuration for serial communication.'
    },
    {
        name: 'one_wire',
        category: ESPHOME_CATEGORIES.BUS,
        insertText: 'one_wire:\n  - platform: gpio\n    pin: ${1:GPIO4}',
        documentation: 'One-Wire bus configuration for Dallas/DS18B20 sensors.'
    },

    // Sensors
    {
        name: 'sensor',
        category: ESPHOME_CATEGORIES.SENSOR,
        insertText: 'sensor:\n  - platform: ${1:dht}\n    pin: ${2:GPIO4}\n    temperature:\n      name: "${3:Temperature}"\n    humidity:\n      name: "${4:Humidity}"\n    update_interval: ${5:60s}',
        documentation: 'Sensor component. Multiple platforms available.',
        isListComponent: true,
        platforms: ['dht', 'dallas', 'adc', 'bh1750', 'bme280', 'bme680', 'bmp085', 'bmp280', 'htu21d', 'sht3xd', 'aht10', 'am2320', 'dps310', 'hdc1080', 'max31855', 'max6675', 'tmp102', 'tmp117', 'tsl2561', 'tsl2591', 'veml7700', 'vl53l0x', 'pulse_counter', 'pulse_meter', 'duty_cycle', 'frequency', 'hd44780', 'ht16k33', 'mcp23017', 'pca9685', 'speed', 'total', 'wifi_signal', 'uptime', 'internal_temperature', 'adc', 'copy', 'template', 'filter', 'lambda']
    },

    // Binary Sensors
    {
        name: 'binary_sensor',
        category: ESPHOME_CATEGORIES.BINARY_SENSOR,
        insertText: 'binary_sensor:\n  - platform: ${1:gpio}\n    pin: ${2:GPIO4}\n    name: "${3:Button}"\n    id: ${4:button_id}\n    on_press:\n      - ${5:action}',
        documentation: 'Binary sensor component. Returns ON or OFF state.',
        isListComponent: true,
        platforms: ['gpio', 'status', 'template', 'nextion', 'rc522', 'rdm6300', 'pn532', 'ble_presence', 'ble_server', 'hd44780', 'ht16k33', 'mcp23017', 'pcf8574', 'tuya', 'custom']
    },

    // Outputs
    {
        name: 'output',
        category: ESPHOME_CATEGORIES.OUTPUT,
        insertText: 'output:\n  - platform: ${1:gpio}\n    pin: ${2:GPIO2}\n    id: ${3:output_id}',
        documentation: 'Output component for controlling GPIO pins.',
        isListComponent: true,
        platforms: ['gpio', 'ledc', 'pca9685', 'mcp4725', 'mcp4728', 'dac', 'slow_pwm', 'pwm']
    },

    // Lights
    {
        name: 'light',
        category: ESPHOME_CATEGORIES.LIGHT,
        insertText: 'light:\n  - platform: ${1:binary}\n    name: "${2:Light}"\n    output: ${3:output_id}',
        documentation: 'Light component for controlling LED lights.',
        isListComponent: true,
        platforms: ['binary', 'monochromatic', 'cwww', 'rgb', 'rgbw', 'rgbww', 'neopixelbus', 'fastled_clockless', 'fastled_spi', 'partition', 'addressable']
    },

    // Switches
    {
        name: 'switch',
        category: ESPHOME_CATEGORIES.SWITCH,
        insertText: 'switch:\n  - platform: ${1:gpio}\n    pin: ${2:GPIO2}\n    name: "${3:Switch}"\n    id: ${4:switch_id}',
        documentation: 'Switch component for ON/OFF control.',
        isListComponent: true,
        platforms: ['gpio', 'template', 'restart', 'shutdown', 'uart', 'output', 'hbridge']
    },

    // Displays
    {
        name: 'display',
        category: ESPHOME_CATEGORIES.DISPLAY,
        insertText: 'display:\n  - platform: ${1:ssd1306_i2c}\n    model: "${2:SSD1306 128x64}"\n    address: ${3:0x3C}\n    lambda: |-\n      it.print(0, 0, id(my_font), "Hello World");',
        documentation: 'Display component for OLED, LCD, and e-ink displays.',
        isListComponent: true,
        platforms: ['ssd1306_i2c', 'ssd1306_spi', 'ssd1322_i2c', 'ssd1322_spi', 'ssd1325_i2c', 'ssd1325_spi', 'ssd1327_i2c', 'ssd1327_spi', 'ssd1675', 'waveshare_epaper', 'ili9341', 'ili9xxx', 'st7789v', 'st7735', 'st7796', 'pcd8544', 'max7219', 'tm1621', 'lcd_menu']
    },
    {
        name: 'font',
        category: ESPHOME_CATEGORIES.DISPLAY,
        insertText: 'font:\n  - file: ${1:gfonts://Roboto}\n    id: ${2:my_font}\n    size: ${3:20}',
        documentation: 'Font configuration for displays.'
    },
    {
        name: 'image',
        category: ESPHOME_CATEGORIES.DISPLAY,
        insertText: 'image:\n  - file: ${1:image.png}\n    id: ${2:my_image}\n    resize: ${3:100x100}',
        documentation: 'Image configuration for displays.'
    },

    // Climate
    {
        name: 'climate',
        category: ESPHOME_CATEGORIES.CLIMATE,
        insertText: 'climate:\n  - platform: ${1:thermostat}\n    name: "${2:Thermostat}"\n    sensor: ${3:temperature_sensor}\n    default_target_temperature: ${4:22}',
        documentation: 'Climate control component for thermostats.',
        isListComponent: true,
        platforms: ['thermostat', 'pid', 'bang_bang', 'template', 'haier', 'midea', 'daikin', 'fujitsu', 'tcl', 'whirlpool', 'toshiba', 'yashima', 'ir_transmitter']
    },

    // Covers
    {
        name: 'cover',
        category: ESPHOME_CATEGORIES.COVER,
        insertText: 'cover:\n  - platform: ${1:template}\n    name: "${2:Cover}"\n    open_action:\n      - ${3:output.turn_on: open_output}\n    close_action:\n      - ${4:output.turn_on: close_output}\n    stop_action:\n      - ${5:output.turn_off: open_output}',
        documentation: 'Cover component for blinds, curtains, and garage doors.',
        isListComponent: true,
        platforms: ['template', 'endstop', 'time_based', 'current_based', 'gf100t', 'somfy', 'bus']
    },

    // Fans
    {
        name: 'fan',
        category: ESPHOME_CATEGORIES.FAN,
        insertText: 'fan:\n  - platform: ${1:speed}\n    name: "${2:Fan}"\n    output: ${3:output_id}\n    speed_count: ${4:3}',
        documentation: 'Fan component for speed-controlled fans.',
        isListComponent: true,
        platforms: ['speed', 'binary', 'template', 'hbridge']
    },

    // Buttons
    {
        name: 'button',
        category: ESPHOME_CATEGORIES.BUTTON,
        insertText: 'button:\n  - platform: ${1:template}\n    name: "${2:Button}"\n    on_press:\n      - ${3:action}',
        documentation: 'Button component for momentary actions.',
        isListComponent: true,
        platforms: ['template', 'restart', 'shutdown', 'factory_reset', 'safe_mode', 'script', 'wake_on_esh']
    },

    // Select
    {
        name: 'select',
        category: ESPHOME_CATEGORIES.SELECT,
        insertText: 'select:\n  - platform: ${1:template}\n    name: "${2:Select}"\n    options:\n      - ${3:Option 1}\n      - ${4:Option 2}\n    initial_option: ${3:Option 1}',
        documentation: 'Select component for choosing from predefined options.',
        isListComponent: true,
        platforms: ['template', 'tuya', 'modbus_controller']
    },

    // Number
    {
        name: 'number',
        category: ESPHOME_CATEGORIES.NUMBER,
        insertText: 'number:\n  - platform: ${1:template}\n    name: "${2:Number}"\n    min_value: ${3:0}\n    max_value: ${4:100}\n    step: ${5:1}\n    optimistic: ${6:true}',
        documentation: 'Number component for numeric input.',
        isListComponent: true,
        platforms: ['template', 'modbus_controller', 'tuya']
    },

    // Text
    {
        name: 'text',
        category: ESPHOME_CATEGORIES.TEXT,
        insertText: 'text:\n  - platform: ${1:template}\n    name: "${2:Text}"\n    optimistic: ${3:true}',
        documentation: 'Text component for string input.',
        isListComponent: true,
        platforms: ['template', 'tuya']
    },

    // Lock
    {
        name: 'lock',
        category: ESPHOME_CATEGORIES.LOCK,
        insertText: 'lock:\n  - platform: ${1:template}\n    name: "${2:Lock}"\n    open_action:\n      - ${3:output.turn_on: lock_output}',
        documentation: 'Lock component for door locks.',
        isListComponent: true,
        platforms: ['template', 'output']
    },

    // Alarm
    {
        name: 'alarm_control_panel',
        category: ESPHOME_CATEGORIES.ALARM,
        insertText: 'alarm_control_panel:\n  - platform: ${1:template}\n    name: "${2:Alarm}"\n    codes:\n      - ${3:1234}',
        documentation: 'Alarm control panel component.',
        isListComponent: true,
        platforms: ['template']
    },

    // Media Player
    {
        name: 'media_player',
        category: ESPHOME_CATEGORIES.MEDIA,
        insertText: 'media_player:\n  - platform: ${1:i2s_audio}\n    name: "${2:Speaker}"\n    dac_type: ${3:external}\n    i2s_dout_pin: ${4:GPIO22}',
        documentation: 'Media player component for audio playback.',
        isListComponent: true,
        platforms: ['i2s_audio', 'speaker', 'dfplayer', 'famous', 'onkyo', 'pioneer', 'yamaha', 'roku']
    },

    // Time
    {
        name: 'time',
        category: ESPHOME_CATEGORIES.TIME,
        insertText: 'time:\n  - platform: ${1:homeassistant}\n    id: ${2:homeassistant_time}',
        documentation: 'Time synchronization component.',
        isListComponent: true,
        platforms: ['homeassistant', 'sntp', 'gps', 'ds1307', 'ds3231']
    },
    {
        name: 'sun',
        category: ESPHOME_CATEGORIES.TIME,
        insertText: 'sun:\n  latitude: ${1:48.8496}\n  longitude: ${2:2.2736}',
        documentation: 'Sun position component for automation based on sunrise/sunset.'
    },

    // Misc
    {
        name: 'globals',
        category: ESPHOME_CATEGORIES.MISC,
        insertText: 'globals:\n  - id: ${1:my_global}\n    type: ${2:int}\n    initial_value: ${3:0}',
        documentation: 'Global variables that persist across reboots.'
    },
    {
        name: 'interval',
        category: ESPHOME_CATEGORIES.MISC,
        insertText: 'interval:\n  - interval: ${1:60s}\n    then:\n      - ${2:action}',
        documentation: 'Interval-based automation.'
    },
    {
        name: 'script',
        category: ESPHOME_CATEGORIES.MISC,
        insertText: 'script:\n  - id: ${1:my_script}\n    then:\n      - ${2:action}',
        documentation: 'Reusable script definitions.'
    },
    {
        name: 'deep_sleep',
        category: ESPHOME_CATEGORIES.MISC,
        insertText: 'deep_sleep:\n  run_duration: ${1:10s}\n  sleep_duration: ${2:10min}',
        documentation: 'Deep sleep configuration for battery-powered devices.'
    },
    {
        name: 'bluetooth_proxy',
        category: ESPHOME_CATEGORIES.MISC,
        insertText: 'bluetooth_proxy:\n  active: ${1:true}',
        documentation: 'Bluetooth proxy for Home Assistant.'
    },
    {
        name: 'ble_client',
        category: ESPHOME_CATEGORIES.MISC,
        insertText: 'ble_client:\n  - mac_address: ${1:XX:XX:XX:XX:XX:XX}\n    id: ${2:ble_client_id}',
        documentation: 'BLE client configuration for Bluetooth devices.'
    },
    {
        name: 'preferences',
        category: ESPHOME_CATEGORIES.MISC,
        insertText: 'preferences:\n  flash_write_interval: ${1:1min}',
        documentation: 'Preferences storage configuration.'
    }
];

// Sensor platforms with detailed info
const SENSOR_PLATFORMS = [
    {
        name: 'dht',
        insertText: '- platform: dht\n  pin: ${1:GPIO4}\n  temperature:\n    name: "${2:Temperature}"\n  humidity:\n    name: "${3:Humidity}"\n  model: ${4:AUTO}\n  update_interval: ${5:60s}',
        documentation: 'DHT11/DHT22/DHT33 temperature and humidity sensor.',
        params: {
            pin: { type: 'gpio', required: true, desc: 'GPIO pin number' },
            model: { type: 'enum', values: ['AUTO', 'DHT11', 'DHT22', 'DHT33', 'DHT44', 'AM2302', 'RHT03'], desc: 'Sensor model' },
            temperature: { type: 'block', desc: 'Temperature sensor config' },
            humidity: { type: 'block', desc: 'Humidity sensor config' }
        }
    },
    {
        name: 'dallas',
        insertText: '- platform: dallas\n  address: ${1:0x0000000000000000}\n  name: "${2:Temperature}"',
        documentation: 'DS18B20 Dallas temperature sensor.',
        params: {
            address: { type: 'hex', required: true, desc: 'Sensor address' },
            name: { type: 'string', required: true, desc: 'Sensor name' }
        }
    },
    {
        name: 'bme280',
        insertText: '- platform: bme280_i2c\n  temperature:\n    name: "${1:Temperature}"\n    oversampling: ${2:16x}\n  humidity:\n    name: "${3:Humidity}"\n  pressure:\n    name: "${4:Pressure}"\n  address: ${5:0x76}\n  update_interval: ${6:60s}',
        documentation: 'BME280/BMP280 environmental sensor (I2C).',
        params: {
            temperature: { type: 'block', desc: 'Temperature sensor config' },
            humidity: { type: 'block', desc: 'Humidity sensor config' },
            pressure: { type: 'block', desc: 'Pressure sensor config' },
            address: { type: 'i2c', default: '0x76', desc: 'I2C address' }
        }
    },
    {
        name: 'bme680',
        insertText: '- platform: bme680_i2c\n  temperature:\n    name: "${1:Temperature}"\n  humidity:\n    name: "${2:Humidity}"\n  pressure:\n    name: "${3:Pressure}"\n  gas_resistance:\n    name: "${4:Gas}"\n  address: ${5:0x76}',
        documentation: 'BME680 environmental sensor with gas detection.',
        params: {
            address: { type: 'i2c', default: '0x76', desc: 'I2C address' }
        }
    },
    {
        name: 'aht10',
        insertText: '- platform: aht10\n  temperature:\n    name: "${1:Temperature}"\n  humidity:\n    name: "${2:Humidity}"\n  update_interval: ${3:60s}',
        documentation: 'AHT10/AHT20/AHT21 temperature and humidity sensor.',
        params: {
            address: { type: 'i2c', default: '0x38', desc: 'I2C address' }
        }
    },
    {
        name: 'sht3xd',
        insertText: '- platform: sht3xd\n  temperature:\n    name: "${1:Temperature}"\n  humidity:\n    name: "${2:Humidity}"\n  address: ${3:0x44}',
        documentation: 'SHT3x temperature and humidity sensor.',
        params: {
            address: { type: 'i2c', default: '0x44', desc: 'I2C address' }
        }
    },
    {
        name: 'htu21d',
        insertText: '- platform: htu21d\n  temperature:\n    name: "${1:Temperature}"\n  humidity:\n    name: "${2:Humidity}"',
        documentation: 'HTU21D temperature and humidity sensor.'
    },
    {
        name: 'adc',
        insertText: '- platform: adc\n  pin: ${1:GPIO34}\n  name: "${2:ADC}"\n  attenuation: ${3:11db}\n  update_interval: ${4:60s}',
        documentation: 'Analog to Digital Converter sensor.',
        params: {
            pin: { type: 'gpio', required: true, desc: 'ADC pin' },
            attenuation: { type: 'enum', values: ['0db', '2.5db', '6db', '11db'], desc: 'ADC attenuation' }
        }
    },
    {
        name: 'pulse_counter',
        insertText: '- platform: pulse_counter\n  pin: ${1:GPIO4}\n  name: "${2:Pulse Counter}"\n  unit_of_measurement: ${3:pulses}\n  update_interval: ${4:60s}',
        documentation: 'Pulse counter sensor for counting pulses on a pin.',
        params: {
            pin: { type: 'gpio', required: true, desc: 'GPIO pin' }
        }
    },
    {
        name: 'wifi_signal',
        insertText: '- platform: wifi_signal\n  name: "${1:WiFi Signal}"\n  update_interval: ${2:60s}',
        documentation: 'WiFi signal strength sensor.'
    },
    {
        name: 'uptime',
        insertText: '- platform: uptime\n  name: "${1:Uptime}"\n  update_interval: ${2:60s}',
        documentation: 'Device uptime sensor.'
    },
    {
        name: 'internal_temperature',
        insertText: '- platform: internal_temperature\n  name: "${1:Internal Temperature}"',
        documentation: 'Internal chip temperature sensor (ESP32).'
    },
    {
        name: 'template',
        insertText: '- platform: template\n  name: "${1:Template Sensor}"\n  lambda: |-\n    return ${2:id(my_sensor).state};\n  update_interval: ${3:60s}',
        documentation: 'Template sensor for custom values via lambda.',
        params: {
            lambda: { type: 'code', required: true, desc: 'Lambda function returning value' }
        }
    }
];

// Binary sensor platforms
const BINARY_SENSOR_PLATFORMS = [
    {
        name: 'gpio',
        insertText: '- platform: gpio\n  pin: ${1:GPIO4}\n  name: "${2:Button}"\n  id: ${3:button_id}\n  filters:\n    - ${4:debounce: 10ms}\n  on_press:\n    - ${5:action}',
        documentation: 'GPIO-based binary sensor (buttons, switches, motion sensors).',
        params: {
            pin: { type: 'gpio', required: true, desc: 'GPIO pin' },
            name: { type: 'string', required: true, desc: 'Sensor name' }
        }
    },
    {
        name: 'status',
        insertText: '- platform: status\n  name: "${1:Status}"',
        documentation: 'Device online/offline status sensor.'
    },
    {
        name: 'template',
        insertText: '- platform: template\n  name: "${1:Template}"\n  lambda: |-\n    return ${2:id(sensor).state > 0};',
        documentation: 'Template binary sensor for custom logic.',
        params: {
            lambda: { type: 'code', required: true, desc: 'Lambda returning true/false' }
        }
    },
    {
        name: 'ble_presence',
        insertText: '- platform: ble_presence\n  mac_address: ${1:XX:XX:XX:XX:XX:XX}\n  name: "${2:BLE Presence}"',
        documentation: 'BLE presence detection sensor.',
        params: {
            mac_address: { type: 'mac', required: true, desc: 'Device MAC address' }
        }
    }
];

// Light platforms
const LIGHT_PLATFORMS = [
    {
        name: 'binary',
        insertText: '- platform: binary\n  name: "${1:Light}"\n  output: ${2:output_id}',
        documentation: 'Binary ON/OFF light.',
        params: {
            output: { type: 'id', required: true, desc: 'Output component ID' }
        }
    },
    {
        name: 'monochromatic',
        insertText: '- platform: monochromatic\n  name: "${1:Light}"\n  output: ${2:pwm_output}\n  gamma_correct: ${3:2.8}',
        documentation: 'Single-color dimmable light.',
        params: {
            output: { type: 'id', required: true, desc: 'PWM output ID' }
        }
    },
    {
        name: 'rgb',
        insertText: '- platform: rgb\n  name: "${1:RGB Light}"\n  red: ${2:red_output}\n  green: ${3:green_output}\n  blue: ${4:blue_output}',
        documentation: 'RGB LED light.',
        params: {
            red: { type: 'id', required: true, desc: 'Red output ID' },
            green: { type: 'id', required: true, desc: 'Green output ID' },
            blue: { type: 'id', required: true, desc: 'Blue output ID' }
        }
    },
    {
        name: 'rgbw',
        insertText: '- platform: rgbw\n  name: "${1:RGBW Light}"\n  red: ${2:red_output}\n  green: ${3:green_output}\n  blue: ${4:blue_output}\n  white: ${5:white_output}',
        documentation: 'RGBW LED light with white channel.',
        params: {
            white: { type: 'id', required: true, desc: 'White output ID' }
        }
    },
    {
        name: 'cwww',
        insertText: '- platform: cwww\n  name: "${1:Warm White Light}"\n  cold_white: ${2:cold_output}\n  warm_white: ${3:warm_output}\n  cold_white_color_temperature: ${4:6536 K}\n  warm_white_color_temperature: ${5:2800 K}',
        documentation: 'Cold/warm white LED light.',
        params: {
            cold_white: { type: 'id', required: true, desc: 'Cold white output' },
            warm_white: { type: 'id', required: true, desc: 'Warm white output' }
        }
    },
    {
        name: 'neopixelbus',
        insertText: '- platform: neopixelbus\n  type: ${1:GRB}\n  variant: ${2:WS2812x}\n  pin: ${3:GPIO3}\n  num_leds: ${4:60}\n  id: ${5:led_strip}\n  name: "${6:LED Strip}"',
        documentation: 'NeoPixel/WS2812 LED strip.',
        params: {
            type: { type: 'enum', values: ['GRB', 'RGB', 'BRG', 'RBG'], desc: 'Color order' },
            variant: { type: 'enum', values: ['WS2812x', 'WS2813', 'SK6812', 'WS2812', 'WS2811'], desc: 'LED variant' },
            num_leds: { type: 'int', required: true, desc: 'Number of LEDs' }
        }
    },
    {
        name: 'fastled_clockless',
        insertText: '- platform: fastled_clockless\n  chipset: ${1:WS2812B}\n  pin: ${2:GPIO3}\n  num_leds: ${3:60}\n  rgb_order: ${4:GRB}\n  name: "${5:LED Strip}"',
        documentation: 'FastLED clockless LED strip.',
        params: {
            chipset: { type: 'enum', values: ['WS2812B', 'WS2811', 'WS2813', 'SK6812', 'SK9822', 'APA102', 'APA104', 'GW6205', 'LPD1886'], desc: 'LED chipset' }
        }
    }
];

// Switch platforms
const SWITCH_PLATFORMS = [
    {
        name: 'gpio',
        insertText: '- platform: gpio\n  pin: ${1:GPIO2}\n  name: "${2:Switch}"\n  id: ${3:switch_id}\n  inverted: ${4:false}\n  restore_mode: ${5:ALWAYS_OFF}',
        documentation: 'GPIO-based switch.',
        params: {
            pin: { type: 'gpio', required: true, desc: 'GPIO pin' },
            restore_mode: { type: 'enum', values: ['ALWAYS_OFF', 'ALWAYS_ON', 'RESTORE_DEFAULT_OFF', 'RESTORE_DEFAULT_ON', 'RESTORE_INVERTED_DEFAULT_OFF', 'RESTORE_INVERTED_DEFAULT_ON'], desc: 'Power-on state' }
        }
    },
    {
        name: 'template',
        insertText: '- platform: template\n  name: "${1:Switch}"\n  id: ${2:switch_id}\n  optimistic: ${3:true}\n  turn_on_action:\n    - ${4:output.turn_on: output_id}\n  turn_off_action:\n    - ${5:output.turn_off: output_id}',
        documentation: 'Template switch for custom actions.',
        params: {
            optimistic: { type: 'bool', default: true, desc: 'Assume state change immediately' }
        }
    },
    {
        name: 'restart',
        insertText: '- platform: restart\n  name: "${1:Restart}"',
        documentation: 'Restart switch.'
    },
    {
        name: 'shutdown',
        insertText: '- platform: shutdown\n  name: "${1:Shutdown}"',
        documentation: 'Shutdown switch.'
    }
];

// Output platforms
const OUTPUT_PLATFORMS = [
    {
        name: 'gpio',
        insertText: '- platform: gpio\n  pin: ${1:GPIO2}\n  id: ${2:output_id}\n  inverted: ${3:false}',
        documentation: 'GPIO ON/OFF output.',
        params: {
            pin: { type: 'gpio', required: true, desc: 'GPIO pin' }
        }
    },
    {
        name: 'ledc',
        insertText: '- platform: ledc\n  pin: ${1:GPIO2}\n  id: ${2:pwm_output}\n  frequency: ${3:1000 Hz}\n  bit_depth: ${4:12}',
        documentation: 'PWM output using LEDC (ESP32).',
        params: {
            pin: { type: 'gpio', required: true, desc: 'GPIO pin' },
            frequency: { type: 'string', default: '1000 Hz', desc: 'PWM frequency' },
            bit_depth: { type: 'int', values: [8, 9, 10, 11, 12, 13, 14, 15], desc: 'PWM bit depth' }
        }
    },
    {
        name: 'pca9685',
        insertText: '- platform: pca9685\n  channel: ${1:0}\n  id: ${2:output_id}\n  pca9685_id: ${3:pca9685_hub}',
        documentation: 'PCA9685 PWM output.',
        params: {
            channel: { type: 'int', required: true, desc: 'Channel (0-15)' }
        }
    },
    {
        name: 'mcp4725',
        insertText: '- platform: mcp4725\n  id: ${1:dac_output}\n  address: ${2:0x60}',
        documentation: 'MCP4725 DAC output.',
        params: {
            address: { type: 'i2c', default: '0x60', desc: 'I2C address' }
        }
    }
];

// Display platforms
const DISPLAY_PLATFORMS = [
    {
        name: 'ssd1306_i2c',
        insertText: '- platform: ssd1306_i2c\n  model: "${1:SSD1306 128x64}"\n  address: ${2:0x3C}\n  brightness: ${3:100%}\n  lambda: |-\n    it.print(0, 0, id(my_font), "${4:Hello}");',
        documentation: 'SSD1306 OLED display (I2C).',
        params: {
            model: { type: 'enum', values: ['SSD1306 128x32', 'SSD1306 128x64', 'SH1106 128x64', 'SSD1305 128x32', 'SSD1305 128x64'], desc: 'Display model' },
            address: { type: 'i2c', default: '0x3C', desc: 'I2C address' }
        }
    },
    {
        name: 'ssd1306_spi',
        insertText: '- platform: ssd1306_spi\n  model: "${1:SSD1306 128x64}"\n  cs_pin: ${2:GPIO5}\n  dc_pin: ${3:GPIO4}\n  reset_pin: ${4:GPIO16}\n  lambda: |-\n    it.print(0, 0, id(my_font), "${5:Hello}");',
        documentation: 'SSD1306 OLED display (SPI).'
    },
    {
        name: 'ili9341',
        insertText: '- platform: ili9341\n  model: "${1:M5Stack}"\n  cs_pin: ${2:GPIO5}\n  dc_pin: ${3:GPIO4}\n  reset_pin: ${4:GPIO16}\n  lambda: |-\n    it.fill(COLOR_BLACK);\n    it.print(0, 0, id(my_font), "${5:Hello}");',
        documentation: 'ILI9341 TFT display.'
    },
    {
        name: 'st7789v',
        insertText: '- platform: st7789v\n  model: ${1:TTGO T-Display}\n  cs_pin: ${2:GPIO5}\n  dc_pin: ${3:GPIO4}\n  reset_pin: ${4:GPIO16}\n  lambda: |-\n    it.print(0, 0, id(my_font), "${5:Hello}");',
        documentation: 'ST7789V TFT display (like TTGO T-Display).'
    },
    {
        name: 'max7219',
        insertText: '- platform: max7219\n  cs_pin: ${1:GPIO5}\n  num_chips: ${2:1}\n  lambda: |-\n    it.print("${3:Hello}");',
        documentation: 'MAX7219 7-segment LED display.'
    }
];

// Common automation actions
const AUTOMATION_ACTIONS = [
    {
        name: 'delay',
        insertText: '- delay: ${1:1s}',
        documentation: 'Delay execution.'
    },
    {
        name: 'switch.turn_on',
        insertText: '- switch.turn_on: ${1:switch_id}',
        documentation: 'Turn on a switch.'
    },
    {
        name: 'switch.turn_off',
        insertText: '- switch.turn_off: ${1:switch_id}',
        documentation: 'Turn off a switch.'
    },
    {
        name: 'switch.toggle',
        insertText: '- switch.toggle: ${1:switch_id}',
        documentation: 'Toggle a switch.'
    },
    {
        name: 'light.turn_on',
        insertText: '- light.turn_on:\n    id: ${1:light_id}\n    brightness: ${2:100%}\n    transition_length: ${3:1s}',
        documentation: 'Turn on a light.'
    },
    {
        name: 'light.turn_off',
        insertText: '- light.turn_off:\n    id: ${1:light_id}\n    transition_length: ${2:1s}',
        documentation: 'Turn off a light.'
    },
    {
        name: 'output.turn_on',
        insertText: '- output.turn_on: ${1:output_id}',
        documentation: 'Turn on an output.'
    },
    {
        name: 'output.turn_off',
        insertText: '- output.turn_off: ${1:output_id}',
        documentation: 'Turn off an output.'
    },
    {
        name: 'output.set_level',
        insertText: '- output.set_level:\n    id: ${1:output_id}\n    level: ${2:50%}',
        documentation: 'Set output level (0-100%).'
    },
    {
        name: 'fan.turn_on',
        insertText: '- fan.turn_on: ${1:fan_id}',
        documentation: 'Turn on a fan.'
    },
    {
        name: 'fan.turn_off',
        insertText: '- fan.turn_off: ${1:fan_id}',
        documentation: 'Turn off a fan.'
    },
    {
        name: 'climate.control',
        insertText: '- climate.control:\n    id: ${1:climate_id}\n    mode: ${2:HEAT}\n    target_temperature: ${3:22}',
        documentation: 'Control climate device.'
    },
    {
        name: 'logger.log',
        insertText: '- logger.log: "${1:Message}"',
        documentation: 'Log a message.'
    },
    {
        name: 'http_request.post',
        insertText: '- http_request.post:\n    url: ${1:http://example.com/api}\n    json: |-\n      {"key": "${2:value}"}',
        documentation: 'Send HTTP POST request.'
    },
    {
        name: 'mqtt.publish',
        insertText: '- mqtt.publish:\n    topic: ${1:homeassistant/sensor/state}\n    payload: ${2:value}',
        documentation: 'Publish to MQTT topic.'
    },
    {
        name: 'homeassistant.service',
        insertText: '- homeassistant.service:\n    service: ${1:light.turn_on}\n    data:\n      entity_id: ${2:light.living_room}\n      brightness: ${3:100}',
        documentation: 'Call Home Assistant service.'
    },
    {
        name: 'script.execute',
        insertText: '- script.execute: ${1:my_script}',
        documentation: 'Execute a script.'
    },
    {
        name: 'script.stop',
        insertText: '- script.stop: ${1:my_script}',
        documentation: 'Stop a script.'
    },
    {
        name: 'if',
        insertText: '- if:\n    condition:\n      - ${1:binary_sensor.is_on: my_sensor}\n    then:\n      - ${2:action}\n    else:\n      - ${3:action}',
        documentation: 'Conditional execution.'
    },
    {
        name: 'while',
        insertText: '- while:\n    condition:\n      - ${1:binary_sensor.is_on: my_sensor}\n    then:\n      - ${2:action}\n      - delay: ${3:1s}',
        documentation: 'While loop.'
    },
    {
        name: 'repeat',
        insertText: '- repeat:\n    count: ${1:3}\n    then:\n      - ${2:action}',
        documentation: 'Repeat action N times.'
    },
    {
        name: 'wait_until',
        insertText: '- wait_until:\n    condition:\n      - ${1:binary_sensor.is_on: my_sensor}\n    timeout: ${2:10s}',
        documentation: 'Wait until condition is true.'
    },
    {
        name: 'lambda',
        insertText: '- lambda: |-\n    ${1:// Your code here}\n    return ${2:value};',
        documentation: 'Execute custom lambda code.'
    }
];

// Conditions
const CONDITIONS = [
    {
        name: 'binary_sensor.is_on',
        insertText: '- binary_sensor.is_on: ${1:sensor_id}',
        documentation: 'Check if binary sensor is ON.'
    },
    {
        name: 'binary_sensor.is_off',
        insertText: '- binary_sensor.is_off: ${1:sensor_id}',
        documentation: 'Check if binary sensor is OFF.'
    },
    {
        name: 'switch.is_on',
        insertText: '- switch.is_on: ${1:switch_id}',
        documentation: 'Check if switch is ON.'
    },
    {
        name: 'light.is_on',
        insertText: '- light.is_on: ${1:light_id}',
        documentation: 'Check if light is ON.'
    },
    {
        name: 'sensor.in_range',
        insertText: '- sensor.in_range:\n    id: ${1:sensor_id}\n    above: ${2:20}\n    below: ${3:30}',
        documentation: 'Check if sensor value is in range.'
    },
    {
        name: 'api.connected',
        insertText: '- api.connected:',
        documentation: 'Check if Home Assistant API is connected.'
    },
    {
        name: 'wifi.connected',
        insertText: '- wifi.connected:',
        documentation: 'Check if WiFi is connected.'
    },
    {
        name: 'lambda',
        insertText: '- lambda: |-\n    return ${1:id(sensor).state > 0};',
        documentation: 'Custom condition via lambda.'
    }
];

// Board Images Configuration
const BOARD_IMAGES = {
    'esp32dev': {
        image: '/static/img/boards/esp32-devkit-v1.svg',
        name: 'ESP32 DevKit V1',
        description: 'ESP32-WROOM-32 Development Board (DOIT)',
        pins: GPIO_PINS.esp32,
        inputOnly: ['GPIO34', 'GPIO35', 'GPIO36', 'GPIO39'],
        special: {
            'GPIO0': 'BOOT button (pull-up)',
            'GPIO1': 'TX0 (Serial)',
            'GPIO3': 'RX0 (Serial)',
            'GPIO6': 'Flash (do not use)',
            'GPIO7': 'Flash (do not use)',
            'GPIO8': 'Flash (do not use)',
            'GPIO9': 'Flash (do not use)',
            'GPIO10': 'Flash (do not use)',
            'GPIO11': 'Flash (do not use)'
        }
    },
    'esp32-s3-devkitc-1': {
        image: '/static/img/boards/esp32-s3-devkitc-1.svg',
        name: 'ESP32-S3-DevKitC-1',
        description: 'ESP32-S3-WROOM-1 Development Board',
        pins: GPIO_PINS.esp32,
        features: ['WiFi', 'Bluetooth 5', 'USB-C', '8MB PSRAM', 'Dual Core']
    },
    'esp32-s2-saola-1': {
        image: '/static/img/boards/esp32-devkit-v1.svg',
        name: 'ESP32-S2-Saola-1',
        description: 'ESP32-S2-WROVER Development Board',
        pins: GPIO_PINS.esp32,
        features: ['WiFi', 'USB-OTG', '4MB Flash']
    },
    'esp32-c3-devkitm-1': {
        image: '/static/img/boards/esp32-c3-devkitm-1.svg',
        name: 'ESP32-C3-DevKitM-1',
        description: 'ESP32-C3-MINI-1 Development Board',
        pins: GPIO_PINS.esp32,
        features: ['WiFi', 'Bluetooth 5', 'USB-Serial/JTAG', 'RISC-V']
    },
    'esp32-s3-box': {
        image: '/static/img/boards/esp32-s3-box.svg',
        name: 'ESP32-S3-BOX',
        description: 'ESP32-S3 Development Kit with Display and Speaker',
        pins: GPIO_PINS.esp32,
        features: ['WiFi', 'Bluetooth 5', 'Display', 'Speaker', 'Microphone', 'Touch']
    },
    'nodemcuv2': {
        image: '/static/img/boards/esp8266-nodemcu.svg',
        name: 'NodeMCU ESP8266',
        description: 'NodeMCU V2/V3 ESP8266 Development Board',
        pins: GPIO_PINS.esp8266,
        special: {
            'GPIO0': 'BOOT button (must be HIGH on boot)',
            'GPIO1': 'TX (Serial)',
            'GPIO2': 'Built-in LED (active LOW)',
            'GPIO3': 'RX (Serial)',
            'GPIO6': 'Flash (do not use)',
            'GPIO7': 'Flash (do not use)',
            'GPIO8': 'Flash (do not use)',
            'GPIO9': 'Flash (do not use)',
            'GPIO10': 'Flash (do not use)',
            'GPIO11': 'Flash (do not use)',
            'GPIO15': 'BOOT (must be LOW on boot)',
            'GPIO16': 'WAKE (deep sleep wake)'
        }
    },
    'd1_mini': {
        image: '/static/img/boards/esp8266-d1-mini.svg',
        name: 'Wemos D1 Mini',
        description: 'Wemos D1 Mini ESP8266 Development Board',
        pins: GPIO_PINS.esp8266,
        features: ['WiFi', 'Micro-USB', '4MB Flash']
    }
};

// Quick Insert Templates - Common Sensors
const QUICK_TEMPLATES = {
    // Temperature/Humidity Sensors
    'sensor.bme280': {
        name: 'BME280',
        category: 'sensor',
        description: 'BME280 Temperature/Humidity/Pressure Sensor (I2C)',
        icon: 'thermostat',
        params: [
            { name: 'name', label: 'Device Name', default: 'Living Room', required: true },
            { name: 'sda', label: 'SDA Pin', default: 'GPIO21' },
            { name: 'scl', label: 'SCL Pin', default: 'GPIO22' },
            { name: 'address', label: 'I2C Address', default: '0x76', options: ['0x76', '0x77'] },
            { name: 'update_interval', label: 'Update Interval', default: '60s' }
        ],
        template: `i2c:
  sda: {{sda}}
  scl: {{scl}}
  scan: true

sensor:
  - platform: bme280_i2c
    temperature:
      name: "{{name}} Temperature"
    humidity:
      name: "{{name}} Humidity"
    pressure:
      name: "{{name}} Pressure"
    address: {{address}}
    update_interval: {{update_interval}}`
    },
    'sensor.dht22': {
        name: 'DHT22',
        category: 'sensor',
        description: 'DHT22 Temperature/Humidity Sensor (GPIO)',
        icon: 'device_thermostat',
        params: [
            { name: 'name', label: 'Device Name', default: 'Room', required: true },
            { name: 'pin', label: 'Data Pin', default: 'GPIO4' },
            { name: 'update_interval', label: 'Update Interval', default: '60s' }
        ],
        template: `sensor:
  - platform: dht
    pin: {{pin}}
    temperature:
      name: "{{name}} Temperature"
    humidity:
      name: "{{name}} Humidity"
    update_interval: {{update_interval}}
    model: DHT22`
    },
    'sensor.ds18b20': {
        name: 'DS18B20',
        category: 'sensor',
        description: 'DS18B20 Temperature Sensor (OneWire)',
        icon: 'thermometer',
        params: [
            { name: 'name', label: 'Sensor Name', default: 'Temperature', required: true },
            { name: 'pin', label: 'Data Pin', default: 'GPIO4' }
        ],
        template: `one_wire:
  - pin: {{pin}}

sensor:
  - platform: dallas
    name: "{{name}}"
    address: []  # Auto-discover or specify address`
    },
    
    // Relay/Switch
    'switch.relay': {
        name: 'Relay',
        category: 'switch',
        description: 'Relay Control (GPIO)',
        icon: 'settings_input_component',
        params: [
            { name: 'name', label: 'Relay Name', default: 'Relay 1', required: true },
            { name: 'pin', label: 'GPIO Pin', default: 'GPIO5' },
            { name: 'id', label: 'Component ID', default: 'relay_1' },
            { name: 'restore_mode', label: 'Restore Mode', default: 'ALWAYS_OFF', options: ['ALWAYS_OFF', 'ALWAYS_ON', 'RESTORE_DEFAULT_OFF', 'RESTORE_DEFAULT_ON'] }
        ],
        template: `switch:
  - platform: gpio
    name: "{{name}}"
    pin: {{pin}}
    id: {{id}}
    restore_mode: {{restore_mode}}
    on_turn_on:
      - logger.log: "{{name}} turned ON"
    on_turn_off:
      - logger.log: "{{name}} turned OFF"`
    },
    
    // PIR Motion Sensor
    'binary_sensor.pir': {
        name: 'PIR Sensor',
        category: 'binary_sensor',
        description: 'PIR Motion Sensor (GPIO)',
        icon: 'sensors',
        params: [
            { name: 'name', label: 'Sensor Name', default: 'Motion', required: true },
            { name: 'pin', label: 'GPIO Pin', default: 'GPIO13' },
            { name: 'device_class', label: 'Device Class', default: 'motion', options: ['motion', 'occupancy', 'presence'] }
        ],
        template: `binary_sensor:
  - platform: gpio
    name: "{{name}}"
    pin:
      number: {{pin}}
      mode: INPUT_PULLUP
      inverted: false
    device_class: {{device_class}}
    filters:
      - delayed_on: 100ms
      - delayed_off: 1s
    on_press:
      - logger.log: "{{name}} detected"
    on_release:
      - logger.log: "{{name}} cleared"`
    },
    
    // SSD1306 OLED Display
    'display.ssd1306': {
        name: 'SSD1306 OLED',
        category: 'display',
        description: 'SSD1306 OLED Display (I2C)',
        icon: 'monitor',
        params: [
            { name: 'name', label: 'Device Name', default: 'Display', required: true },
            { name: 'sda', label: 'SDA Pin', default: 'GPIO21' },
            { name: 'scl', label: 'SCL Pin', default: 'GPIO22' },
            { name: 'address', label: 'I2C Address', default: '0x3C', options: ['0x3C', '0x3D'] },
            { name: 'model', label: 'Display Model', default: 'SSD1306 128x64', options: ['SSD1306 128x64', 'SSD1306 128x32', 'SSD1306 64x48', 'SH1106 128x64'] }
        ],
        template: `i2c:
  sda: {{sda}}
  scl: {{scl}}
  scan: true

font:
  - file: "gfonts://Roboto"
    id: my_font
    size: 16

display:
  - platform: ssd1306_i2c
    model: "{{model}}"
    address: {{address}}
    id: {{id}}
    lambda: |-
      it.printf(0, 0, id(my_font), "{{name}}");
      it.printf(0, 20, id(my_font), "Temp: %.1f°C", id(temp_sensor).state);
      it.printf(0, 40, id(my_font), "Humidity: %.1f%%", id(humid_sensor).state);`
    },
    
    // LED Strip (NeoPixel)
    'light.neopixel': {
        name: 'NeoPixel LED',
        category: 'light',
        description: 'NeoPixel/WS2812B LED Strip',
        icon: 'lightbulb',
        params: [
            { name: 'name', label: 'Light Name', default: 'LED Strip', required: true },
            { name: 'pin', label: 'Data Pin', default: 'GPIO2' },
            { name: 'num_leds', label: 'Number of LEDs', default: '30' },
            { name: 'id', label: 'Component ID', default: 'led_strip' }
        ],
        template: `light:
  - platform: neopixelbus
    type: GRB
    variant: WS2812x
    pin: {{pin}}
    num_leds: {{num_leds}}
    id: {{id}}
    name: "{{name}}"
    effects:
      - addressable_rainbow:
          name: "Rainbow Effect"
      - addressable_scan:
          name: "Scan Effect"
      - addressable_twinkle:
          name: "Twinkle Effect"`
    },
    
    // Complete Home Sensor Kit
    'kit.home_sensor': {
        name: 'Home Sensor Kit',
        category: 'kit',
        description: 'Complete Home Sensor Template (BME280 + PIR + Relay)',
        icon: 'home',
        params: [
            { name: 'name', label: 'Device Name', default: 'Living Room Sensor', required: true },
            { name: 'sda', label: 'I2C SDA', default: 'GPIO21' },
            { name: 'scl', label: 'I2C SCL', default: 'GPIO22' },
            { name: 'pir_pin', label: 'PIR Pin', default: 'GPIO13' },
            { name: 'relay_pin', label: 'Relay Pin', default: 'GPIO5' }
        ],
        template: `esphome:
  name: {{name|lower|replace(' ', '-')}}

esp32:
  board: esp32dev
  framework:
    type: arduino

logger:
  level: DEBUG

wifi:
  ssid: !secret wifi_ssid
  password: !secret wifi_password

api:
  encryption:
    key: !secret api_key

ota:
  - platform: esphome
    password: !secret ota_password

i2c:
  sda: {{sda}}
  scl: {{scl}}
  scan: true

sensor:
  - platform: bme280_i2c
    temperature:
      name: "{{name}} Temperature"
    humidity:
      name: "{{name}} Humidity"
    pressure:
      name: "{{name}} Pressure"
    address: 0x76
    update_interval: 60s

binary_sensor:
  - platform: gpio
    name: "{{name}} Motion"
    pin:
      number: {{pir_pin}}
      mode: INPUT_PULLUP
    device_class: motion
    filters:
      - delayed_off: 1s

switch:
  - platform: gpio
    name: "{{name}} Relay"
    pin: {{relay_pin}}
    id: relay_1
    restore_mode: ALWAYS_OFF`
    }
};

// Common pin definitions for different boards
const BOARD_PINS = {
    'esp32dev': {
        platform: 'esp32',
        recommended: ['GPIO2', 'GPIO4', 'GPIO5', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19', 'GPIO21', 'GPIO22', 'GPIO23', 'GPIO25', 'GPIO26', 'GPIO27', 'GPIO32', 'GPIO33'],
        input_only: ['GPIO34', 'GPIO35', 'GPIO36', 'GPIO39'],
        flash: ['GPIO6', 'GPIO7', 'GPIO8', 'GPIO9', 'GPIO10', 'GPIO11'],
        special: {
            'GPIO0': 'BOOT button (pull-up, do not connect)',
            'GPIO1': 'TX0 (Serial)',
            'GPIO3': 'RX0 (Serial)',
            'GPIO6': 'Flash (do not use)',
            'GPIO7': 'Flash (do not use)',
            'GPIO8': 'Flash (do not use)',
            'GPIO9': 'Flash (do not use)',
            'GPIO10': 'Flash (do not use)',
            'GPIO11': 'Flash (do not use)'
        },
        validPins: Array.from({length: 40}, (_, i) => `GPIO${i}`),
        maxPin: 39
    },
    'esp32-s3-devkitc-1': {
        platform: 'esp32',
        recommended: ['GPIO1', 'GPIO2', 'GPIO3', 'GPIO4', 'GPIO5', 'GPIO6', 'GPIO7', 'GPIO8', 'GPIO9', 'GPIO10', 'GPIO11', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16', 'GPIO17', 'GPIO18', 'GPIO19', 'GPIO20', 'GPIO21', 'GPIO33', 'GPIO34', 'GPIO35', 'GPIO36', 'GPIO37', 'GPIO38', 'GPIO39', 'GPIO40', 'GPIO41', 'GPIO42', 'GPIO43', 'GPIO44', 'GPIO45', 'GPIO46', 'GPIO47', 'GPIO48'],
        input_only: [],
        flash: [],
        special: {
            'GPIO0': 'BOOT button',
            'GPIO19': 'USB D-',
            'GPIO20': 'USB D+'
        },
        validPins: Array.from({length: 49}, (_, i) => `GPIO${i}`),
        maxPin: 48
    },
    'esp32-c3-devkitm-1': {
        platform: 'esp32',
        recommended: ['GPIO0', 'GPIO1', 'GPIO2', 'GPIO3', 'GPIO4', 'GPIO5', 'GPIO6', 'GPIO7', 'GPIO8', 'GPIO9', 'GPIO10', 'GPIO18', 'GPIO19', 'GPIO20', 'GPIO21'],
        input_only: [],
        flash: [],
        special: {
            'GPIO11': 'Flash (do not use)',
            'GPIO12': 'USB D+',
            'GPIO13': 'USB D-'
        },
        validPins: Array.from({length: 22}, (_, i) => `GPIO${i}`),
        maxPin: 21
    },
    'nodemcuv2': {
        platform: 'esp8266',
        recommended: ['D1', 'D2', 'D5', 'D6', 'D7', 'D8'],
        input_only: [],
        flash: ['D9', 'D10'],
        special: {
            'D0': 'WAKE (deep sleep wake, GPIO16)',
            'D1': 'GPIO5 (I2C SCL)',
            'D2': 'GPIO4 (I2C SDA)',
            'D3': 'GPIO0 (BOOT button)',
            'D4': 'GPIO2 (Built-in LED, active LOW)',
            'D5': 'GPIO14 (SPI SCLK)',
            'D6': 'GPIO12 (SPI MISO)',
            'D7': 'GPIO13 (SPI MOSI)',
            'D8': 'GPIO15 (BOOT, must be LOW on boot)'
        },
        validPins: ['GPIO0', 'GPIO1', 'GPIO2', 'GPIO3', 'GPIO4', 'GPIO5', 'GPIO6', 'GPIO7', 'GPIO8', 'GPIO9', 'GPIO10', 'GPIO11', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16'],
        maxPin: 16
    },
    'd1_mini': {
        platform: 'esp8266',
        recommended: ['D1', 'D2', 'D5', 'D6', 'D7'],
        input_only: [],
        flash: ['D9', 'D10'],
        special: {
            'D3': 'GPIO0 (BOOT button)',
            'D4': 'GPIO2 (Built-in LED)',
            'D8': 'GPIO15 (BOOT, must be LOW on boot)'
        },
        validPins: ['GPIO0', 'GPIO1', 'GPIO2', 'GPIO3', 'GPIO4', 'GPIO5', 'GPIO6', 'GPIO7', 'GPIO8', 'GPIO9', 'GPIO10', 'GPIO11', 'GPIO12', 'GPIO13', 'GPIO14', 'GPIO15', 'GPIO16'],
        maxPin: 16
    }
};

// Validation messages (hungarian/english)
const VALIDATION_MESSAGES = {
    hu: {
        empty_yaml: 'A YAML tartalma üres',
        missing_esphome: 'Hiányzik a kötelező "esphome:" szakasz',
        missing_name: 'Hiányzik az esphome név definíció',
        invalid_indent: 'Érvénytelen behúzás a {line}. sorban',
        duplicate_key: 'Ismétlődő kulcs: {key}',
        invalid_yaml_syntax: 'Érvénytelen YAML szintaxis a {line}. sorban',
        invalid_pin: 'Érvénytelen GPIO pin: {pin}',
        invalid_i2c_address: 'Érvénytelen I2C cím: {address}',
        platform_required: 'A platform megadása kötelező',
        name_required: 'A név megadása kötelező',
        id_duplicate: 'Ismétlődő ID: {id}',
        secret_not_found: 'A !secret hivatkozás nem található: {secret}',
        warning: 'Figyelmeztetés',
        error: 'Hiba',
        valid: 'Érvényes',
        validating: 'Validálás...'
    },
    en: {
        empty_yaml: 'YAML content is empty',
        missing_esphome: 'Missing required "esphome:" section',
        missing_name: 'Missing esphome name definition',
        invalid_indent: 'Invalid indentation at line {line}',
        duplicate_key: 'Duplicate key: {key}',
        invalid_yaml_syntax: 'Invalid YAML syntax at line {line}',
        invalid_pin: 'Invalid GPIO pin: {pin}',
        invalid_i2c_address: 'Invalid I2C address: {address}',
        platform_required: 'Platform is required',
        name_required: 'Name is required',
        id_duplicate: 'Duplicate ID: {id}',
        secret_not_found: '!secret reference not found: {secret}',
        warning: 'Warning',
        error: 'Error',
        valid: 'Valid',
        validating: 'Validating...'
    }
};

// Export for use in editor.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ESPHOME_TOP_LEVEL,
        SENSOR_PLATFORMS,
        BINARY_SENSOR_PLATFORMS,
        LIGHT_PLATFORMS,
        SWITCH_PLATFORMS,
        OUTPUT_PLATFORMS,
        DISPLAY_PLATFORMS,
        AUTOMATION_ACTIONS,
        CONDITIONS,
        BOARD_PINS,
        BOARD_IMAGES,
        GPIO_PINS,
        I2C_ADDRESSES,
        ESPHOME_CATEGORIES,
        VALIDATION_MESSAGES,
        QUICK_TEMPLATES
    };
}