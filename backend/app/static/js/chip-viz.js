// Chip Visualization Module
// Grafikus chip megjelenítés periféria bekötési logikával

// Peripheral definitions with pin requirements
const PERIPHERAL_TYPES = {
    // Sensors
    'dht11': { name: 'DHT11', type: 'sensor', pins: [{ name: 'DATA', pin: 'GPIO', required: true }], icon: 'thermostat' },
    'dht22': { name: 'DHT22', type: 'sensor', pins: [{ name: 'DATA', pin: 'GPIO', required: true }], icon: 'thermostat' },
    'ds18b20': { name: 'DS18B20', type: 'sensor', pins: [{ name: 'DATA', pin: 'GPIO', required: true }], icon: 'thermostat' },
    'bmp280': { name: 'BMP280', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'compress' },
    'bme280': { name: 'BME280', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'compress' },
    'aht10': { name: 'AHT10', type: 'sensor', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'thermostat' },
    'hx711': { name: 'HX711', type: 'sensor', pins: [{ name: 'DT', pin: 'GPIO' }, { name: 'SCK', pin: 'GPIO' }], icon: 'scale' },
    'hc-sr04': { name: 'HC-SR04', type: 'sensor', pins: [{ name: 'TRIG', pin: 'GPIO' }, { name: 'ECHO', pin: 'GPIO' }], icon: 'sensors' },
    'rcwl-0516': { name: 'RCWL-0516', type: 'sensor', pins: [{ name: 'OUT', pin: 'GPIO' }], icon: 'motion_photos_on' },
    'ldr': { name: 'LDR', type: 'sensor', pins: [{ name: 'AO', pin: 'ADC' }], icon: 'light_mode' },
    
    // Displays
    'ssd1306': { name: 'SSD1306 OLED', type: 'display', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'screenshot_monitor' },
    'st7789': { name: 'ST7789 TFT', type: 'display', pins: [{ name: 'CS', pin: 'GPIO' }, { name: 'DC', pin: 'GPIO' }, { name: 'RST', pin: 'GPIO' }, { name: 'MOSI', pin: 'GPIO', bus: 'SPI' }, { name: 'CLK', pin: 'GPIO', bus: 'SPI' }], icon: 'screenshot_monitor' },
    'ws2812b': { name: 'WS2812B LED', type: 'display', pins: [{ name: 'DATA', pin: 'GPIO' }], icon: 'lightbulb' },
    'tm1637': { name: 'TM1637 Display', type: 'display', pins: [{ name: 'CLK', pin: 'GPIO' }, { name: 'DIO', pin: 'GPIO' }], icon: 'screenshot_monitor' },
    
    // Input devices
    'rotary_encoder': { name: 'Rotary Encoder', type: 'input', pins: [{ name: 'A', pin: 'GPIO' }, { name: 'B', pin: 'GPIO' }, { name: 'SW', pin: 'GPIO', optional: true }], icon: 'settings' },
    'keypad': { name: 'Keypad 4x4', type: 'input', pins: Array(8).fill(0).map((_, i) => ({ name: `ROW${Math.floor(i/4)+1}/COL${i%4+1}`, pin: 'GPIO' })), icon: 'keyboard' },
    'button': { name: 'Button', type: 'input', pins: [{ name: 'IN', pin: 'GPIO' }], icon: 'radio_button_checked' },
    'touch': { name: 'Touch Sensor', type: 'input', pins: [{ name: 'OUT', pin: 'GPIO' }], icon: 'touch_app' },
    
    // Communication
    'uart_device': { name: 'UART Device', type: 'communication', pins: [{ name: 'TX', pin: 'GPIO', bus: 'UART' }, { name: 'RX', pin: 'GPIO', bus: 'UART' }], icon: 'swap_horiz' },
    'rs485': { name: 'RS485', type: 'communication', pins: [{ name: 'TX', pin: 'GPIO', bus: 'UART' }, { name: 'RX', pin: 'GPIO', bus: 'UART' }, { name: 'DE', pin: 'GPIO', optional: true }], icon: 'swap_horiz' },
    'can_bus': { name: 'CAN Bus', type: 'communication', pins: [{ name: 'TX', pin: 'GPIO' }, { name: 'RX', pin: 'GPIO' }], icon: 'swap_horiz' },
    
    // Actuators
    'relay': { name: 'Relay', type: 'actuator', pins: [{ name: 'IN', pin: 'GPIO' }], icon: 'power' },
    'servo': { name: 'Servo', type: 'actuator', pins: [{ name: 'PWM', pin: 'GPIO' }], icon: 'settings_remote' },
    'stepper': { name: 'Stepper Motor', type: 'actuator', pins: [{ name: 'IN1', pin: 'GPIO' }, { name: 'IN2', pin: 'GPIO' }, { name: 'IN3', pin: 'GPIO' }, { name: 'IN4', pin: 'GPIO' }], icon: 'settings' },
    
    // Power
    'dc_motor': { name: 'DC Motor', type: 'power', pins: [{ name: 'PWM', pin: 'GPIO' }, { name: 'DIR', pin: 'GPIO', optional: true }], icon: 'settings' },
    
    // I/O Expanders
    'pcf8574': { name: 'PCF8574', type: 'communication', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'developer_board' },
    'mcp23017': { name: 'MCP23017', type: 'communication', pins: [{ name: 'SDA', pin: 'GPIO', bus: 'I2C' }, { name: 'SCL', pin: 'GPIO', bus: 'I2C' }], icon: 'developer_board' },
    
    // Custom
    'custom_gpio': { name: 'Custom GPIO', type: 'sensor', pins: [{ name: 'PIN', pin: 'GPIO' }], icon: 'memory' }
};

// Board definitions with pin capabilities
const BOARD_PINS = {
    'esp32dev': {
        name: 'ESP32 DevKit',
        leftPins: [3, 1, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 34, 35, 36, 39],
        rightPins: [0, 2, 4, 5, 12, 13, 14, 15, 32, 33],
        adcPins: [32, 33, 34, 35, 36, 39],
        touchPins: [0, 2, 4, 12, 13, 14, 15, 27, 32, 33],
        defaultI2C: { sda: 21, scl: 22 },
        defaultSPI: { clk: 18, mosi: 23, miso: 19, cs: 5 },
        defaultUART: { tx: 1, rx: 3 }
    },
    'esp32-s3-devkitc-1': {
        name: 'ESP32-S3 DevKitC-1',
        leftPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21],
        rightPins: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48],
        adcPins: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        touchPins: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
        defaultI2C: { sda: 8, scl: 9 },
        defaultSPI: { clk: 12, mosi: 11, miso: 13, cs: 10 },
        defaultUART: { tx: 43, rx: 44 }
    },
    'esp32s3box': {
        name: 'ESP32-S3-Box',
        leftPins: [4, 5, 6, 7, 15, 16, 17, 18, 8, 9, 10, 11, 12, 13, 14, 1, 2, 42],
        rightPins: [35, 36, 37, 38, 39, 40, 41, 43, 44, 45, 46, 47, 48],
        adcPins: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        touchPins: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
        defaultI2C: { sda: 8, scl: 9 },
        defaultSPI: { clk: 12, mosi: 11, miso: 13, cs: 10 },
        defaultUART: { tx: 43, rx: 44 }
    },
    'esp8266': {
        name: 'ESP8266 D1 Mini',
        leftPins: [16, 5, 4, 0, 2, 14, 12, 13],
        rightPins: [15, 3, 1, 6, 7, 10, 11, 9],
        adcPins: [17],
        touchPins: [],
        defaultI2C: { sda: 4, scl: 5 },
        defaultSPI: { clk: 14, mosi: 13, miso: 12, cs: 15 },
        defaultUART: { tx: 1, rx: 3 }
    }
};

// Parse YAML for peripherals
function parsePeripheralsFromYaml(yaml) {
    const peripherals = [];
    if (!yaml) return peripherals;
    
    // Extract ALL pins first
    const allPins = new Set();
    const pinPatterns = [
        /pin:\s*(?:GPIO)?(\d+)/gi,
        /pin:\s*\n\s*number:\s*(?:GPIO)?(\d+)/gi,
        /number:\s*(?:GPIO)?(\d+)/gi,
        /sda:\s*(?:GPIO)?(\d+)/gi,
        /scl:\s*(?:GPIO)?(\d+)/gi,
        /tx_pin:\s*(?:GPIO)?(\d+)/gi,
        /rx_pin:\s*(?:GPIO)?(\d+)/gi
    ];
    
    pinPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(yaml)) !== null) {
            const pinNum = parseInt(match[1]);
            if (!isNaN(pinNum) && pinNum >= 0 && pinNum <= 48) {
                allPins.add(pinNum);
            }
        }
    });
    
    // I2C devices
    const i2cMatch = yaml.match(/i2c:[\s\S]*?sda:\s*(?:GPIO)?(\d+)[\s\S]*?scl:\s*(?:GPIO)?(\d+)/i);
    if (i2cMatch) {
        const sdaPin = parseInt(i2cMatch[1]);
        const sclPin = parseInt(i2cMatch[2]);
        
        // Check for common I2C devices
        const i2cDevices = [
            { pattern: /bme280/i, type: 'bme280', name: 'BME280', icon: 'compress' },
            { pattern: /bmp280/i, type: 'bmp280', name: 'BMP280', icon: 'compress' },
            { pattern: /aht10|aht20/i, type: 'aht10', name: 'AHT20', icon: 'thermostat' },
            { pattern: /ssd1306/i, type: 'ssd1306', name: 'SSD1306 OLED', icon: 'screenshot_monitor' },
            { pattern: /pcf8574/i, type: 'pcf8574', name: 'PCF8574', icon: 'developer_board' },
            { pattern: /mcp23017/i, type: 'mcp23017', name: 'MCP23017', icon: 'developer_board' }
        ];
        
        let found = false;
        i2cDevices.forEach(device => {
            if (yaml.match(device.pattern)) {
                peripherals.push({
                    type: device.type,
                    name: device.name,
                    pins: [
                        { name: 'SDA', pin: `GPIO${sdaPin}`, bus: 'I2C' },
                        { name: 'SCL', pin: `GPIO${sclPin}`, bus: 'I2C' }
                    ],
                    icon: device.icon
                });
                found = true;
            }
        });
        
        if (!found) {
            peripherals.push({
                type: 'i2c_device',
                name: 'I2C Device',
                pins: [
                    { name: 'SDA', pin: `GPIO${sdaPin}`, bus: 'I2C' },
                    { name: 'SCL', pin: `GPIO${sclPin}`, bus: 'I2C' }
                ],
                icon: 'developer_board'
            });
        }
    }
    
    // UART devices
    const uartMatch = yaml.match(/uart:[\s\S]*?tx_pin:\s*(?:GPIO)?(\d+)[\s\S]*?rx_pin:\s*(?:GPIO)?(\d+)/i);
    if (uartMatch) {
        const txPin = parseInt(uartMatch[1]);
        const rxPin = parseInt(uartMatch[2]);
        peripherals.push({
            type: 'uart_device',
            name: 'UART Device',
            pins: [
                { name: 'TX', pin: `GPIO${txPin}`, bus: 'UART' },
                { name: 'RX', pin: `GPIO${rxPin}`, bus: 'UART' }
            ],
            icon: 'swap_horiz'
        });
    }
    
    // OneWire devices
    const onewireMatch = yaml.match(/one_wire:[\s\S]*?pin:\s*(?:GPIO)?(\d+)/i);
    if (onewireMatch) {
        peripherals.push({
            type: 'ds18b20',
            name: 'OneWire Sensor',
            pins: [{ name: 'DATA', pin: `GPIO${onewireMatch[1]}` }],
            icon: 'thermostat'
        });
    }
    
    // DHT sensors
    const dhtMatch = yaml.match(/- platform: dht[\s\S]*?pin:\s*(?:GPIO)?(\d+)/i);
    if (dhtMatch) {
        peripherals.push({
            type: 'dht22',
            name: 'DHT Sensor',
            pins: [{ name: 'DATA', pin: `GPIO${dhtMatch[1]}` }],
            icon: 'thermostat'
        });
    }
    
    // ADC sensors
    const adcMatches = [...yaml.matchAll(/- platform: adc[\s\S]*?pin:\s*(?:GPIO)?(\d+)/gi)];
    adcMatches.forEach((match, index) => {
        const adcPin = parseInt(match[1]);
        peripherals.push({
            type: 'adc_sensor',
            name: `ADC Sensor ${index + 1}`,
            pins: [{ name: 'AO', pin: `GPIO${adcPin}` }],
            icon: 'speed'
        });
    });
    
    // GPIO binary sensors
    const gpioBinaryMatches = [...yaml.matchAll(/- platform: gpio[\s\S]*?pin:[\s\S]*?number:\s*(?:GPIO)?(\d+)/gi)];
    gpioBinaryMatches.forEach((match, index) => {
        const gpioPin = parseInt(match[1]);
        peripherals.push({
            type: 'binary_sensor',
            name: `Binary Sensor ${index + 1}`,
            pins: [{ name: 'IN', pin: `GPIO${gpioPin}` }],
            icon: 'sensors'
        });
    });
    
    // Relays/Switches
    const switchMatch = yaml.match(/switch:[\s\S]*?(?:pin:\s*(?:GPIO)?(\d+)|output_pin:\s*(?:GPIO)?(\d+))/i);
    if (switchMatch) {
        const relayPin = parseInt(switchMatch[1] || switchMatch[2]);
        if (!isNaN(relayPin)) {
            peripherals.push({
                type: 'relay',
                name: 'Relay/Switch',
                pins: [{ name: 'IN', pin: `GPIO${relayPin}` }],
                icon: 'power'
            });
        }
    }
    
    // LEDs
    const ledMatch = yaml.match(/esp32_rmt_led_strip:[\s\S]*?pin:\s*(?:GPIO)?(\d+)/i);
    if (ledMatch) {
        peripherals.push({
            type: 'ws2812b',
            name: 'RGB LED',
            pins: [{ name: 'DATA', pin: `GPIO${ledMatch[1]}` }],
            icon: 'lightbulb'
        });
    }
    
    // Status LED
    const statusLedMatch = yaml.match(/status_led:[\s\S]*?number:\s*(?:GPIO)?(\d+)/i);
    if (statusLedMatch) {
        peripherals.push({
            type: 'led',
            name: 'Status LED',
            pins: [{ name: 'LED', pin: `GPIO${statusLedMatch[1]}` }],
            icon: 'lightbulb'
        });
    }
    
    return peripherals;
}

// Render full chip visualization with peripherals
function renderFullChipVisualization(deviceName, platform, board, yamlContent) {
    const boardPins = BOARD_PINS[board] || BOARD_PINS['esp32dev'];
    const usedPins = parsePinsFromYaml(yamlContent);
    const peripherals = parsePeripheralsFromYaml(yamlContent);
    
    const container = document.createElement('div');
    container.className = 'chip-visualization';
    
    // Statistics
    const stats = calculatePinStatistics(usedPins, boardPins);
    
    container.innerHTML = `
        <link rel="stylesheet" href="/static/css/chip-viz.css">
        
        <!-- Statistics -->
        <div class="chip-statistics">
            <div class="stat-card">
                <div class="stat-value">${stats.totalPins}</div>
                <div class="stat-label">Total Pins</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.usedPins}</div>
                <div class="stat-label">Used Pins</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.freePins}</div>
                <div class="stat-label">Free Pins</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${peripherals.length}</div>
                <div class="stat-label">Peripherals</div>
            </div>
        </div>
        
        <!-- DIP Chip Visualization -->
        <div class="dip-chip-container">
            <div class="dip-chip">
                <div class="dip-chip-header">
                    <h3>
                        <span class="material-icons" style="font-size: 16px; vertical-align: middle;">memory</span>
                        ${platform}
                    </h3>
                    <span class="chip-badge">${boardPins.name || board}</span>
                </div>
                <div class="dip-chip-pins">
                    <div class="dip-chip-left">
                        ${boardPins.leftPins.map(pin => renderDipPin(pin, usedPins, 'left')).join('')}
                    </div>
                    <div class="dip-chip-center">
                        <span class="material-icons chip-icon">developer_board</span>
                        <div class="chip-name">${deviceName}</div>
                        <div class="chip-stats">${stats.usedPins}/${stats.totalPins} pins used</div>
                    </div>
                    <div class="dip-chip-right">
                        ${boardPins.rightPins.map(pin => renderDipPin(pin, usedPins, 'right')).join('')}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Legend -->
        <div class="chip-legend">
            <div class="legend-item">
                <span class="legend-dot pin-gpio"></span>
                <span>GPIO</span>
            </div>
            <div class="legend-item">
                <span class="legend-dot pin-i2c"></span>
                <span>I2C</span>
            </div>
            <div class="legend-item">
                <span class="legend-dot pin-spi"></span>
                <span>SPI</span>
            </div>
            <div class="legend-item">
                <span class="legend-dot pin-uart"></span>
                <span>UART</span>
            </div>
            <div class="legend-item">
                <span class="legend-dot pin-adc"></span>
                <span>ADC</span>
            </div>
            <div class="legend-item">
                <span class="legend-dot pin-touch"></span>
                <span>Touch</span>
            </div>
        </div>
        
        <!-- Peripherals Section -->
        <div class="peripheral-section">
            <div class="peripheral-header">
                <h4>
                    <span class="material-icons">devices</span>
                    Connected Peripherals
                </h4>
                <button class="btn btn-outline btn-sm" onclick="showAddPeripheralModal()">
                    <span class="material-icons" style="font-size: 14px;">add</span>
                    Add Peripheral
                </button>
            </div>
            <div class="peripheral-grid">
                ${peripherals.length > 0 ? 
                    peripherals.map(p => renderPeripheralCard(p)).join('') :
                    '<div style="color: var(--text-secondary); padding: 16px; text-align: center;">No peripherals detected in YAML</div>'
                }
            </div>
        </div>
        
        <!-- Connection Diagram -->
        ${peripherals.length > 0 ? renderConnectionDiagram(peripherals, boardPins) : ''}
    `;
    
    return container;
}

// Render DIP pin row
function renderDipPin(pinNum, usedPins, side) {
    const used = usedPins.flat().find(p => parseInt(p.pin.replace('GPIO', '')) === pinNum);
    const isLeft = side === 'left';
    
    const pinLabels = {
        0: 'BOOT', 1: 'TX0', 3: 'RX0', 16: 'RX2', 17: 'TX2',
        21: 'SDA', 22: 'SCL', 25: 'DAC1', 26: 'DAC2',
        34: 'IN34', 35: 'IN35', 36: 'VP', 39: 'VN'
    };
    
    const label = pinLabels[pinNum] || `${pinNum}`;
    const pinColor = used ? getPinColor(used.component) : 'var(--text-secondary)';
    
    return `
        <div class="pin-row ${used ? 'used' : ''}" 
             onclick="highlightPinInYaml(${pinNum})"
             title="${used ? used.component + ' - ' + used.function : 'GPIO ' + pinNum}">
            ${isLeft ? `<span class="pin-number">${pinNum}</span>` : ''}
            <span class="pin-label">${label}</span>
            ${!isLeft ? `<span class="pin-number">${pinNum}</span>` : ''}
            ${used ? `<span class="material-icons" style="font-size: 10px; color: ${pinColor};">check_circle</span>` : ''}
        </div>
    `;
}

// Get pin color by component type
function getPinColor(component) {
    const colors = {
        'GPIO': 'var(--primary)',
        'I2C': '#4caf50',
        'SPI': '#9c27b0',
        'UART': '#2196f3',
        'ADC': '#ff9800',
        'DAC': '#e91e63',
        'Touch': '#00bcd4',
        'OneWire': '#ff5722'
    };
    return colors[component] || 'var(--primary)';
}

// Render peripheral card
function renderPeripheralCard(peripheral) {
    const pType = PERIPHERAL_TYPES[peripheral.type] || { name: peripheral.type, type: 'sensor', icon: 'memory' };
    const iconClass = pType.type;
    
    return `
        <div class="peripheral-card" onclick="highlightPeripheralInYaml('${peripheral.type}')">
            <div class="peripheral-card-header">
                <div class="peripheral-icon ${iconClass}">
                    <span class="material-icons">${pType.icon}</span>
                </div>
                <div>
                    <div class="peripheral-name">${peripheral.name}</div>
                    <div class="peripheral-type">${pType.type}</div>
                </div>
            </div>
            <div class="peripheral-pins">
                ${peripheral.pins.map(pin => `
                    <div class="peripheral-pin ${pin.bus ? pin.bus.toLowerCase() : 'gpio'}">
                        <strong>${pin.name}:</strong> ${pin.pin}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Render connection diagram
function renderConnectionDiagram(peripherals, boardPins) {
    return `
        <div class="connection-diagram">
            <h4 style="margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
                <span class="material-icons">cable</span>
                Pin Connections
            </h4>
            ${peripherals.map(p => renderConnectionRow(p, boardPins)).join('')}
        </div>
    `;
}

// Render connection row
function renderConnectionRow(peripheral, boardPins) {
    const pType = PERIPHERAL_TYPES[peripheral.type] || { name: peripheral.type, icon: 'memory' };
    const pins = peripheral.pins.map(p => p.pin).join(', ');
    
    return `
        <div class="connection-row">
            <div class="connection-node chip">
                <span class="material-icons">developer_board</span>
                <small>ESP32</small>
            </div>
            <div class="connection-line" data-pins="${pins}"></div>
            <div class="connection-node peripheral">
                <span class="material-icons">${pType.icon}</span>
                <small>${peripheral.name}</small>
            </div>
        </div>
    `;
}

// Calculate pin statistics
function calculatePinStatistics(usedPins, boardPins) {
    const allPins = [...boardPins.leftPins, ...boardPins.rightPins];
    const usedPinNums = new Set();
    
    Object.values(usedPins).forEach(pins => {
        pins.forEach(p => {
            const pinNum = parseInt(p.pin.replace('GPIO', ''));
            usedPinNums.add(pinNum);
        });
    });
    
    return {
        totalPins: allPins.length,
        usedPins: usedPinNums.size,
        freePins: allPins.length - usedPinNums.size
    };
}

// Highlight pin in YAML editor
function highlightPinInYaml(pinNum) {
    if (typeof editor === 'undefined') return;
    
    const content = editor.getValue();
    const regex = new RegExp(`(pin:|sda:|scl:|mosi:|miso:|clk:|tx_pin:|rx_pin:).*?(?:GPIO)?${pinNum}`, 'gi');
    const match = content.match(regex);
    
    if (match) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            if (regex.test(line)) {
                editor.revealLineInCenter(index + 1);
                editor.setSelection({
                    startLineNumber: index + 1,
                    startColumn: 1,
                    endLineNumber: index + 1,
                    endColumn: line.length + 1
                });
            }
        });
    }
}

// Highlight peripheral in YAML
function highlightPeripheralInYaml(peripheralType) {
    if (typeof editor === 'undefined') return;
    
    const content = editor.getValue();
    const regex = new RegExp(`(-\\s*platform:\\s*${peripheralType}|${peripheralType}:)`, 'gi');
    const match = content.match(regex);
    
    if (match) {
        const lines = content.split('\n');
        lines.forEach((line, index) => {
            if (regex.test(line)) {
                editor.revealLineInCenter(index + 1);
                editor.setSelection({
                    startLineNumber: index + 1,
                    startColumn: 1,
                    endLineNumber: index + 1,
                    endColumn: line.length + 1
                });
            }
        });
    }
}

// Show add peripheral modal
function showAddPeripheralModal() {
    const modal = document.getElementById('peripheral-modal');
    if (!modal) return;
    
    modal.style.display = 'block';
    renderPeripheralList();
}

// Render peripheral list for modal
function renderPeripheralList(filter = '') {
    const container = document.getElementById('peripheral-list');
    if (!container) return;
    
    const filterLower = filter.toLowerCase();
    const types = Object.entries(PERIPHERAL_TYPES)
        .filter(([key, val]) => 
            filterLower === '' || 
            key.toLowerCase().includes(filterLower) ||
            val.name.toLowerCase().includes(filterLower) ||
            val.type.toLowerCase().includes(filterLower)
        );
    
    container.innerHTML = types.map(([key, val]) => `
        <div class="peripheral-item" onclick="selectPeripheral('${key}')">
            <div class="peripheral-icon ${val.type}">
                <span class="material-icons">${val.icon}</span>
            </div>
            <div class="peripheral-info">
                <div class="peripheral-name">${val.name}</div>
                <div class="peripheral-type">${val.type} • ${val.pins.length} pin(s)</div>
            </div>
        </div>
    `).join('');
}

// Export functions for use in index.html
window.renderFullChipVisualization = renderFullChipVisualization;
window.parsePeripheralsFromYaml = parsePeripheralsFromYaml;
window.PERIPHERAL_TYPES = PERIPHERAL_TYPES;
window.BOARD_PINS = BOARD_PINS;