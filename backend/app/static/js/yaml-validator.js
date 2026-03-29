/**
 * ESPHome YAML Validator Module
 * Provides real-time YAML validation with detailed error messages
 * 
 * Features:
 * - Cross-reference validation (ID references)
 * - Platform-specific pin validation (ESP32/ESP8266)
 * - Component dependency checking
 * - Multi-language support (EN/HU)
 */

// Platform-specific pin definitions
const PLATFORM_PINS = {
    esp32: {
        // ESP32 has GPIO 0-39 (40 pins total)
        // GPIO 0: BOOT button (pull-up, do not use as output)
        // GPIO 1: TX0 (Serial)
        // GPIO 3: RX0 (Serial)
        // GPIO 6-11: Flash (do not use)
        // GPIO 34-39: Input only (no pull-up/pull-down)
        validPins: Array.from({length: 40}, (_, i) => i),
        inputOnly: [34, 35, 36, 39],
        flash: [6, 7, 8, 9, 10, 11],
        special: {
            0: 'BOOT button (pull-up, do not use as output)',
            1: 'TX0 (Serial)',
            3: 'RX0 (Serial)',
            6: 'Flash (do not use)',
            7: 'Flash (do not use)',
            8: 'Flash (do not use)',
            9: 'Flash (do not use)',
            10: 'Flash (do not use)',
            11: 'Flash (do not use)'
        },
        adc: [32, 33, 34, 35, 36, 37, 38, 39],
        dac: [25, 26],
        touch: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    },
    esp8266: {
        // ESP8266 has GPIO 0-16 (17 pins total)
        // GPIO 0: BOOT button (pull-up)
        // GPIO 1: TX (Serial)
        // GPIO 2: Built-in LED
        // GPIO 3: RX (Serial)
        // GPIO 6-11: Flash (do not use)
        // GPIO 12: SCK (SPI)
        // GPIO 13: MISO (SPI)
        // GPIO 14: SCLK (SPI)
        // GPIO 15: BOOT (must be LOW on boot)
        // GPIO 16: WAKE (special function)
        validPins: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        inputOnly: [],
        flash: [6, 7, 8, 9, 10, 11],
        special: {
            0: 'BOOT button (pull-up, must be HIGH on boot)',
            1: 'TX (Serial)',
            2: 'Built-in LED (active LOW)',
            3: 'RX (Serial)',
            6: 'Flash (do not use)',
            7: 'Flash (do not use)',
            8: 'Flash (do not use)',
            9: 'Flash (do not use)',
            10: 'Flash (do not use)',
            11: 'Flash (do not use)',
            15: 'BOOT (must be LOW on boot)',
            16: 'WAKE (deep sleep wake)'
        },
        adc: [17], // ADC is only pin (A0)
        dac: [],   // No DAC
        touch: []  // No touch
    }
};

class ESPHomeValidator {
    constructor(options = {}) {
        this.language = options.language || 'en';
        this.validateSecrets = options.validateSecrets || false;
        this.secrets = options.secrets || {};
        this.errors = [];
        this.warnings = [];
        this.lines = [];
        this.yamlStructure = {};
    }

    // Get localized message
    getMessage(key, params = {}) {
        const messages = {
            en: {
                empty_yaml: 'YAML content is empty',
                missing_esphome: 'Missing required "esphome:" section',
                missing_name: 'Missing esphome name definition',
                missing_platform: 'Missing platform definition for component',
                invalid_indent: 'Invalid indentation at line {line}',
                duplicate_key: 'Duplicate key "{key}" at line {line}',
                invalid_yaml_syntax: 'Invalid YAML syntax at line {line}',
                invalid_pin: 'Invalid GPIO pin "{pin}" at line {line}',
                invalid_i2c_address: 'Invalid I2C address "{address}" at line {line}',
                platform_required: 'Platform is required for {component} at line {line}',
                name_required: 'Name is required for {component} at line {line}',
                id_duplicate: 'Duplicate ID "{id}" at line {line}',
                secret_not_found: '!secret reference "{secret}" not found at line {line}',
                warning: 'Warning',
                error: 'Error',
                valid: 'Valid',
                validating: 'Validating...',
                unknown_platform: 'Unknown platform "{platform}" for {component} at line {line}',
                missing_required_key: 'Missing required key "{key}" in {component} at line {line}',
                invalid_value: 'Invalid value "{value}" for key "{key}" at line {line}',
                unused_pin: 'Pin {pin} is used multiple times (line {first}, line {current})',
                input_only_pin: 'GPIO {pin} is input-only, cannot be used as output at line {line}',
                special_pin: 'GPIO {pin} has special function: {function} - use with caution at line {line}',
                // Cross-reference validation
                cross_reference_not_found: 'ID reference "{id}" not found in file at line {line}',
                unused_id: 'ID "{id}" is defined but never referenced at line {line}',
                // Platform-specific pins
                pin_not_supported_esp32: 'GPIO {pin} is not supported on ESP32 (valid: 0-39) at line {line}',
                pin_not_supported_esp8266: 'GPIO {pin} is not supported on ESP8266 (valid: 0-16) at line {line}',
                flash_pin_warning: 'GPIO {pin} is used for flash memory - avoid using at line {line}',
                input_only_pin_warning: 'GPIO {pin} is input-only (no pull-up/pull-down) at line {line}',
                special_pin_warning: 'GPIO {pin} has special function: {function} at line {line}',
                platform_detected: 'Platform detected: {platform}'
            },
            hu: {
                empty_yaml: 'A YAML tartalma üres',
                missing_esphome: 'Hiányzik a kötelező "esphome:" szakasz',
                missing_name: 'Hiányzik az esphome név definíció',
                missing_platform: 'Hiányzik a platform definíció a komponenshez',
                invalid_indent: 'Érvénytelen behúzás a {line}. sorban',
                duplicate_key: 'Ismétlődő kulcs "{key}" a {line}. sorban',
                invalid_yaml_syntax: 'Érvénytelen YAML szintaxis a {line}. sorban',
                invalid_pin: 'Érvénytelen GPIO pin "{pin}" a {line}. sorban',
                invalid_i2c_address: 'Érvénytelen I2C cím "{address}" a {line}. sorban',
                platform_required: 'Platform megadása kötelező a {component} számára a {line}. sorban',
                name_required: 'Név megadása kötelező a {component} számára a {line}. sorban',
                id_duplicate: 'Ismétlődő ID "{id}" a {line}. sorban',
                secret_not_found: '!secret hivatkozás "{secret}" nem található a {line}. sorban',
                warning: 'Figyelmeztetés',
                error: 'Hiba',
                valid: 'Érvényes',
                validating: 'Validálás...',
                unknown_platform: 'Ismeretlen platform "{platform}" a {component} számára a {line}. sorban',
                missing_required_key: 'Hiányzó kötelező kulcs "{key}" a {component}-ban a {line}. sorban',
                invalid_value: 'Érvénytelen érték "{value}" a kulcshoz "{key}" a {line}. sorban',
                unused_pin: 'A {pin} pin többször van használva (első: {first}. sor, jelenlegi: {current}. sor)',
                input_only_pin: 'A GPIO {pin} csak bemenetként használható, nem kimenetként a {line}. sorban',
                special_pin: 'A GPIO {pin} különleges funkcióval rendelkezik: {function} - óvatosan használja a {line}. sorban',
                // Cross-reference validation
                cross_reference_not_found: 'A "{id}" ID hivatkozás nem található a fájlban a {line}. sorban',
                unused_id: 'A "{id}" ID definiálva van, de nincs hivatkozva a {line}. sorban',
                // Platform-specific pins
                pin_not_supported_esp32: 'A GPIO {pin} nem támogatott ESP32-n (érvényes: 0-39) a {line}. sorban',
                pin_not_supported_esp8266: 'A GPIO {pin} nem támogatott ESP8266-on (érvényes: 0-16) a {line}. sorban',
                flash_pin_warning: 'A GPIO {pin} flash memória számára van fenntartva - kerülje a használatát a {line}. sorban',
                input_only_pin_warning: 'A GPIO {pin} csak bemenetként használható (nincs pull-up/pull-down) a {line}. sorban',
                special_pin_warning: 'A GPIO {pin} különleges funkcióval rendelkezik: {function} a {line}. sorban',
                platform_detected: 'Platform észlelve: {platform}'
            }
        };

        let msg = messages[this.language][key] || messages['en'][key] || key;
        Object.keys(params).forEach(p => {
            msg = msg.replace(`{${p}}`, params[p]);
        });
        return msg;
    }

    // Main validation function
    validate(yamlContent) {
        this.errors = [];
        this.warnings = [];
        this.lines = yamlContent.split('\n');
        this.yamlStructure = {};

        // Basic checks
        if (!yamlContent || yamlContent.trim() === '') {
            this.errors.push({
                line: 1,
                message: this.getMessage('empty_yaml'),
                severity: 'error'
            });
            return { valid: false, errors: this.errors, warnings: this.warnings };
        }

        // Parse YAML structure
        try {
            this.yamlStructure = this.parseYAMLStructure(yamlContent);
        } catch (e) {
            this.errors.push({
                line: 1,
                message: this.getMessage('invalid_yaml_syntax', { line: 1 }) + ': ' + e.message,
                severity: 'error'
            });
            return { valid: false, errors: this.errors, warnings: this.warnings };
        }

        // Check for required sections
        this.validateRequiredSections();

        // Validate indentation
        this.validateIndentation();

        // Validate component platforms
        this.validatePlatforms();

        // Validate IDs (uniqueness)
        this.validateIds();

        // Validate pins
        this.validatePins();

        // Validate I2C addresses
        this.validateI2CAddresses();

        // Validate secrets if enabled
        if (this.validateSecrets) {
            this.validateSecretReferences();
        }

        // B2: Validate cross-references (ID references)
        this.validateCrossReferences();

        // C2: Validate platform-specific pins
        const detectedPlatform = this.detectPlatform();
        if (detectedPlatform) {
            this.warnings.push({
                line: 1,
                message: this.getMessage('platform_detected', { platform: detectedPlatform.toUpperCase() }),
                severity: 'info',
                type: 'platform'
            });
            const pinResults = this.validatePlatformSpecificPins(detectedPlatform);
            this.errors.push(...pinResults.errors);
            this.warnings.push(...pinResults.warnings);
        }

        return {
            valid: this.errors.length === 0,
            errors: this.errors,
            warnings: this.warnings,
            structure: this.yamlStructure,
            platform: detectedPlatform
        };
    }

    // Parse YAML into structure
    parseYAMLStructure(yamlContent) {
        const structure = {};
        const stack = [];
        let currentIndent = -1;
        let currentKey = null;
        let parentKey = null;

        this.lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();
            
            // Skip empty lines and comments
            if (trimmed === '' || trimmed.startsWith('#')) return;

            // Calculate indent level
            const indent = line.search(/\S/);
            const indentLevel = Math.floor(indent / 2);

            // Key: value pair
            const keyMatch = trimmed.match(/^(-?\s*)(\w[\w-]*)\s*:\s*(.*)$/);
            if (keyMatch) {
                const [, prefix, key, value] = keyMatch;
                const isListItem = prefix.includes('-');
                
                // Pop stack if needed
                while (stack.length > indentLevel) {
                    stack.pop();
                }

                // Add to structure
                const path = [...stack, key].join('.');
                if (value) {
                    // Key with value
                    structure[path] = {
                        line: lineNum,
                        value: value,
                        indent: indent
                    };
                } else {
                    // Key with nested values
                    structure[path] = {
                        line: lineNum,
                        value: null,
                        indent: indent
                    };
                    stack.push(key);
                    currentKey = key;
                }

                // Track list items
                if (isListItem) {
                    structure[path + '._listItem'] = { line: lineNum };
                }
            }
        });

        return structure;
    }

    // Validate required sections
    validateRequiredSections() {
        // Check for esphome: section
        const hasEsphome = Object.keys(this.yamlStructure).some(k => k === 'esphome' || k.startsWith('esphome.'));
        if (!hasEsphome) {
            this.errors.push({
                line: 1,
                message: this.getMessage('missing_esphome'),
                severity: 'error'
            });
        }

        // Check for name under esphome
        const hasName = Object.keys(this.yamlStructure).some(k => k === 'esphome.name');
        if (hasEsphome && !hasName) {
            this.warnings.push({
                line: 1,
                message: this.getMessage('missing_name'),
                severity: 'warning'
            });
        }
    }

    // Validate indentation (must be multiple of 2)
    validateIndentation() {
        this.lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmed = line.trim();
            
            if (trimmed === '' || trimmed.startsWith('#')) return;
            
            const indent = line.search(/\S/);
            if (indent > 0 && indent % 2 !== 0) {
                this.errors.push({
                    line: lineNum,
                    message: this.getMessage('invalid_indent', { line: lineNum }),
                    severity: 'error'
                });
            }
        });
    }

    // Validate component platforms
    validatePlatforms() {
        const platformComponents = ['sensor', 'binary_sensor', 'output', 'light', 'switch', 
                                    'display', 'climate', 'cover', 'fan', 'button', 'select', 
                                    'number', 'text', 'lock', 'media_player'];
        
        // Known platforms for each component type
        const knownPlatforms = {
            sensor: ['dht', 'dallas', 'adc', 'bh1750', 'bme280', 'bme280_i2c', 'bme680', 'bmp085', 
                     'bmp280', 'htu21d', 'sht3xd', 'aht10', 'am2320', 'dps310', 'hdc1080', 'max31855', 
                     'max6675', 'tmp102', 'tmp117', 'tsl2561', 'tsl2591', 'veml7700', 'vl53l0x', 
                     'pulse_counter', 'pulse_meter', 'duty_cycle', 'frequency', 'wifi_signal', 
                     'uptime', 'internal_temperature', 'template', 'copy', 'filter', 'homeassistant'],
            binary_sensor: ['gpio', 'status', 'template', 'nextion', 'rc522', 'rdm6300', 'pn532', 
                           'ble_presence', 'ble_server', 'mcp23017', 'pcf8574', 'tuya', 'custom'],
            output: ['gpio', 'ledc', 'pca9685', 'mcp4725', 'mcp4728', 'dac', 'slow_pwm', 'pwm'],
            light: ['binary', 'monochromatic', 'cwww', 'rgb', 'rgbw', 'rgbww', 'neopixelbus', 
                   'fastled_clockless', 'fastled_spi', 'partition', 'addressable'],
            switch: ['gpio', 'template', 'restart', 'shutdown', 'uart', 'output', 'hbridge'],
            display: ['ssd1306_i2c', 'ssd1306_spi', 'ssd1322_i2c', 'ssd1322_spi', 'ssd1325_i2c', 
                     'ssd1325_spi', 'ssd1327_i2c', 'ssd1327_spi', 'ssd1675', 'waveshare_epaper', 
                     'ili9341', 'ili9xxx', 'st7789v', 'st7735', 'st7796', 'pcd8544', 'max7219', 
                     'tm1621', 'lcd_menu'],
            climate: ['thermostat', 'pid', 'bang_bang', 'template', 'haier', 'midea', 'daikin', 
                     'fujitsu', 'tcl', 'whirlpool', 'toshiba', 'yashima', 'ir_transmitter'],
            fan: ['speed', 'binary', 'template', 'hbridge'],
            button: ['template', 'restart', 'shutdown', 'factory_reset', 'safe_mode', 'script', 'wake_on_esh'],
            select: ['template', 'tuya', 'modbus_controller'],
            number: ['template', 'modbus_controller', 'tuya'],
            text: ['template', 'tuya']
        };

        platformComponents.forEach(comp => {
            // Check if component exists
            const compKey = `${comp}`;
            if (!Object.keys(this.yamlStructure).some(k => k === compKey || k.startsWith(`${compKey}.`))) {
                return;
            }

            // Find platform definitions
            Object.keys(this.yamlStructure).forEach(path => {
                if (path.startsWith(`${comp}.`) || path === comp) {
                    const match = path.match(new RegExp(`${comp}\\.(\\d+)\\.platform`));
                    if (match) {
                        const platform = this.yamlStructure[path]?.value;
                        const lineNum = this.yamlStructure[path]?.line;
                        
                        // Check if platform is known
                        if (platform && knownPlatforms[comp] && !knownPlatforms[comp].includes(platform.replace(/['"]/g, ''))) {
                            this.warnings.push({
                                line: lineNum,
                                message: this.getMessage('unknown_platform', { 
                                    platform: platform, 
                                    component: comp,
                                    line: lineNum 
                                }),
                                severity: 'warning'
                            });
                        }
                    }
                }

                // Check for missing platform in list items
                if (path.match(new RegExp(`${comp}\\.(\\d+)$`))) {
                    const itemPath = path;
                    const hasPlatform = Object.keys(this.yamlStructure).some(k => 
                        k.startsWith(itemPath) && k.endsWith('.platform')
                    );
                    const lineNum = this.yamlStructure[path]?.line;
                    
                    if (!hasPlatform && lineNum) {
                        // Check if this is an inline definition
                        const lineContent = this.lines[lineNum - 1] || '';
                        if (!lineContent.includes('platform:')) {
                            this.warnings.push({
                                line: lineNum,
                                message: this.getMessage('platform_required', { 
                                    component: comp,
                                    line: lineNum 
                                }),
                                severity: 'warning'
                            });
                        }
                    }
                }
            });
        });
    }

    // Validate IDs are unique
    validateIds() {
        const ids = {};
        
        Object.keys(this.yamlStructure).forEach(path => {
            if (path.endsWith('.id')) {
                const idValue = this.yamlStructure[path].value?.replace(/['"]/g, '');
                const lineNum = this.yamlStructure[path].line;
                
                if (idValue) {
                    if (ids[idValue]) {
                        this.errors.push({
                            line: lineNum,
                            message: this.getMessage('id_duplicate', { id: idValue, line: lineNum }),
                            severity: 'error'
                        });
                    } else {
                        ids[idValue] = lineNum;
                    }
                }
            }
        });
    }

    // Validate GPIO pins
    validatePins() {
        const validPins = Array.from({length: 40}, (_, i) => [`GPIO${i}`, `${i}`, `${i}`]);
        const inputOnlyPins = [34, 35, 36, 39];
        const specialPins = {
            0: 'BOOT button (pull-up)',
            1: 'TX0 (Serial)',
            3: 'RX0 (Serial)',
            6: 'Flash (do not use)',
            7: 'Flash (do not use)',
            8: 'Flash (do not use)',
            9: 'Flash (do not use)',
            10: 'Flash (do not use)',
            11: 'Flash (do not use)'
        };
        const pinPattern = /(pin:|sda:|scl:|mosi_pin:|miso_pin:|clk_pin:|tx_pin:|rx_pin:)\s*(?:GPIO)?(\d+)/gi;
        const usedPins = {};

        this.lines.forEach((line, index) => {
            const lineNum = index + 1;
            let match;
            
            while ((match = pinPattern.exec(line)) !== null) {
                const pinNum = parseInt(match[2]);
                const pinKey = `GPIO${pinNum}`;
                
                // Check if pin is valid
                if (pinNum < 0 || pinNum > 39) {
                    this.errors.push({
                        line: lineNum,
                        message: this.getMessage('invalid_pin', { pin: pinKey, line: lineNum }),
                        severity: 'error'
                    });
                    continue;
                }

                // Check for special pins
                if (specialPins[pinNum]) {
                    this.warnings.push({
                        line: lineNum,
                        message: this.getMessage('special_pin', { pin: pinNum, function: specialPins[pinNum], line: lineNum }),
                        severity: 'warning'
                    });
                }

                // Check for input-only pins used as output
                const pinType = match[1].toLowerCase();
                const isOutputPin = ['pin:', 'mosi_pin:', 'clk_pin:', 'tx_pin:'].includes(pinType);
                if (inputOnlyPins.includes(pinNum) && isOutputPin) {
                    this.warnings.push({
                        line: lineNum,
                        message: this.getMessage('input_only_pin', { pin: pinNum, line: lineNum }),
                        severity: 'warning'
                    });
                }

                // Track pin usage
                if (usedPins[pinNum]) {
                    this.warnings.push({
                        line: lineNum,
                        message: this.getMessage('unused_pin', { 
                            pin: pinKey, 
                            first: usedPins[pinNum],
                            current: lineNum 
                        }),
                        severity: 'warning'
                    });
                } else {
                    usedPins[pinNum] = lineNum;
                }
            }
        });
    }

    // Validate I2C addresses
    validateI2CAddresses() {
        const i2cPattern = /address:\s*(0x[0-9a-fA-F]+|\d+)/g;
        
        this.lines.forEach((line, index) => {
            const lineNum = index + 1;
            let match;
            
            while ((match = i2cPattern.exec(line)) !== null) {
                const address = match[1];
                
                // Validate hex format
                if (address.startsWith('0x')) {
                    const hexVal = parseInt(address, 16);
                    if (hexVal < 0 || hexVal > 127) {
                        this.errors.push({
                            line: lineNum,
                            message: this.getMessage('invalid_i2c_address', { address: address, line: lineNum }),
                            severity: 'error'
                        });
                    }
                } else {
                    // Decimal address
                    const decVal = parseInt(address);
                    if (decVal < 0 || decVal > 127) {
                        this.errors.push({
                            line: lineNum,
                            message: this.getMessage('invalid_i2c_address', { address: address, line: lineNum }),
                            severity: 'error'
                        });
                    }
                }
            }
        });
    }

    // Validate !secret references
    validateSecretReferences() {
        const secretPattern = /!secret\s+(\w+)/g;
        
        this.lines.forEach((line, index) => {
            const lineNum = index + 1;
            let match;
            
            while ((match = secretPattern.exec(line)) !== null) {
                const secretName = match[1];
                
                if (Object.keys(this.secrets).length > 0 && !this.secrets[secretName]) {
                    this.warnings.push({
                        line: lineNum,
                        message: this.getMessage('secret_not_found', { secret: secretName, line: lineNum }),
                        severity: 'warning'
                    });
                }
            }
        });
    }

    // Get used pins from YAML
    getUsedPins(yamlContent) {
        const usedPins = {
            gpio: [],
            i2c: [],
            spi: [],
            uart: []
        };

        if (!yamlContent) return usedPins;

        // Extract GPIO pins
        const gpioMatch = yamlContent.match(/(?:pin:|sda:|scl:|mosi:|miso:|clk:|tx_pin:|rx_pin:)\s*(?:GPIO)?(\d+)/gi);
        if (gpioMatch) {
            gpioMatch.forEach(m => {
                const pin = m.match(/(\d+)/);
                if (pin) {
                    usedPins.gpio.push({ pin: `GPIO${pin[1]}`, component: 'GPIO', function: 'Digital I/O' });
                }
            });
        }

        // Extract I2C pins
        const i2cMatch = yamlContent.match(/i2c:[\s\S]*?sda:\s*(?:GPIO)?(\d+)[\s\S]*?scl:\s*(?:GPIO)?(\d+)/i);
        if (i2cMatch) {
            usedPins.i2c.push({ pin: `GPIO${i2cMatch[1]}`, component: 'I2C', function: 'SDA' });
            usedPins.i2c.push({ pin: `GPIO${i2cMatch[2]}`, component: 'I2C', function: 'SCL' });
        }

        // Extract SPI pins
        const spiMatch = yamlContent.match(/spi:[\s\S]*?(?:clk_pin|clk):\s*(?:GPIO)?(\d+)[\s\S]*?(?:mosi_pin|mosi):\s*(?:GPIO)?(\d+)[\s\S]*?(?:miso_pin|miso):\s*(?:GPIO)?(\d+)/i);
        if (spiMatch) {
            usedPins.spi.push({ pin: `GPIO${spiMatch[1]}`, component: 'SPI', function: 'CLK' });
            usedPins.spi.push({ pin: `GPIO${spiMatch[2]}`, component: 'SPI', function: 'MOSI' });
            usedPins.spi.push({ pin: `GPIO${spiMatch[3]}`, component: 'SPI', function: 'MISO' });
        }

        // Extract UART pins
        const uartMatch = yamlContent.match(/uart:[\s\S]*?tx_pin:\s*(?:GPIO)?(\d+)[\s\S]*?rx_pin:\s*(?:GPIO)?(\d+)/i);
        if (uartMatch) {
            usedPins.uart.push({ pin: `GPIO${uartMatch[1]}`, component: 'UART', function: 'TX' });
            usedPins.uart.push({ pin: `GPIO${uartMatch[2]}`, component: 'UART', function: 'RX' });
        }

        return usedPins;
    }

    /**
     * B1: Build ID Reference Table
     * Creates a table of all defined IDs and their references
     */
    buildIdReferenceTable() {
        const idTable = {
            defined: {},    // IDs that are defined
            referenced: {}   // IDs that are referenced
        };

        // Find all defined IDs
        Object.keys(this.yamlStructure).forEach(path => {
            if (path.endsWith('.id')) {
                const idValue = this.yamlStructure[path].value?.replace(/['"]/g, '');
                const lineNum = this.yamlStructure[path].line;
                const parentPath = path.replace(/\.id$/, '');
                const componentType = parentPath.split('.')[0];
                
                if (idValue) {
                    idTable.defined[idValue] = {
                        line: lineNum,
                        path: parentPath,
                        component: componentType,
                        type: this.getComponentType(componentType)
                    };
                }
            }
        });

        // Find all ID references
        const referencePatterns = [
            /(?:sensor_id:|output_id:|switch_id:|light_id:|climate_id:|display_id:|fan_id:|cover_id:)\s*['"]?(\w+)['"]?/g,
            /(?:id:\s*['"]?)(\w+)(?:['"]?\s)/g,
            /(?:lambda:\s*[\s\S]*?id\()['"]?(\w+)['"]?\)/g
        ];

        this.lines.forEach((line, index) => {
            const lineNum = index + 1;
            
            // Check for sensor_id: references
            const sensorIdMatch = line.match(/(?:sensor_id:|output_id:|switch_id:|light_id:|climate_id:|display_id:|fan_id:|cover_id:)\s*['"]?(\w+)['"]?/);
            if (sensorIdMatch) {
                const refId = sensorIdMatch[1];
                if (!idTable.referenced[refId]) {
                    idTable.referenced[refId] = [];
                }
                idTable.referenced[refId].push({
                    line: lineNum,
                    context: 'component reference'
                });
            }
        });

        return idTable;
    }

    /**
     * Get component type from component name
     */
    getComponentType(componentName) {
        const componentTypes = {
            'sensor': 'sensor',
            'binary_sensor': 'binary_sensor',
            'output': 'output',
            'light': 'light',
            'switch': 'switch',
            'display': 'display',
            'climate': 'climate',
            'fan': 'fan',
            'cover': 'cover',
            'button': 'button',
            'select': 'select',
            'number': 'number',
            'text': 'text',
            'lock': 'lock'
        };
        return componentTypes[componentName] || 'unknown';
    }

    /**
     * B2: Validate Cross-References
     * Checks that all referenced IDs exist
     */
    validateCrossReferences() {
        const idTable = this.buildIdReferenceTable();
        
        // Check for undefined references
        Object.keys(idTable.referenced).forEach(refId => {
            if (!idTable.defined[refId]) {
                idTable.referenced[refId].forEach(ref => {
                    this.errors.push({
                        line: ref.line,
                        message: this.getMessage('cross_reference_not_found', { id: refId, line: ref.line }),
                        severity: 'error',
                        type: 'cross_reference'
                    });
                });
            }
        });

        // Check for unused IDs (warning only)
        Object.keys(idTable.defined).forEach(defId => {
            if (!idTable.referenced[defId]) {
                const def = idTable.defined[defId];
                this.warnings.push({
                    line: def.line,
                    message: this.getMessage('unused_id', { id: defId, line: def.line }),
                    severity: 'warning',
                    type: 'unused_id'
                });
            }
        });

        return idTable;
    }

    /**
     * C2: Platform-Specific Pin Validation
     * Validates pins based on ESP32 or ESP8266 platform
     */
    validatePlatformSpecificPins(platform) {
        const platformConfig = PLATFORM_PINS[platform];
        if (!platformConfig) {
            return { valid: true, warnings: [] };
        }

        const results = {
            valid: true,
            warnings: [],
            errors: []
        };

        // Extract all pin references
        const pinPattern = /(?:pin:|sda:|scl:|mosi_pin:|miso_pin:|clk_pin:|tx_pin:|rx_pin:)\s*(?:GPIO)?(\d+)(?:\s|$|['"])/gi;
        
        this.lines.forEach((line, index) => {
            const lineNum = index + 1;
            let match;
            
            while ((match = pinPattern.exec(line)) !== null) {
                const pinNum = parseInt(match[1]);
                
                // Check if pin is valid for platform
                if (!platformConfig.validPins.includes(pinNum)) {
                    const pinKey = `GPIO${pinNum}`;
                    const errorMsg = platform === 'esp8266' 
                        ? this.getMessage('pin_not_supported_esp8266', { pin: pinNum, line: lineNum })
                        : this.getMessage('pin_not_supported_esp32', { pin: pinNum, line: lineNum });
                    
                    results.errors.push({
                        line: lineNum,
                        message: errorMsg,
                        severity: 'error',
                        type: 'platform_pin'
                    });
                    results.valid = false;
                    continue;
                }

                // Check for flash pins (ESP32 and ESP8266)
                if (platformConfig.flash.includes(pinNum)) {
                    results.warnings.push({
                        line: lineNum,
                        message: this.getMessage('flash_pin_warning', { pin: pinNum, line: lineNum }),
                        severity: 'warning',
                        type: 'flash_pin'
                    });
                }

                // Check for input-only pins (ESP32 only)
                if (platformConfig.inputOnly.includes(pinNum)) {
                    const lineContent = line.toLowerCase();
                    if (lineContent.includes('output') || lineContent.includes('ledc') || lineContent.includes('pwm')) {
                        results.warnings.push({
                            line: lineNum,
                            message: this.getMessage('input_only_pin_warning', { pin: pinNum, line: lineNum }),
                            severity: 'warning',
                            type: 'input_only_pin'
                        });
                    }
                }

                // Check for special function pins
                if (platformConfig.special[pinNum]) {
                    results.warnings.push({
                        line: lineNum,
                        message: this.getMessage('special_pin_warning', { 
                            pin: pinNum, 
                            function: platformConfig.special[pinNum],
                            line: lineNum 
                        }),
                        severity: 'warning',
                        type: 'special_pin'
                    });
                }
            }
        });

        return results;
    }

    /**
     * Detect platform from YAML content
     */
    detectPlatform() {
        const content = this.lines.join('\n');
        
        // Check for ESP32
        if (content.match(/esp32:\s*\n\s*board:/) || content.match(/platform:\s*['"]?esp32['"]?/)) {
            return 'esp32';
        }
        
        // Check for ESP8266
        if (content.match(/esp8266:\s*\n\s*board:/) || content.match(/platform:\s*['"]?esp8266['"]?/)) {
            return 'esp8266';
        }
        
        // Default to ESP32
        return null; // Unknown platform
    }

    // Set secrets for validation
    setSecrets(secrets) {
        this.secrets = secrets || {};
        this.validateSecrets = Object.keys(this.secrets).length > 0;
    }

    // Set language for messages
    setLanguage(language) {
        this.language = language === 'hu' ? 'hu' : 'en';
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ESPHomeValidator;
}