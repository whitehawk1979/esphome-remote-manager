/**
 * ESPHome YAML Editor with Monaco Editor
 * Features: Syntax highlighting, validation, IntelliSense, pin visualization
 */

// Monaco Editor instance
let editor = null;

// Initialize Monaco Editor
function initMonacoEditor() {
    // Check if Monaco loader is available
    if (typeof require === 'undefined') {
        console.log('Monaco loader not available, using fallback textarea');
        return;
    }
    
    require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.50.0/min/vs' } });
    
    require(['vs/editor/editor.main'], function () {
        try {
            // Define YAML language
            monaco.languages.register({ id: 'yaml' });
        
        // YAML syntax highlighting
        monaco.languages.setMonarchTokensProvider('yaml', {
            tokenizer: {
                root: [
                    [/#.*$/, 'comment'],
                    [/^\s*-?\s*\w+:/, 'key'],
                    [/:\s+/, 'delimiter'],
                    [/\b(true|false|yes|no|on|off)\b/, 'keyword'],
                    [/\b\d+(\.\d+)?\b/, 'number'],
                    [/"([^"\\]|\\.)*$/, 'string.invalid'],
                    [/'([^'\\]|\\.)*$/, 'string.invalid'],
                    [/"/, 'string', '@string_double'],
                    [/'/, 'string', '@string_single'],
                    [/\$\{[^}]+\}/, 'variable'],
                    [/!secret\s+\w+/, 'variable'],
                    [/GPIO\d+/, 'constant'],
                    [/0x[0-9a-fA-F]+/, 'number.hex'],
                    [/\b(platform|pin|name|id|address|update_interval|ssid|password|api_key|ota_password)\b/, 'variable.predefined'],
                ],
                string_double: [
                    [/[^\\"]+/, 'string'],
                    [/\\./, 'string.escape'],
                    [/"/, 'string', '@pop']
                ],
                string_single: [
                    [/[^\\']+/, 'string'],
                    [/\\./, 'string.escape'],
                    [/'/, 'string', '@pop']
                ]
            }
        });
        
        // ESPHome component autocompletion
        monaco.languages.registerCompletionItemProvider('yaml', {
            provideCompletionItems: function(model, position) {
                const lineContent = model.getLineContent(position.lineNumber);
                const textUntilPosition = model.getValueInRange({
                    startLineNumber: 1,
                    startColumn: 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column
                });
                
                // Context-aware suggestions
                const suggestions = [];
                
                // Top-level components
                if (position.lineNumber <= 5 || textUntilPosition.split('\n').length <= 5) {
                    const topLevelComponents = [
                        { label: 'esphome', kind: monaco.languages.CompletionItemKind.Property, insertText: 'esphome:\n  name: ${1:device_name}\n  friendly_name: ${2:Device Name}', documentation: 'ESPHome device configuration' },
                        { label: 'esp32', kind: monaco.languages.CompletionItemKind.Property, insertText: 'esp32:\n  board: ${1:esp32dev}\n  framework:\n    type: ${2:arduino}', documentation: 'ESP32 platform config' },
                        { label: 'esp8266', kind: monaco.languages.CompletionItemKind.Property, insertText: 'esp8266:\n  board: ${1:nodemcuv2}', documentation: 'ESP8266 platform config' },
                        { label: 'wifi', kind: monaco.languages.CompletionItemKind.Property, insertText: 'wifi:\n  ssid: !secret wifi_ssid\n  password: !secret wifi_password', documentation: 'WiFi configuration' },
                        { label: 'logger', kind: monaco.languages.CompletionItemKind.Property, insertText: 'logger:\n  level: ${1:DEBUG}', documentation: 'Logging configuration' },
                        { label: 'api', kind: monaco.languages.CompletionItemKind.Property, insertText: 'api:\n  encryption:\n    key: !secret api_key', documentation: 'API configuration' },
                        { label: 'ota', kind: monaco.languages.CompletionItemKind.Property, insertText: 'ota:\n  - platform: esphome\n    password: !secret ota_password', documentation: 'OTA update configuration' },
                        { label: 'i2c', kind: monaco.languages.CompletionItemKind.Property, insertText: 'i2c:\n  sda: ${1:GPIO21}\n  scl: ${2:GPIO22}', documentation: 'I2C bus configuration' },
                        { label: 'spi', kind: monaco.languages.CompletionItemKind.Property, insertText: 'spi:\n  clk_pin: ${1:GPIO18}\n  mosi_pin: ${2:GPIO23}\n  miso_pin: ${3:GPIO19}', documentation: 'SPI bus configuration' },
                        { label: 'uart', kind: monaco.languages.CompletionItemKind.Property, insertText: 'uart:\n  tx_pin: ${1:GPIO1}\n  rx_pin: ${2:GPIO3}\n  baud_rate: ${3:9600}', documentation: 'UART configuration' },
                    ];
                    suggestions.push(...topLevelComponents);
                }
                
                // Sensor components
                if (lineContent.includes('sensor:') || textUntilPosition.includes('sensor:')) {
                    const sensorPlatforms = [
                        { label: 'platform: dht', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: dht\n  pin: ${1:GPIOXX}\n  temperature:\n    name: "${2:Temperature}"\n  humidity:\n    name: "${3:Humidity}"', documentation: 'DHT temperature/humidity sensor' },
                        { label: 'platform: bme280_i2c', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: bme280_i2c\n  temperature:\n    name: "${1:Temperature}"\n  humidity:\n    name: "${2:Humidity}"\n  pressure:\n    name: "${3:Pressure}"\n  address: 0x76', documentation: 'BME280 environmental sensor' },
                        { label: 'platform: dallas', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: dallas\n  pin: ${1:GPIOXX}\n  address: ${2:XX XX XX XX XX XX XX XX}', documentation: 'Dallas temperature sensor' },
                        { label: 'platform: adc', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: adc\n  pin: ${1:GPIOXX}\n  name: "${2:ADC}"', documentation: 'ADC sensor' },
                        { label: 'platform: ble_rssi', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: ble_rssi\n  mac_address: ${1:XX:XX:XX:XX:XX:XX}\n  name: "${2:RSSI}"', documentation: 'BLE RSSI sensor' },
                    ];
                    suggestions.push(...sensorPlatforms);
                }
                
                // Binary sensor components
                if (lineContent.includes('binary_sensor:') || textUntilPosition.includes('binary_sensor:')) {
                    const binarySensorPlatforms = [
                        { label: 'platform: gpio', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: gpio\n  pin: ${1:GPIOXX}\n  name: "${2:Button}"', documentation: 'GPIO binary sensor' },
                        { label: 'platform: ble_presence', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: ble_presence\n  mac_address: ${1:XX:XX:XX:XX:XX:XX}\n  name: "${2:Presence}"', documentation: 'BLE presence sensor' },
                        { label: 'platform: template', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: template\n  name: "${1:Template}"\n  lambda: |-\n    return ${2:id(sensor).state > 0};', documentation: 'Template binary sensor' },
                    ];
                    suggestions.push(...binarySensorPlatforms);
                }
                
                // Output components
                if (lineContent.includes('output:') || textUntilPosition.includes('output:')) {
                    const outputPlatforms = [
                        { label: 'platform: gpio', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: gpio\n  pin: ${1:GPIOXX}\n  id: ${2:output_id}', documentation: 'GPIO output' },
                        { label: 'platform: ledc', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: ledc\n  pin: ${1:GPIOXX}\n  id: ${2:pwm_output}\n  frequency: ${3:1000}Hz', documentation: 'PWM (LEDC) output' },
                    ];
                    suggestions.push(...outputPlatforms);
                }
                
                // Light components
                if (lineContent.includes('light:') || textUntilPosition.includes('light:')) {
                    const lightPlatforms = [
                        { label: 'platform: binary', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: binary\n  name: "${1:Light}"\n  output: ${2:output_id}', documentation: 'Binary light' },
                        { label: 'platform: monochromatic', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: monochromatic\n  name: "${1:Light}"\n  output: ${2:pwm_output}', documentation: 'Monochromatic light' },
                        { label: 'platform: rgb', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: rgb\n  name: "${1:RGB Light}"\n  red: ${2:red_output}\n  green: ${3:green_output}\n  blue: ${4:blue_output}', documentation: 'RGB light' },
                    ];
                    suggestions.push(...lightPlatforms);
                }
                
                // Switch components
                if (lineContent.includes('switch:') || textUntilPosition.includes('switch:')) {
                    const switchPlatforms = [
                        { label: 'platform: gpio', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: gpio\n  pin: ${1:GPIOXX}\n  name: "${2:Switch}"\n  id: ${3:switch_id}', documentation: 'GPIO switch' },
                        { label: 'platform: template', kind: monaco.languages.CompletionItemKind.Value, insertText: '- platform: template\n  name: "${1:Template Switch}"\n  turn_on_action:\n    - ${2:output.turn_on: output_id}\n  turn_off_action:\n    - ${3:output.turn_off: output_id}', documentation: 'Template switch' },
                    ];
                    suggestions.push(...switchPlatforms);
                }
                
                return { suggestions };
            }
        });
        
        // YAML Folding Provider - Collapsible sections for ESPHome config
        monaco.languages.registerFoldingRangeProvider('yaml', {
            provideFoldingRanges: function(model, context, token) {
                const ranges = [];
                const lines = model.getLinesContent();
                
                // ESPHome top-level sections
                const topLevelKeys = [
                    'esphome', 'esp32', 'esp8266', 'wifi', 'logger', 'api', 'ota',
                    'i2c', 'spi', 'uart', 'sensor', 'binary_sensor', 'switch',
                    'light', 'output', 'display', 'font', 'image', 'globals',
                    'interval', 'time', 'sun', 'mqtt', 'web_server', 'captive_portal',
                    'http_request', 'bluetooth', 'ble', 'ethernet',
                    // Template-related sections (collapsible in editor)
                    'templates', 'button', 'select', 'number', 'text', 'lock',
                    'cover', 'fan', 'climate', 'stepper', 'servo', 'pwm'
                ];
                
                let currentSection = null;
                let currentStart = 0;
                let currentIndent = 0;
                
                // Platform blocks tracking - FIX for multiple platform folding
                let platformStart = null;
                
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i];
                    const trimmed = line.trim();
                    const indent = line.search(/\S/);
                    
                    if (trimmed === '' || trimmed.startsWith('#')) continue;
                    
                    // Top-level section detection
                    let isTopLevelKey = false;
                    for (const key of topLevelKeys) {
                        if (trimmed === `${key}:` || trimmed.startsWith(`${key}:`)) {
                            // Close previous platform block if any
                            if (platformStart !== null && i > platformStart) {
                                ranges.push({
                                    start: platformStart,
                                    end: i - 1,
                                    kind: monaco.languages.FoldingRangeKind.Region
                                });
                                platformStart = null;
                            }
                            
                            // Close previous section
                            if (currentSection !== null && i > currentStart) {
                                ranges.push({
                                    start: currentStart,
                                    end: i - 1,
                                    kind: monaco.languages.FoldingRangeKind.Region
                                });
                            }
                            currentSection = key;
                            currentStart = i;
                            currentIndent = indent;
                            isTopLevelKey = true;
                            break;
                        }
                    }
                    
                    // Platform blocks (list items under sections) - FIXED LOGIC
                    if (trimmed.startsWith('- platform:')) {
                        if (platformStart !== null && i > platformStart) {
                            // Close previous platform block
                            ranges.push({
                                start: platformStart,
                                end: i - 1,
                                kind: monaco.languages.FoldingRangeKind.Region
                            });
                        }
                        platformStart = i;
                    }
                }
                
                // Close last platform block if any
                if (platformStart !== null && lines.length > platformStart + 1) {
                    ranges.push({
                        start: platformStart,
                        end: lines.length - 1,
                        kind: monaco.languages.FoldingRangeKind.Region
                    });
                }
                
                // Close last section
                if (currentSection !== null && lines.length > currentStart + 1) {
                    ranges.push({
                        start: currentStart,
                        end: lines.length - 1,
                        kind: monaco.languages.FoldingRangeKind.Region
                    });
                }
                
                return ranges;
            }
        });
        
        // Create editor with VS Code-like theme and enhanced scrollbar
        editor = monaco.editor.create(document.getElementById('yaml-editor-container'), {
            value: getDefaultYAML(),
            language: 'yaml',
            theme: 'vs-dark',
            automaticLayout: true,
            minimap: { enabled: true, scale: 1 },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: true,
            scrollBeyondLastLine: true,
            wordWrap: 'on',
            folding: true,
            foldingStrategy: 'indentation',
            renderLineHighlight: 'all',
            selectOnLineNumbers: true,
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            smoothScrolling: true,
            padding: { top: 10 },
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            guides: {
                bracketPairs: true,
                indentation: true,
                highlightActiveIndentation: true
            },
            suggest: {
                showKeywords: true,
                showSnippets: true,
                showClasses: true,
                showFunctions: true,
                showVariables: true,
                showConstants: true
            },
            // Enhanced scrollbar configuration for easy navigation
            scrollbar: {
                vertical: 'visible',
                verticalScrollbarSize: 16,
                verticalHasArrows: false,
                horizontal: 'visible',
                horizontalScrollbarSize: 16,
                horizontalHasArrows: false,
                alwaysConsumeMouseWheel: true,
                useShadows: true,
                shadowSize: 4
            }
        });
        
        // Store editor globally for access from other functions
        window.monacoEditor = editor;
        
        // Add keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
            saveYaml();
        });
        
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyL, function() {
            editor.getAction('editor.action.formatDocument').run();
        });
        
        // Hide fallback textarea and show Monaco container
        const textarea = document.getElementById('yaml-content');
        const monacoContainer = document.getElementById('yaml-editor-container');
        if (textarea) textarea.style.display = 'none';
        if (monacoContainer) monacoContainer.style.display = 'block';
        
        // Initialize debounce functions
        initDebounces();
        
        // Content change handler - loop prevention with version tracking
        editor.onDidChangeModelContent(onContentChange);
        
        // Initial validation
        validateYAML();
        
        console.log('Monaco Editor initialized with IntelliSense');
        } catch (error) {
            console.error('Failed to initialize Monaco Editor:', error);
            // Show fallback textarea
            const textarea = document.getElementById('yaml-content');
            const monacoContainer = document.getElementById('yaml-editor-container');
            if (textarea) textarea.style.display = 'block';
            if (monacoContainer) monacoContainer.style.display = 'none';
        }
    });
}

// Global variables (set by index.html)
let deviceName = null;
let selectedBoard = 'esp32dev';
let selectedPlatform = 'ESP32';

// Loop prevention variables
let validationTimeout = null;
let lastYAML = '';
let lastPinsJSON = '';  // Track pin state changes
let isUpdating = false;
let contentVersion = 0;
let lastProcessedVersion = 0;
let pendingPinData = null;
let pendingPinVersion = 0;
let debouncedValidation = null;
let debouncedPinUpdate = null;

// Use window.API_BASE defined in index.html (fallback to window.location.origin)
// Note: API_BASE is declared as const in index.html inline script, accessible globally via window.API_BASE

// Get default YAML template
function getDefaultYAML() {
    return `esphome:
  name: ${deviceName || 'new-device'}
  friendly_name: ${deviceName || 'New Device'}

esp32:
  board: ${selectedBoard || 'esp32dev'}
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
`;
}

// Initialize selected board/platform
// (already declared above)

// Update chip visualization based on platform and board
async function updateChipVisualization(platform, board) {
    const chipContainer = document.getElementById('pin-visualization');
    if (!chipContainer) return;
    
    // Show loading
    chipContainer.innerHTML = '<div style="text-align: center; padding: 20px;"><span class="material-icons" style="animation: spin 1s linear infinite;">refresh</span><br><small>Loading chip diagram...</small></div>';
    
    try {
        // Fetch board pinout
        const response = await fetch(`${window.API_BASE || window.location.origin}/api/chip/pins/${board}`);
        const data = await response.json();
        
        if (data.success) {
            // Parse current YAML for used pins
            const yamlContent = typeof getEditorContent === 'function' ? getEditorContent() : document.getElementById('yaml-content').value;
            const usedPins = parsePinsFromYaml(yamlContent);
            
            // Render chip diagram
            renderChipDiagram(data.pinout || data, board, platform, usedPins);
        } else {
            chipContainer.innerHTML = `<div style="color: var(--text-secondary); padding: 12px;">Chip diagram not available for ${board}</div>`;
        }
    } catch (error) {
        console.error('Failed to load chip pinout:', error);
        chipContainer.innerHTML = '<div style="color: var(--text-secondary); padding: 12px;">Failed to load chip diagram</div>';
    }
}

// Parse pins from YAML content
function parsePinsFromYaml(yaml) {
    const usedPins = {
        gpio: [],
        i2c: [],
        spi: [],
        uart: []
    };
    
    if (!yaml) return usedPins;
    
    // Extract GPIO pins
    const gpioMatch = yaml.match(/(?:pin:|sda:|scl:|mosi:|miso:|clk:|tx_pin:|rx_pin:)\s*(?:GPIO)?(\d+|GPIO\d+)/gi);
    if (gpioMatch) {
        gpioMatch.forEach(m => {
            const pin = m.match(/(\d+)/);
            if (pin) {
                usedPins.gpio.push({ pin: `GPIO${pin[1]}`, component: 'GPIO', function: 'Digital I/O' });
            }
        });
    }
    
    // Extract I2C pins
    const i2cMatch = yaml.match(/i2c:[\s\S]*?sda:\s*(?:GPIO)?(\d+)[\s\S]*?scl:\s*(?:GPIO)?(\d+)/i);
    if (i2cMatch) {
        usedPins.i2c.push({ pin: `GPIO${i2cMatch[1]}`, component: 'I2C', function: 'SDA' });
        usedPins.i2c.push({ pin: `GPIO${i2cMatch[2]}`, component: 'I2C', function: 'SCL' });
    }
    
    // Extract SPI pins
    const spiMatch = yaml.match(/spi:[\s\S]*?(?:clk_pin|clk):\s*(?:GPIO)?(\d+)[\s\S]*?(?:mosi_pin|mosi):\s*(?:GPIO)?(\d+)[\s\S]*?(?:miso_pin|miso):\s*(?:GPIO)?(\d+)/i);
    if (spiMatch) {
        usedPins.spi.push({ pin: `GPIO${spiMatch[1]}`, component: 'SPI', function: 'CLK' });
        usedPins.spi.push({ pin: `GPIO${spiMatch[2]}`, component: 'SPI', function: 'MOSI' });
        usedPins.spi.push({ pin: `GPIO${spiMatch[3]}`, component: 'SPI', function: 'MISO' });
    }
    
    // Extract UART pins
    const uartMatch = yaml.match(/uart:[\s\S]*?tx_pin:\s*(?:GPIO)?(\d+)[\s\S]*?rx_pin:\s*(?:GPIO)?(\d+)/i);
    if (uartMatch) {
        usedPins.uart.push({ pin: `GPIO${uartMatch[1]}`, component: 'UART', function: 'TX' });
        usedPins.uart.push({ pin: `GPIO${uartMatch[2]}`, component: 'UART', function: 'RX' });
    }
    
    return usedPins;
}

// Render chip diagram
function renderChipDiagram(pinout, board, platform, usedPins) {
    const container = document.getElementById('pin-visualization');
    if (!container) return;
    
    // Common ESP32 pin layout
    const leftPins = [3, 1, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 34, 35, 36, 39];
    const rightPins = [0, 2, 4, 5, 12, 13, 14, 15, 32, 33];
    
    // Flatten used pins
    const allUsedPins = [];
    Object.values(usedPins).forEach(pins => {
        pins.forEach(p => {
            const pinNum = parseInt(p.pin.replace('GPIO', ''));
            if (!allUsedPins.find(x => x.pin === pinNum)) {
                allUsedPins.push({ pin: pinNum, ...p });
            }
        });
    });
    
    container.innerHTML = `
        <div class="chip-diagram" style="background: var(--card-bg); border-radius: 8px; padding: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <h4 style="margin: 0; font-size: 13px;">
                    <span class="material-icons" style="font-size: 16px; vertical-align: middle;">memory</span>
                    ${platform || 'ESP32'} - ${board}
                </h4>
                <small style="color: var(--text-secondary);">${allUsedPins.length} pins used</small>
            </div>
            <div style="display: flex; gap: 8px;">
                <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
                    ${leftPins.map(p => renderPinRow(p, allUsedPins, 'left')).join('')}
                </div>
                <div style="flex: 0 0 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg); border-radius: 4px; padding: 8px 4px;">
                    <span class="material-icons" style="font-size: 24px; color: var(--primary);">memory</span>
                    <small style="font-size: 10px; text-align: center; margin-top: 4px;">${board}</small>
                </div>
                <div style="flex: 1; display: flex; flex-direction: column; gap: 2px;">
                    ${rightPins.map(p => renderPinRow(p, allUsedPins, 'right')).join('')}
                </div>
            </div>
            <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; font-size: 11px;">
                <span><span style="display: inline-block; width: 8px; height: 8px; background: var(--primary); border-radius: 50%; margin-right: 4px;"></span>GPIO</span>
                <span><span style="display: inline-block; width: 8px; height: 8px; background: #4caf50; border-radius: 50%; margin-right: 4px;"></span>I2C</span>
                <span><span style="display: inline-block; width: 8px; height: 8px; background: #9c27b0; border-radius: 50%; margin-right: 4px;"></span>SPI</span>
                <span><span style="display: inline-block; width: 8px; height: 8px; background: #2196f3; border-radius: 50%; margin-right: 4px;"></span>UART</span>
            </div>
        </div>
    `;
}

// Render single pin row
function renderPinRow(pinNum, usedPins, side) {
    const used = usedPins.find(p => p.pin === pinNum);
    const pinColor = used ? 
        (used.component === 'I2C' ? '#4caf50' : 
         used.component === 'SPI' ? '#9c27b0' : 
         used.component === 'UART' ? '#2196f3' : 'var(--primary)') : 
        'var(--text-secondary)';
    
    const pinLabels = {
        0: 'BOOT', 1: 'TX0', 3: 'RX0', 16: 'RX2', 17: 'TX2',
        21: 'SDA', 22: 'SCL', 25: 'DAC1', 26: 'DAC2',
        34: 'IN34', 35: 'IN35', 36: 'VP', 39: 'VN'
    };
    
    const label = pinLabels[pinNum] || `${pinNum}`;
    const isLeft = side === 'left';
    
    return `
        <div style="display: flex; align-items: center; ${isLeft ? '' : 'flex-direction: row-reverse;'} gap: 4px; padding: 2px 4px; border-radius: 3px; ${used ? 'background: rgba(3, 169, 244, 0.1);' : ''}"
             title="${used ? used.component + ' - ' + used.function : 'GPIO ' + pinNum}">
            <span style="font-size: 10px; color: ${pinColor}; font-weight: ${used ? '600' : '400'};">${label}</span>
            <span style="font-size: 9px; color: var(--text-secondary);">${pinNum}</span>
            ${used ? `<span class="material-icons" style="font-size: 10px; color: ${pinColor};">check_circle</span>` : ''}
        </div>
    `;
}

// Debounce constants
const VALIDATION_DEBOUNCE_MS = 1000;
const PIN_UPDATE_DEBOUNCE_MS = 2000;

// Debounce helper - creates a debounced function
function createDebounce(func, wait, context) {
    let timeout = null;
    return function(...args) {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            timeout = null;
            func.apply(context || this, args);
        }, wait);
    };
}

// Legacy debounce function for backwards compatibility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Content change handler - loop prevention with version tracking
function onContentChange() {
    if (!editor || isUpdating) return;
    
    contentVersion++;
    const currentVersion = contentVersion;
    const currentYAML = editor.getValue();
    
    // Skip if content hasn't actually changed
    if (currentYAML === lastYAML) return;
    
    // Trigger debounced validation
    if (debouncedValidation) {
        debouncedValidation(currentYAML, currentVersion);
    }
}

// Initialize debounce functions
function initDebounces() {
    debouncedValidation = createDebounce(performValidation, VALIDATION_DEBOUNCE_MS);
    debouncedPinUpdate = createDebounce(function() {
        if (pendingPinData && pendingPinVersion >= contentVersion) {
            updatePinVisualization(pendingPinData);
        }
    }, PIN_UPDATE_DEBOUNCE_MS);
}

// Perform validation with version tracking to prevent loops
async function performValidation(yamlContent, version) {
    if (isUpdating || version !== contentVersion) return;
    if (yamlContent === lastYAML) return;
    
    const validationStatus = document.getElementById('validation-status');
    if (!validationStatus) return;
    
    try {
        isUpdating = true;
        validationStatus.innerHTML = `<span class="material-icons" style="color: var(--warning); animation: spin 1s linear infinite;">sync</span><span style="color: var(--warning);">Validating...</span>`;
        
        const response = await fetch(`${window.API_BASE || window.location.origin}/api/validate/yaml`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ yaml: yamlContent })
        });
        
        const result = await response.json();
        
        // Check if version is still current
        if (version !== contentVersion) return;
        
        if (result.success && result.valid) {
            validationStatus.innerHTML = `<span class="material-icons" style="color: var(--success);">check_circle</span><span style="color: var(--success);">YAML valid</span>`;
            lastYAML = yamlContent;
            lastProcessedVersion = version;
            
            // Pin update - ONLY if pins changed
            if (result.used_pins) {
                const pinsJSON = JSON.stringify(result.used_pins);
                if (pinsJSON !== lastPinsJSON) {
                    lastPinsJSON = pinsJSON;
                    if (debouncedPinUpdate) {
                        pendingPinData = result.used_pins;
                        pendingPinVersion = version;
                        debouncedPinUpdate();
                    }
                }
            }
        } else {
            const errorMsg = result.error || result.errors?.join(', ') || 'Validation failed';
            validationStatus.innerHTML = `<span class="material-icons" style="color: var(--error);">error</span><span style="color: var(--error);">${errorMsg}</span>`;
        }
    } catch (error) {
        console.error('[Editor] Validation error:', error);
        if (version === contentVersion) {
            validationStatus.innerHTML = `<span class="material-icons" style="color: var(--warning);">warning</span><span style="color: var(--warning);">Validation unavailable</span>`;
        }
    } finally {
        isUpdating = false;
    }
}

// Legacy validateYAML function - wrapper for backwards compatibility
async function validateYAML() {
    if (!editor || isUpdating) return;
    
    const yamlContent = editor.getValue();
    if (yamlContent === lastYAML) return;
    
    contentVersion++;
    if (debouncedValidation) {
        debouncedValidation(yamlContent, contentVersion);
    }
}

// Show validation warnings
function showValidationWarnings(warnings) {
    const warningContainer = document.getElementById('validation-warnings');
    if (!warningContainer) return;
    
    warningContainer.innerHTML = warnings.map(w => `
        <div class="warning-item">
            <span class="material-icons" style="color: var(--warning); font-size: 16px;">warning</span>
            <span>${w}</span>
        </div>
    `).join('');
}

// Update pin visualization
function updatePinVisualization(usedPins) {
    const pinContainer = document.getElementById('pin-visualization');
    if (!pinContainer || !selectedBoard) return;
    
    // Fetch board pinout
    fetch(`${window.API_BASE || window.location.origin}/api/chip/pins/${selectedBoard}`)
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                renderPinDiagram(data.pinout, usedPins);
            }
        });
}

// Render pin diagram
function renderPinDiagram(pinout, usedPins) {
    const container = document.getElementById('pin-visualization');
    if (!container) return;
    
    // Get all used pins with their functions
    const allUsedPins = [];
    Object.keys(usedPins).forEach(type => {
        usedPins[type].forEach(p => {
            allUsedPins.push({
                pin: p.pin,
                type: type,
                component: p.component,
                function: p.function
            });
        });
    });
    
    // ESP32 DevKit layout (simplified)
    const leftPins = [3, 1, 16, 17, 18, 19, 21, 22, 23, 25, 26, 27, 34, 35, 36, 39];
    const rightPins = [0, 2, 4, 5, 12, 13, 14, 15, 32, 33, 4, 5, 12, 13, 14, 15];
    
    container.innerHTML = `
        <div class="chip-diagram">
            <div class="chip-header">
                <h4>${pinout.name || selectedBoard}</h4>
                <button onclick="showFullPinDiagram()" class="btn-small">
                    <span class="material-icons">zoom_in</span>
                </button>
            </div>
            <div class="chip-body">
                <div class="pin-column left">
                    ${leftPins.map(p => `
                        <div class="pin ${getPinClass(p, allUsedPins)}" 
                             title="${getPinTitle(p, allUsedPins)}"
                             onclick="showPinDetails(${p}, ${JSON.stringify(allUsedPins.filter(x => x.pin === p)).replace(/"/g, '&quot;')})">
                            <span class="pin-number">${p}</span>
                            <span class="pin-label">${getPinLabel(p, pinout)}</span>
                        </div>
                    `).join('')}
                </div>
                <div class="chip-center">
                    <div class="chip-icon">
                        <span class="material-icons" style="font-size: 48px;">memory</span>
                    </div>
                    <div class="chip-info">
                        <small>${selectedPlatform || 'ESP32'}</small>
                    </div>
                </div>
                <div class="pin-column right">
                    ${rightPins.map(p => `
                        <div class="pin ${getPinClass(p, allUsedPins)}" 
                             title="${getPinTitle(p, allUsedPins)}"
                             onclick="showPinDetails(${p}, ${JSON.stringify(allUsedPins.filter(x => x.pin === p)).replace(/"/g, '&quot;')})">
                            <span class="pin-label">${getPinLabel(p, pinout)}</span>
                            <span class="pin-number">${p}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="chip-legend">
                <div class="legend-item"><span class="pin-dot gpio"></span> GPIO</div>
                <div class="legend-item"><span class="pin-dot i2c"></span> I2C</div>
                <div class="legend-item"><span class="pin-dot spi"></span> SPI</div>
                <div class="legend-item"><span class="pin-dot uart"></span> UART</div>
                <div class="legend-item"><span class="pin-dot used"></span> Foglalt</div>
            </div>
        </div>
    `;
}

// Get pin CSS class
function getPinClass(pin, usedPins) {
    const used = usedPins.find(p => p.pin === pin || p.pin === `GPIO${pin}`);
    if (used) {
        return `pin-used ${used.type}`;
    }
    return 'pin-unused';
}

// Get pin title (tooltip)
function getPinTitle(pin, usedPins) {
    const used = usedPins.find(p => p.pin === pin || p.pin === `GPIO${pin}`);
    if (used) {
        return `${used.component} - ${used.function}`;
    }
    return `GPIO ${pin}`;
}

// Get pin label
function getPinLabel(pin, pinout) {
    const specialPins = {
        0: 'BOOT',
        1: 'TX0',
        3: 'RX0',
        16: 'RX2',
        17: 'TX2',
        21: 'SDA',
        22: 'SCL',
        25: 'DAC1',
        26: 'DAC2',
        34: 'IN34',
        35: 'IN35',
        36: 'VP',
        39: 'VN'
    };
    
    if (pinout && pinout.special) {
        for (const [name, num] of Object.entries(pinout.special)) {
            if (num === pin) return name;
        }
    }
    
    return specialPins[pin] || `GP${pin}`;
}

// Show pin details modal
function showPinDetails(pin, usedBy) {
    const modal = document.getElementById('pin-detail-modal');
    const content = document.getElementById('pin-detail-content');
    
    if (!modal || !content) return;
    
    let details = `<h4>GPIO ${pin}</h4>`;
    
    if (usedBy.length > 0) {
        details += '<div class="pin-usage-list">';
        usedBy.forEach(u => {
            details += `
                <div class="pin-usage-item">
                    <span class="material-icons">${u.type === 'i2c' ? 'cable' : u.type === 'spi' ? 'memory' : 'settings_input_component'}</span>
                    <div>
                        <strong>${u.component}</strong>
                        <small>${u.function}</small>
                    </div>
                </div>
            `;
        });
        details += '</div>';
    } else {
        details += '<p class="pin-unused-text">Ez a pin nincs használatban</p>';
    }
    
    content.innerHTML = details;
    modal.classList.add('active');
}

// Show full pin diagram in modal
function showFullPinDiagram() {
    const modal = document.getElementById('full-pin-diagram-modal');
    if (modal) {
        modal.classList.add('active');
        // Render larger diagram
    }
}

// Insert template into editor
function insertTemplate(templateYAML) {
    if (!editor) return;
    
    const position = editor.getPosition();
    editor.executeEdits('', [{
        range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
        text: '\n' + templateYAML
    }]);
    
    editor.focus();
}

// Validate YAML content
function validateYAML(yamlContent) {
    const errors = [];
    const warnings = [];
    
    if (!yamlContent || yamlContent.trim() === '') {
        errors.push({ line: 1, message: 'YAML content is empty', severity: 'error' });
        return { valid: false, errors, warnings };
    }
    
    // Check for required top-level keys
    const requiredKeys = ['esphome'];
    requiredKeys.forEach(function(key) {
        if (!yamlContent.includes(key + ':')) {
            errors.push({ line: 1, message: 'Missing required key: ' + key, severity: 'error' });
        }
    });
    
    // Check for common ESPHome patterns
    const commonPatterns = [
        { pattern: /platform:\s*\w+/g, message: 'Platform specified correctly' },
        { pattern: /pin:\s*(GPIO)?\d+/g, message: 'Pin specified' },
        { pattern: /name:\s*["']?\w+["']?/g, message: 'Name specified' }
    ];
    
    // Check for YAML syntax errors (basic)
    const lines = yamlContent.split('\n');
    let currentIndent = 0;
    let prevIndent = 0;
    
    lines.forEach(function(line, index) {
        const lineNum = index + 1;
        const trimmedLine = line.trim();
        
        // Skip empty lines and comments
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
            return;
        }
        
        // Check indentation
        const indent = line.search(/\S/);
        if (indent % 2 !== 0) {
            errors.push({ line: lineNum, message: 'Invalid indentation (must be multiple of 2 spaces)', severity: 'error' });
        }
        
        // Check for unquoted strings with special characters
        if (trimmedLine.includes(':') && !trimmedLine.startsWith('-')) {
            const colonIndex = trimmedLine.indexOf(':');
            const value = trimmedLine.substring(colonIndex + 1).trim();
            if (value && !value.startsWith('"') && !value.startsWith("'") && !value.startsWith('[') && !value.startsWith('{') && !value.startsWith('!') && !value.match(/^\d/) && !value.match(/^(true|false|yes|no|on|off)$/)) {
                if (value.includes(':') || value.includes('#') || value.includes('{') || value.includes('}')) {
                    warnings.push({ line: lineNum, message: 'Value may need quotes: ' + value.substring(0, 20), severity: 'warning' });
                }
            }
        }
    });
    
    return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
}

// Validate and show errors panel
function validateAndShowErrors() {
    const yamlContent = window.monacoEditor ? window.monacoEditor.getValue() : document.getElementById('yaml-content').value;
    const result = validateYAML(yamlContent);
    
    // Update errors panel
    const errorsPanel = document.getElementById('yaml-errors-panel');
    if (errorsPanel) {
        if (result.errors.length === 0 && result.warnings.length === 0) {
            errorsPanel.innerHTML = '<div class="yaml-valid"><span class="material-icons">check_circle</span> YAML is valid</div>';
            errorsPanel.className = 'yaml-errors-panel valid';
        } else {
            let html = '';
            result.errors.forEach(function(err) {
                html += '<div class="yaml-error"><span class="material-icons">error</span> Line ' + err.line + ': ' + err.message + '</div>';
            });
            result.warnings.forEach(function(warn) {
                html += '<div class="yaml-warning"><span class="material-icons">warning</span> Line ' + warn.line + ': ' + warn.message + '</div>';
            });
            errorsPanel.innerHTML = html;
            errorsPanel.className = 'yaml-errors-panel invalid';
        }
    }
    
    return result;
}

// Get editor content
function getEditorContent() {
    if (window.monacoEditor) {
        return window.monacoEditor.getValue();
    }
    const textarea = document.getElementById('yaml-content');
    return textarea ? textarea.value : '';
}

// Set editor content
function setEditorContent(content) {
    if (window.monacoEditor) {
        window.monacoEditor.setValue(content);
    } else {
        const textarea = document.getElementById('yaml-content');
        if (textarea) textarea.value = content;
    }
}

// Export functions
window.initMonacoEditor = initMonacoEditor;
window.insertTemplate = insertTemplate;
window.getEditorContent = getEditorContent;
window.setEditorContent = setEditorContent;
window.validateYAML = validateYAML;
window.validateAndShowErrors = validateAndShowErrors;
window.showPinDetails = showPinDetails;
window.showFullPinDiagram = showFullPinDiagram;