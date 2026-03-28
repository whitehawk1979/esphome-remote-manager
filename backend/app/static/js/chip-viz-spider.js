// Spider-style chip visualization - Enhanced with logical connections

/**
 * XSS protection - escape HTML special characters
 * @param {*} text - Input text to escape
 * @returns {string} - Escaped safe text
 */
function escapeHtml(text) {
    if (typeof text !== 'string') return text;
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function renderSpiderVisualization(deviceName, platform, board, yamlContent) {
    // XSS: Escape user inputs
    deviceName = escapeHtml(deviceName);
    platform = escapeHtml(platform);
    board = escapeHtml(board);
    
    var boardPins = BOARD_PINS[board] || BOARD_PINS['ESP32'] || BOARD_PINS['esp32dev'];
    var usedPins = parsePinsFromYaml(yamlContent || '');
    var peripherals = parsePeripheralsFromYaml(yamlContent || '');
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
    
    // Build peripheral lookup with full info
    var peripheralLookup = {};
    var peripheralPinMap = {};
    if (peripherals && Array.isArray(peripherals)) {
        peripherals.forEach(function(p) {
            if (p.pins && Array.isArray(p.pins)) {
                p.pins.forEach(function(pin) {
                    var pinNum = parseInt((pin.pin || '').toString().replace('GPIO', ''));
                    if (!isNaN(pinNum)) {
                        if (!peripheralLookup[pinNum]) {
                            peripheralLookup[pinNum] = { name: p.name, type: p.type, icon: p.icon || 'memory', pins: p.pins };
                        }
                        if (!peripheralPinMap[pinNum]) peripheralPinMap[pinNum] = [];
                        peripheralPinMap[pinNum].push({ name: p.name, type: p.type, icon: p.icon || 'memory', pinName: pin.name });
                    }
                });
            }
        });
    }
    
    // Group peripherals by side based on first pin
    var leftPinsList = boardPins && boardPins.leftPins ? boardPins.leftPins : [];
    var rightPinsList = boardPins && boardPins.rightPins ? boardPins.rightPins : [];
    var leftPeripherals = [];
    var rightPeripherals = [];
    var assignedPeripherals = new Set();
    
    if (peripherals && Array.isArray(peripherals)) {
        peripherals.forEach(function(p) {
            if (p.pins && p.pins.length > 0 && !assignedPeripherals.has(p.name)) {
                // Find all pins for this peripheral
                var allPins = p.pins.map(function(pin) {
                    return parseInt((pin.pin || '').toString().replace('GPIO', ''));
                }).filter(function(n) { return !isNaN(n); });
                
                // Determine side based on pin distribution
                var leftCount = allPins.filter(function(n) { return leftPinsList.includes(n); }).length;
                var rightCount = allPins.filter(function(n) { return rightPinsList.includes(n); }).length;
                
                // Add pin list to peripheral
                p.allPins = allPins;
                
                if (leftCount >= rightCount) {
                    leftPeripherals.push(p);
                } else {
                    rightPeripherals.push(p);
                }
                assignedPeripherals.add(p.name);
            }
        });
    }
    
    // Get board-specific labels
    var pinLabels = boardPins.pinLabels || {};
    var usbPosition = boardPins.usbPosition || 'top-left';
    var layout = boardPins.layout || 'spider'; // 'spider' or 'rectangle'
    
    var container = document.createElement('div');
    container.className = 'spider-viz-container';
    container.id = 'spider-viz-' + Date.now();
    
    // Check if rectangle layout (4-sided board)
    if (layout === 'rectangle' || boardPins.topPins || boardPins.bottomPins) {
        return renderRectangleVisualization(deviceName, platform, board, yamlContent, boardPins, usedPins, peripherals, stats, pinConnections, peripheralLookup, peripheralPinMap);
    }
    
    // Spider layout (2-sided board) - original code
    var leftSorted = (boardPins.leftPins || []).slice().sort(function(a, b) { return a - b; });
    var rightSorted = (boardPins.rightPins || []).slice().sort(function(a, b) { return b - a; });
    
    // Build comprehensive HTML
    container.innerHTML = '<style>' +
        '.spider-chip { background: linear-gradient(135deg, var(--bg-secondary, #1a1a2e) 0%, var(--bg, #16213e) 100%); border: 2px solid var(--border, #333); border-radius: 16px; padding: 24px; position: relative; }' +
        '.spider-header { text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--border, #333); }' +
        '.spider-header h3 { margin: 0; color: var(--text-primary, #fff); font-size: 20px; display: flex; align-items: center; justify-content: center; gap: 12px; }' +
        '.chip-badge { background: linear-gradient(135deg, var(--primary, #4a90d9), #6b46c1); color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 500; }' +
        '.board-notes { font-size: 12px; color: var(--text-secondary, #888); margin-top: 8px; }' +
        '.variant-selector { margin-top: 12px; display: flex; align-items: center; gap: 12px; justify-content: center; }' +
        '.variant-selector label { font-size: 12px; color: var(--text-secondary, #888); }' +
        '.variant-dropdown { background: var(--bg-secondary, #1a1a2e); border: 1px solid var(--border, #333); color: var(--text-primary, #fff); padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; outline: none; }' +
        '.variant-dropdown:hover { border-color: var(--primary, #4a90d9); }' +
        '.variant-dropdown:focus { border-color: var(--primary, #4a90d9); box-shadow: 0 0 0 2px rgba(74, 144, 217, 0.2); }' +
        '.spider-layout { display: grid; grid-template-columns: 200px 140px 200px 140px 200px; gap: 16px; align-items: start; margin-top: 20px; }' +
        '.peripherals-panel { display: flex; flex-direction: column; gap: 12px; max-height: 600px; overflow-y: auto; padding: 16px; background: rgba(0, 0, 0, 0.3); border-radius: 12px; }' +
        '.peripherals-panel::-webkit-scrollbar { width: 4px; }' +
        '.peripherals-panel::-webkit-scrollbar-thumb { background: var(--border, #333); border-radius: 2px; }' +
        '.peripherals-panel.left { grid-column: 1; text-align: right; }' +
        '.peripherals-panel.right { grid-column: 5; text-align: left; }' +
        '.pins-column { display: flex; flex-direction: column; gap: 2px; min-width: 100px; max-width: 140px; padding: 12px; background: linear-gradient(180deg, var(--bg-secondary, #1a1a2e) 0%, var(--bg, #16213e) 100%); border-radius: 12px; }' +
        '.pins-header { font-size: 11px; color: var(--text-secondary, #888); text-align: center; margin-bottom: 8px; padding-bottom: 4px; border-bottom: 1px solid var(--border, #333); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }' +
        '.pins-column.left { grid-column: 2; text-align: right; border-right: 3px solid var(--primary, #4a90d9); }' +
        '.pins-column.right { grid-column: 4; text-align: left; border-left: 3px solid var(--primary, #4a90d9); }' +
        '.chip-box { grid-column: 3; background: linear-gradient(135deg, #2a2a4e 0%, #1a1a2e 100%); border: 3px solid var(--primary, #4a90d9); border-radius: 16px; padding: 20px 16px; text-align: center; box-shadow: 0 0 30px rgba(74, 144, 217, 0.2); display: flex; flex-direction: column; align-items: center; justify-content: center; }' +
        '.chip-icon { font-size: 56px; color: var(--primary, #4a90d9); margin-bottom: 12px; }' +
        '.chip-name { font-size: 18px; font-weight: 700; color: var(--text-primary, #fff); margin-bottom: 6px; }' +
        '.chip-platform { font-size: 14px; color: var(--text-secondary, #888); }' +
        '.chip-board { font-size: 13px; color: var(--primary, #4a90d9); margin-top: 6px; }' +
        '.pin-row { display: flex; align-items: center; padding: 4px 8px; font-size: 12px; border-radius: 4px; transition: all 0.15s; cursor: pointer; }' +
        '.pin-row:hover { background: rgba(74, 144, 217, 0.15); }' +
        '.pin-row.drag-over { background: rgba(76, 175, 80, 0.3); border: 2px dashed var(--success); }' +
        '.pin-row.right { flex-direction: row-reverse; }' +
        '.pin-num { min-width: 24px; font-weight: 700; color: var(--text-secondary, #888); text-align: center; font-family: monospace; }' +
        '.pin-num.used { color: var(--primary, #4a90d9); }' +
        '.pin-num.warn { color: #ff9800; text-decoration: underline; }' +
        '.pin-label { min-width: 50px; color: var(--text-secondary, #888); font-size: 11px; }' +
        '.pin-label.used { color: var(--text-primary, #fff); }' +
        '.pin-dot { width: 10px; height: 10px; border-radius: 50%; margin: 0 6px; transition: all 0.15s; box-shadow: 0 0 6px currentColor; }' +
        '.pin-dot.gpio { background: var(--primary, #4a90d9); }' +
        '.pin-dot.i2c { background: #4caf50; }' +
        '.pin-dot.spi { background: #9c27b0; }' +
        '.pin-dot.uart { background: #2196f3; }' +
        '.pin-dot.onewire { background: #00bcd4; }' +
        '.pin-dot.adc { background: #ff9800; }' +
        '.pin-func { font-size: 11px; color: var(--primary, #4a90d9); min-width: 35px; font-weight: 500; }' +
        '.stats-row { display: flex; justify-content: center; gap: 40px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border, #333); }' +
        '.stat-item { text-align: center; }' +
        '.stat-value { font-size: 28px; font-weight: 700; }' +
        '.stat-value.used { color: var(--primary, #4a90d9); }' +
        '.stat-value.free { color: var(--text-secondary, #888); }' +
        '.stat-value.periph { color: #4caf50; }' +
        '.stat-label { font-size: 11px; color: var(--text-secondary, #888); text-transform: uppercase; margin-top: 4px; }' +
        '.section-title { font-size: 14px; color: var(--text-secondary, #888); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid var(--border, #333); }' +
        '.section-title.left { text-align: right; }' +
        '.empty-state { color: var(--text-secondary, #888); font-size: 13px; padding: 20px; text-align: center; font-style: italic; }' +
        '.power-warning { display: flex; align-items: center; gap: 6px; background: rgba(255, 152, 0, 0.1); border: 1px solid rgba(255, 152, 0, 0.3); border-radius: 6px; padding: 8px 12px; margin-top: 10px; font-size: 11px; color: #ff9800; }' +
        '.peripheral-card.left .power-warning { flex-direction: row-reverse; }' +
        '@media (max-width: 1400px) { .spider-layout { grid-template-columns: 180px 120px 180px 120px 180px; gap: 12px; } .pins-column { max-width: 120px; } .peripherals-panel { max-height: 500px; } }' +
        '@media (max-width: 1200px) { .spider-layout { grid-template-columns: 160px 110px 160px 110px 160px; gap: 10px; } .pins-column { max-width: 110px; padding: 8px; } .peripherals-panel { max-height: 400px; padding: 12px; } }' +
        '@media (max-width: 900px) { .spider-layout { grid-template-columns: 1fr 1fr; grid-template-rows: auto auto; gap: 16px; } .peripherals-panel.left { grid-column: 1; grid-row: 2; } .pins-column.left { grid-column: 1; grid-row: 1; } .chip-box { grid-column: 1 / -1; grid-row: 1; } .pins-column.right { grid-column: 2; grid-row: 1; } .peripherals-panel.right { grid-column: 2; grid-row: 2; } }' +
        '@media (max-width: 600px) { .spider-layout { display: flex; flex-direction: column; gap: 16px; } .peripherals-panel.left, .peripherals-panel.right, .pins-column.left, .pins-column.right, .chip-box { grid-column: auto; width: 100%; max-width: 100%; } .pins-column { min-width: 80px; max-width: 100%; padding: 8px; } .peripherals-panel { padding: 12px; max-height: 300px; } }' +
        '.peripheral-card { background: var(--bg-secondary, #1a1a2e); border: 1px solid var(--border, #333); border-radius: 12px; padding: 14px; position: relative; transition: all 0.25s; }' +
        '.peripheral-card:hover { border-color: var(--primary, #4a90d9); transform: scale(1.02); box-shadow: 0 8px 24px rgba(0,0,0,0.4); z-index: 10; }' +
        '.peripheral-card.i2c { border-left: 4px solid #4caf50; }' +
        '.peripheral-card.spi { border-left: 4px solid #9c27b0; }' +
        '.peripheral-card.uart { border-left: 4px solid #2196f3; }' +
        '.peripheral-card.onewire { border-left: 4px solid #00bcd4; }' +
        '.peripheral-card.adc { border-left: 4px solid #ff9800; }' +
        '.peripheral-card.display { border-left: 4px solid #e91e63; }' +
        '.peripheral-card.actuator { border-left: 4px solid #ff5722; }' +
        '.peripheral-card.input { border-left: 4px solid #607d8b; }' +
        '.peripheral-card.communication { border-left: 4px solid #795548; }' +
        '.peripheral-card.sensor { border-left: 4px solid #8bc34a; }' +
        '.peripheral-card.left.i2c { border-left: 1px solid var(--border); border-right: 4px solid #4caf50; }' +
        '.peripheral-card.left.spi { border-left: 1px solid var(--border); border-right: 4px solid #9c27b0; }' +
        '.peripheral-card.left.uart { border-left: 1px solid var(--border); border-right: 4px solid #2196f3; }' +
        '.peripheral-card.left.onewire { border-left: 1px solid var(--border); border-right: 4px solid #00bcd4; }' +
        '.peripheral-card.left.adc { border-left: 1px solid var(--border); border-right: 4px solid #ff9800; }' +
        '.peripheral-header { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }' +
        '.peripheral-card.left .peripheral-header { flex-direction: row-reverse; }' +
        '.peripheral-icon { font-size: 24px; color: var(--primary, #4a90d9); }' +
        '.peripheral-info { flex: 1; }' +
        '.peripheral-name { font-weight: 600; color: var(--text-primary, #fff); font-size: 15px; }' +
        '.peripheral-card.left .peripheral-info { text-align: right; }' +
        '.peripheral-type { font-size: 11px; color: var(--text-secondary, #888); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }' +
        '.peripheral-pins-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }' +
        '.peripheral-card.left .peripheral-pins-list { justify-content: flex-end; }' +
        '.pin-badge { font-size: 11px; padding: 3px 8px; border-radius: 6px; background: var(--bg, #16213e); color: var(--text-primary, #fff); border: 1px solid var(--border, #333); font-family: monospace; }' +
        '.pin-badge.i2c { background: #2e7d32; border-color: #4caf50; }' +
        '.pin-badge.spi { background: #6a1b9a; border-color: #9c27b0; }' +
        '.pin-badge.uart { background: #1565c0; border-color: #2196f3; }' +
        '.pin-badge.onewire { background: #00838f; border-color: #00bcd4; }' +
        '.pin-badge.adc { background: #e65100; border-color: #ff9800; }' +
        '.pin-badge:hover { transform: scale(1.1); }' +
        '.peripheral-requirements { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border, #333); }' +
        '.req-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px; }' +
        '.peripheral-card.left .req-row { flex-direction: row-reverse; }' +
        '.req-icon { font-size: 14px; }' +
        '.req-power { color: #4caf50; font-weight: 500; }' +
        '.req-power.v5 { color: #ff9800; }' +
        '.req-current { color: var(--text-secondary, #888); }' +
        '.req-notes { color: var(--text-secondary, #888); font-style: italic; }' +
        // Pinout Reference Styles
        '.pinout-reference { margin-top: 20px; padding: 16px; background: rgba(0, 0, 0, 0.2); border-radius: 12px; border: 1px solid var(--border, #333); }' +
        '.pinout-title { font-size: 14px; font-weight: 600; color: var(--text-primary, #fff); margin-bottom: 12px; display: flex; align-items: center; gap: 8px; }' +
        '.pinout-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }' +
        '.pinout-col { display: flex; flex-direction: column; gap: 4px; }' +
        '.pinout-item { display: flex; align-items: center; gap: 6px; padding: 4px 8px; background: rgba(255, 255, 255, 0.03); border-radius: 4px; font-size: 11px; }' +
        '.pinout-item.warn { background: rgba(255, 152, 0, 0.1); border: 1px solid rgba(255, 152, 0, 0.3); }' +
        '.pinout-num { font-weight: 600; color: var(--primary, #4a90d9); min-width: 24px; }' +
        '.pinout-label { color: var(--text-primary, #fff); min-width: 60px; }' +
        '.pinout-type { font-size: 9px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; font-weight: 500; }' +
        '.pinout-type.gpio { background: var(--primary, #4a90d9); color: white; }' +
        '.pinout-type.i2c { background: #4caf50; color: white; }' +
        '.pinout-type.uart { background: #2196f3; color: white; }' +
        '.pinout-type.input { background: #ff9800; color: white; }' +
        '.pinout-type.usb { background: #9c27b0; color: white; }' +
        '.pinout-note { color: var(--text-secondary, #888); font-size: 10px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }' +
        '.pinout-legend { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; }' +
        '.legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-secondary, #888); }' +
        '.legend-dot { width: 12px; height: 12px; border-radius: 3px; }' +
        '.legend-dot.gpio { background: var(--primary, #4a90d9); }' +
        '.legend-dot.i2c { background: #4caf50; }' +
        '.legend-dot.uart { background: #2196f3; }' +
        '.legend-dot.input { background: #ff9800; }' +
        '.legend-dot.warn { background: transparent; }' +
        '@media (max-width: 1400px) { .pins-container { gap: 12px; } .pins-column { max-width: 180px; } .peripherals-panel { max-height: 350px; } }' +
        '@media (max-width: 1200px) { .pins-container { grid-template-columns: 1fr 1fr; gap: 12px; } .pins-column { max-width: 160px; } .peripherals-container { grid-template-columns: 1fr; gap: 12px; } .peripherals-panel { max-height: 300px; } }' +
        '@media (max-width: 768px) { .spider-layout { gap: 16px; } .pins-container { grid-template-columns: 1fr; gap: 8px; } .pins-column { min-width: 80px; max-width: 100%; padding: 8px; } .pins-column.left, .pins-column.right { margin-left: auto; margin-right: auto; max-width: 140px; } .peripherals-container { grid-template-columns: 1fr; } .peripherals-panel { padding: 12px; max-height: 250px; } .chip-box { padding: 16px 12px; min-width: 150px; } }' +
    '</style>';
    
    // Render peripheral library panel
    var peripheralLibraryHtml = renderPeripheralLibrary();
    
    container.innerHTML = peripheralLibraryHtml + '<div class="spider-chip">' +
        '<div class="spider-header">' +
            '<h3>' +
                '<span class="material-icons" style="font-size: 28px;">memory</span>' +
                deviceName +
                '<span class="chip-badge">' + platform + ' • ' + (boardPins.name || board) + '</span>' +
            '</h3>' +
            (boardPins.notes ? '<div class="board-notes"><span class="material-icons" style="font-size: 14px; vertical-align: middle;">info</span> ' + escapeHtml(boardPins.notes) + '</div>' : '') +
            // Board variant selector
            renderBoardVariantSelector(board) +
        '</div>' +
        
        '<div class="spider-layout">' +
            '<!-- 1. oszlop: Bal Perifériák -->' +
            '<div class="peripherals-panel left" id="left-peripherals">' +
                '<div class="section-title left">Left Side Peripherals (' + leftPeripherals.length + ')</div>' +
                renderPeripheralsDetailed(leftPeripherals, 'left', leftPinsList) +
            '</div>' +
            
            '<!-- 2. oszlop: Bal Pinek -->' +
            '<div class="pins-column left">' +
                '<div class="pins-header">Pins 1-' + leftSorted.length + '</div>' +
                renderPinsDetailed(leftSorted, pinConnections, peripheralLookup, pinLabels, 'left', boardPins.pinoutReference) +
            '</div>' +
            
            '<!-- 3. oszlop: Chip Box (KÖZÉPEN) -->' +
            '<div class="chip-box">' +
                '<div class="chip-icon"><span class="material-icons" style="font-size: 56px;">developer_board</span></div>' +
                '<div class="chip-name">' + deviceName + '</div>' +
                '<div class="chip-platform">' + platform + '</div>' +
                '<div class="chip-board">' + (boardPins.name || board) + '</div>' +
                '<div style="margin-top: 8px; font-size: 11px; color: var(--text-secondary);">' +
                    (boardPins.totalPins || 40) + ' pins' +
                '</div>' +
            '</div>' +
            
            '<!-- 4. oszlop: Jobb Pinek -->' +
            '<div class="pins-column right">' +
                '<div class="pins-header">Pins ' + (boardPins.totalPins - rightSorted.length + 1) + '-' + boardPins.totalPins + '</div>' +
                renderPinsDetailed(rightSorted, pinConnections, peripheralLookup, pinLabels, 'right', boardPins.pinoutReference) +
            '</div>' +
            
            '<!-- 5. oszlop: Jobb Perifériák -->' +
            '<div class="peripherals-panel right" id="right-peripherals">' +
                '<div class="section-title">Right Side Peripherals (' + rightPeripherals.length + ')</div>' +
                renderPeripheralsDetailed(rightPeripherals, 'right', rightPinsList) +
            '</div>' +
        '</div>' +
        
        '<div class="stats-row">' +
            '<div class="stat-item">' +
                '<div class="stat-value used">' + stats.usedPins + '</div>' +
                '<div class="stat-label">Used Pins</div>' +
            '</div>' +
            '<div class="stat-item">' +
                '<div class="stat-value free">' + stats.freePins + '</div>' +
                '<div class="stat-label">Free Pins</div>' +
            '</div>' +
            '<div class="stat-item">' +
                '<div class="stat-value periph">' + peripherals.length + '</div>' +
                '<div class="stat-label">Peripherals</div>' +
            '</div>' +
            '<div class="stat-item">' +
                '<div class="stat-value" style="color: #ff9800;">' + (boardPins.totalPins || 40) + '</div>' +
                '<div class="stat-label">Total Pins</div>' +
            '</div>' +
        '</div>' +
        
        // Pinout Reference Table
        (boardPins.pinoutReference ? renderPinoutReference(boardPins.pinoutReference) : '') +
    '</div>';
    
    return container;
}

function renderPeripheralsDetailed(peripherals, side, sidePins) {
    if (!peripherals || peripherals.length === 0) {
        return '<div class="empty-state">No peripherals on this side</div>';
    }
    
    return peripherals.map(function(p) {
        // XSS: Escape peripheral name
        var safeName = escapeHtml(p.name || pType.name);
        var pType = PERIPHERAL_TYPES && PERIPHERAL_TYPES[p.type] ? PERIPHERAL_TYPES[p.type] : { name: p.type, type: 'sensor', icon: 'memory' };
        var reqs = PERIPHERAL_REQUIREMENTS && PERIPHERAL_REQUIREMENTS[p.type] ? PERIPHERAL_REQUIREMENTS[p.type] : {};
        var typeClass = (pType.type || 'gpio').toLowerCase();
        var sideClass = side === 'left' ? 'left' : '';
        
        // Build pin badges with connection type
        var pinsHtml = (p.pins || []).map(function(pin) {
            var busClass = (pin.bus || 'gpio').toLowerCase();
            var pinNum = parseInt((pin.pin || '').toString().replace('GPIO', ''));
            var pinSide = sidePins.includes(pinNum) ? '' : ' style="opacity: 0.6;"';
            var safePinName = escapeHtml(pin.name);
            return '<span class="pin-badge ' + busClass + '"' + pinSide + ' title="' + safePinName + '">' + safePinName + ': ' + escapeHtml(pin.pin) + '</span>';
        }).join('');
        
        // Build requirements section
        var reqsHtml = '';
        if (reqs.power) {
            var powerClass = reqs.power.indexOf('5V') !== -1 ? ' v5' : '';
            reqsHtml += '<div class="req-row">' +
                '<span class="material-icons req-icon">power</span>' +
                '<span class="req-power' + powerClass + '">' + reqs.power + '</span>' +
                '<span class="req-current">• ' + reqs.current + '</span>' +
            '</div>';
        }
        if (reqs.notes) {
            reqsHtml += '<div class="req-row">' +
                '<span class="material-icons req-icon" style="color: var(--text-secondary);">info</span>' +
                '<span class="req-notes">' + reqs.notes + '</span>' +
            '</div>';
        }
        
        // Power warning for 5V devices on 3.3V boards
        var powerWarning = '';
        if (reqs.power && reqs.power.indexOf('5V') !== -1 && (pType.type === 'sensor' || pType.type === 'display')) {
            powerWarning = '<div class="power-warning">' +
                '<span class="material-icons" style="font-size: 14px;">warning</span>' +
                '<span>Requires 5V power</span>' +
            '</div>';
        }
        
        return '<div class="peripheral-card ' + typeClass + ' ' + sideClass + '">' +
            '<div class="peripheral-header">' +
                '<span class="material-icons peripheral-icon">' + (pType.icon || 'memory') + '</span>' +
                '<div class="peripheral-info">' +
                    '<div class="peripheral-name">' + safeName + '</div>' +
                    '<div class="peripheral-type">' + escapeHtml(pType.type) + ' • ' + escapeHtml(pType.name) + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="peripheral-pins-list">' + pinsHtml + '</div>' +
            (reqsHtml ? '<div class="peripheral-requirements">' + reqsHtml + '</div>' : '') +
            powerWarning +
        '</div>';
    }).join('');
}

function renderPinsDetailed(pins, pinConnections, peripheralLookup, pinLabels, side, pinoutReference) {
    var typeColors = {
        'i2c': '#4caf50', 'spi': '#9c27b0', 'uart': '#2196f3', 'adc': '#ff9800', 'onewire': '#00bcd4', 'display': '#e91e63', 'actuator': '#ff5722', 'input': '#607d8b', 'communication': '#795548', 'gpio': 'var(--primary)'
    };
    
    // Build pinout reference lookup
    var pinoutLookup = {};
    if (pinoutReference && Array.isArray(pinoutReference)) {
        pinoutReference.forEach(function(p) {
            pinoutLookup[p.pin] = p;
        });
    }
    
    return pins.map(function(pinNum) {
        var connections = pinConnections[pinNum] || [];
        var peripheral = peripheralLookup[pinNum];
        var isUsed = connections.length > 0 || peripheral;
        var label = pinLabels[pinNum] || ('GPIO' + pinNum);
        
        // Get pinout reference info
        var pinRef = pinoutLookup[pinNum] || {};
        
        var pinType = 'gpio';
        var functionText = '';
        var tooltipParts = ['GPIO' + pinNum];
        
        // Add label to tooltip
        if (label !== 'GPIO' + pinNum) {
            tooltipParts.push(label);
        }
        
        // Add pinout reference info
        if (pinRef.type) {
            tooltipParts.push('Type: ' + pinRef.type);
        }
        if (pinRef.note) {
            tooltipParts.push(pinRef.note);
        }
        
        if (connections.length > 0) {
            var conn = connections[0];
            pinType = (conn.component || 'gpio').toLowerCase();
            functionText = conn.function || '';
            tooltipParts.push('Used by: ' + (peripheral ? escapeHtml(peripheral.name) : functionText));
        }
        
        if (peripheral && connections.length === 0) {
            pinType = peripheral.type || 'gpio';
            tooltipParts.push('Used by: ' + escapeHtml(peripheral.name));
        }
        
        if (!isUsed) {
            tooltipParts.push('Free');
        }
        
        if (pinRef.warn) {
            tooltipParts.push('⚠️ Special pin');
        }
        
        var color = typeColors[pinType] || 'var(--primary)';
        // XSS: Escape tooltip content
        var tooltip = tooltipParts.map(function(t) { return escapeHtml(t); }).join(' | ');
        
        var dotHtml = isUsed ? '<div class="pin-dot ' + pinType + '" style="background: ' + color + ';"></div>' : '<div class="pin-dot" style="background: var(--border); opacity: 0.3;"></div>';
        
        // Add drop event handlers
        var dropAttrs = ' ondrop="handlePinDrop(event, ' + pinNum + ')" ondragover="event.preventDefault(); event.target.classList.add(\'drag-over\');" ondragleave="event.target.classList.remove(\'drag-over\');"';
        
        // XSS: Escape label for display
        var safeLabel = escapeHtml(label);
        var safeFunctionText = escapeHtml(functionText);
        
        if (side === 'left') {
            return '<div class="pin-row" title="' + tooltip + '"' + dropAttrs + '>' +
                '<span class="pin-func">' + safeFunctionText + '</span>' +
                dotHtml +
                '<span class="pin-label ' + (isUsed ? 'used' : '') + '">' + safeLabel + '</span>' +
                '<span class="pin-num ' + (isUsed ? 'used' : '') + (pinRef.warn ? ' warn' : '') + '">' + pinNum + '</span>' +
            '</div>';
        } else {
        return '<div class="pin-row right" title="' + tooltip + '"' + dropAttrs + '>' +
                '<span class="pin-num ' + (isUsed ? 'used' : '') + (pinRef.warn ? ' warn' : '') + '">' + pinNum + '</span>' +
                '<span class="pin-label ' + (isUsed ? 'used' : '') + '">' + safeLabel + '</span>' +
                dotHtml +
                '<span class="pin-func">' + safeFunctionText + '</span>' +
            '</div>';
        }
    }).join('');
}

// Rectangle-style visualization for 4-sided boards (ESP32-S3-Box, etc.)
function renderRectangleVisualization(deviceName, platform, board, yamlContent, boardPins, usedPins, peripherals, stats, pinConnections, peripheralLookup, peripheralPinMap) {
    var pinLabels = boardPins.pinLabels || {};
    var usbPosition = boardPins.usbPosition || 'top-center';
    
    var container = document.createElement('div');
    container.className = 'rectangle-viz-container';
    
    // Build HTML for rectangle layout with pins around the board
    container.innerHTML = '<style>' +
        '.rectangle-viz-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; max-width: 1400px; margin: 0 auto; background: var(--bg, #1a1a2e); border-radius: 12px; }' +
        '.board-wrapper { display: flex; flex-direction: column; align-items: center; gap: 4px; }' +
        '.board-top, .board-bottom { display: flex; justify-content: center; align-items: center; gap: 2px; padding: 4px 16px; }' +
        '.board-middle { display: flex; align-items: stretch; gap: 0; }' +
        '.board-left, .board-right { display: flex; flex-direction: column; gap: 1px; padding: 4px 8px; }' +
        '.board-center { background: linear-gradient(135deg, #2a2a4e 0%, #1a1a2e 100%); border: 3px solid var(--primary, #4a90d9); border-radius: 12px; padding: 40px 60px; min-width: 200px; min-height: 300px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }' +
        '.board-chip-name { font-size: 18px; font-weight: 600; color: var(--text-primary, #fff); text-align: center; margin-bottom: 8px; }' +
        '.board-chip-badge { background: linear-gradient(135deg, var(--primary, #4a90d9), #6b46c1); color: white; padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 500; margin-bottom: 12px; }' +
        '.board-stats { display: flex; gap: 16px; margin-top: 12px; }' +
        '.stat-item { text-align: center; }' +
        '.stat-value { font-size: 20px; font-weight: 600; color: var(--primary, #4a90d9); }' +
        '.stat-label { font-size: 11px; color: var(--text-secondary, #888); }' +
        '.usb-connector { position: absolute; background: #333; border: 2px solid #555; border-radius: 4px; padding: 6px 12px; font-size: 11px; color: #888; display: flex; align-items: center; gap: 6px; }' +
        '.usb-connector.top-left { top: -20px; left: 10px; }' +
        '.usb-connector.top-center { top: -20px; left: 50%; transform: translateX(-50%); }' +
        '.usb-connector.bottom-center { bottom: -20px; left: 50%; transform: translateX(-50%); }' +
        '.usb-connector.left { left: -80px; top: 50%; transform: translateY(-50%); }' +
        '.usb-connector.right { right: -80px; top: 50%; transform: translateY(-50%); }' +
        '.usb-icon { font-size: 14px; }' +
        '.pin-wrapper { display: flex; align-items: center; justify-content: center; }' +
        '.pin-wrapper.horizontal { flex-direction: column; padding: 2px 6px; }' +
        '.pin-wrapper.left { flex-direction: row; justify-content: flex-end; }' +
        '.pin-wrapper.right { flex-direction: row; justify-content: flex-start; }' +
        '.pin-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--border, #333); margin: 2px; cursor: pointer; transition: all 0.2s; }' +
        '.pin-dot.used { background: var(--primary, #4a90d9); box-shadow: 0 0 6px rgba(74, 144, 217, 0.5); }' +
        '.pin-dot.i2c { background: #4caf50; box-shadow: 0 0 6px rgba(76, 175, 80, 0.5); }' +
        '.pin-dot.spi { background: #9c27b0; box-shadow: 0 0 6px rgba(156, 39, 176, 0.5); }' +
        '.pin-dot.uart { background: #2196f3; box-shadow: 0 0 6px rgba(33, 150, 243, 0.5); }' +
        '.pin-dot.adc { background: #ff9800; box-shadow: 0 0 6px rgba(255, 152, 0, 0.5); }' +
        '.pin-dot.onewire { background: #00bcd4; box-shadow: 0 0 6px rgba(0, 188, 212, 0.5); }' +
        '.pin-label { font-size: 9px; color: var(--text-secondary, #888); white-space: nowrap; }' +
        '.pin-num { font-size: 10px; font-weight: 600; color: var(--text-primary, #ccc); }' +
        '.pin-wrapper:hover .pin-dot { transform: scale(1.3); }' +
        '.pin-wrapper:hover .pin-label { color: var(--text-primary, #fff); }' +
        '.pin-wrapper:hover .pin-num { color: var(--primary, #4a90d9); }' +
        '.pin-tooltip { position: absolute; background: rgba(0,0,0,0.9); color: #fff; padding: 4px 8px; border-radius: 4px; font-size: 10px; pointer-events: none; z-index: 100; white-space: nowrap; }' +
        '.board-notes { text-align: center; font-size: 12px; color: var(--text-secondary, #888); margin-top: 16px; padding: 8px; background: rgba(74, 144, 217, 0.1); border-radius: 8px; }' +
        // Peripheral library panel
        '.peripheral-library { position: absolute; left: 0; top: 0; width: 280px; height: 100%; background: var(--bg, #1a1a2e); border-right: 1px solid var(--border, #333); overflow-y: auto; padding: 16px; z-index: 10; }' +
        '.peripheral-library.collapsed { width: 40px; padding: 8px; }' +
        '.peripheral-library.collapsed .peripheral-list { display: none; }' +
        '.peripheral-library.collapsed .peripheral-search { display: none; }' +
        '.peripheral-library.collapsed .collapse-btn { transform: rotate(180deg); }' +
        '.library-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }' +
        '.library-header h4 { margin: 0; font-size: 14px; color: var(--text-primary, #fff); }' +
        '.collapse-btn { background: transparent; border: none; color: var(--text-secondary, #888); cursor: pointer; padding: 4px; border-radius: 4px; }' +
        '.collapse-btn:hover { background: var(--border, #333); }' +
        '.peripheral-search { width: 100%; padding: 8px 12px; border: 1px solid var(--border, #333); border-radius: 6px; background: var(--bg, #16213e); color: var(--text-primary, #fff); font-size: 12px; margin-bottom: 12px; }' +
        '.peripheral-search:focus { outline: none; border-color: var(--primary, #4a90d9); }' +
        '.peripheral-categories { display: flex; flex-direction: column; gap: 8px; }' +
        '.peripheral-category { }' +
        '.category-header { display: flex; align-items: center; gap: 6px; padding: 6px 8px; background: var(--card-bg, #16213e); border-radius: 6px; cursor: pointer; font-size: 12px; color: var(--text-secondary, #888); font-weight: 500; }' +
        '.category-header:hover { background: var(--border, #333); }' +
        '.category-header .material-icons { font-size: 16px; }' +
        '.category-items { display: none; flex-direction: column; gap: 4px; padding-left: 8px; margin-top: 4px; }' +
        '.category-items.expanded { display: flex; }' +
        '.peripheral-item { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: var(--bg, #1a1a2e); border: 1px solid var(--border, #333); border-radius: 6px; cursor: grab; font-size: 12px; color: var(--text-primary, #fff); transition: all 0.2s; }' +
        '.peripheral-item:hover { background: var(--card-bg, #16213e); border-color: var(--primary, #4a90d9); transform: translateX(4px); }' +
        '.peripheral-item.dragging { opacity: 0.5; cursor: grabbing; }' +
        '.peripheral-item .material-icons { font-size: 18px; color: var(--primary, #4a90d9); }' +
        '.peripheral-item .pin-count { font-size: 10px; color: var(--text-secondary, #888); background: var(--border, #333); padding: 2px 6px; border-radius: 10px; }' +
        '.peripheral-item .bus-type { font-size: 10px; color: var(--success, #4caf50); }' +
        '.drop-zone { position: relative; }' +
        '.drop-zone.drag-over { background: rgba(74, 144, 217, 0.1); border: 2px dashed var(--primary, #4a90d9); border-radius: 8px; }' +
        '.pin-drop-target { position: relative; }' +
        '.pin-drop-target.drag-over { animation: pulse 0.5s infinite; }' +
        '@keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.2); } 100% { transform: scale(1); } }' +
    '</style>';
    
    // Build USB connector HTML
    var usbHtml = '<div class="usb-connector ' + usbPosition + '">' +
        '<span class="usb-icon">🔌</span>' +
        '<span>USB-C</span>' +
    '</div>';
    
    // Get pins for each side
    var topPins = boardPins.topPins || [];
    var leftPins = boardPins.leftPins || [];
    var rightPins = boardPins.rightPins || [];
    var bottomPins = boardPins.bottomPins || [];
    
    // Sort pins correctly for each side
    var topSorted = topPins.slice().sort(function(a, b) { return a - b; });
    var leftSorted = leftPins.slice().sort(function(a, b) { return a - b; }); // top to bottom
    var rightSorted = rightPins.slice().sort(function(a, b) { return a - b; }); // top to bottom
    var bottomSorted = bottomPins.slice().sort(function(a, b) { return a - b; });
    
    // Build pin HTML for each side
    var topPinsHtml = renderPinsAround(topSorted, pinLabels, pinConnections, peripheralLookup, 'horizontal');
    var leftPinsHtml = renderPinsAround(leftSorted, pinLabels, pinConnections, peripheralLookup, 'left');
    var rightPinsHtml = renderPinsAround(rightSorted, pinLabels, pinConnections, peripheralLookup, 'right');
    var bottomPinsHtml = renderPinsAround(bottomSorted, pinLabels, pinConnections, peripheralLookup, 'horizontal');
    
    // Build the complete board layout
    container.innerHTML += '<div class="board-wrapper">' +
        // Top pins
        '<div class="board-top">' + topPinsHtml + '</div>' +
        // Middle section: left pins, board center, right pins
        '<div class="board-middle">' +
            '<div class="board-left">' + leftPinsHtml + '</div>' +
            '<div class="board-center">' +
                usbHtml +
                '<div class="board-chip-name">' + deviceName + '</div>' +
                '<div class="board-chip-badge">' + boardPins.name + '</div>' +
                '<div class="board-stats">' +
                    '<div class="stat-item"><div class="stat-value">' + boardPins.totalPins + '</div><div class="stat-label">GPIO</div></div>' +
                    '<div class="stat-item"><div class="stat-value" style="color: #4caf50;">' + stats.usedPins + '</div><div class="stat-label">Used</div></div>' +
                    '<div class="stat-item"><div class="stat-value" style="color: #ff9800;">' + stats.freePins + '</div><div class="stat-label">Free</div></div>' +
                '</div>' +
            '</div>' +
            '<div class="board-right">' + rightPinsHtml + '</div>' +
        '</div>' +
        // Bottom pins
        '<div class="board-bottom">' + bottomPinsHtml + '</div>' +
    '</div>';
    
    // Add board notes
    if (boardPins.notes) {
        container.innerHTML += '<div class="board-notes"><span style="margin-right: 4px;">ℹ️</span> ' + boardPins.notes + '</div>';
    }
    
    return container;
}

function renderPinsAround(pins, pinLabels, pinConnections, peripheralLookup, side) {
    var typeColors = {
        'i2c': '#4caf50', 'spi': '#9c27b0', 'uart': '#2196f3', 'adc': '#ff9800', 'onewire': '#00bcd4', 'display': '#e91e63', 'actuator': '#ff5722', 'input': '#607d8b', 'communication': '#795548', 'gpio': 'var(--primary)'
    };
    
    return pins.map(function(pinNum) {
        var connections = pinConnections[pinNum] || [];
        var peripheral = peripheralLookup[pinNum];
        var isUsed = connections.length > 0 || peripheral;
        var label = pinLabels[pinNum] || ('D' + pinNum);
        
        var pinType = 'gpio';
        if (connections.length > 0) {
            pinType = (connections[0].component || 'gpio').toLowerCase();
        } else if (peripheral) {
            pinType = peripheral.type || 'gpio';
        }
        
        var dotClass = isUsed ? 'used ' + pinType : '';
        // XSS: Escape label and title
        var safeLabel = escapeHtml(label);
        var title = 'GPIO' + pinNum + (label !== 'D' + pinNum ? ' (' + safeLabel + ')' : '') + (isUsed ? ' - Used' : ' - Free');
        
        if (side === 'horizontal') {
            return '<div class="pin-wrapper horizontal" title="' + title + '">' +
                '<div class="pin-dot ' + dotClass + '"></div>' +
                '<div class="pin-num">' + pinNum + '</div>' +
                '<div class="pin-label">' + safeLabel + '</div>' +
            '</div>';
        } else if (side === 'left') {
            return '<div class="pin-wrapper left" title="' + title + '">' +
                '<div class="pin-label">' + safeLabel + '</div>' +
                '<div class="pin-num">' + pinNum + '</div>' +
                '<div class="pin-dot ' + dotClass + '"></div>' +
            '</div>';
        } else {
            return '<div class="pin-wrapper right" title="' + title + '">' +
                '<div class="pin-dot ' + dotClass + '"></div>' +
                '<div class="pin-num">' + pinNum + '</div>' +
                '<div class="pin-label">' + safeLabel + '</div>' +
            '</div>';
        }
    }).join('');
}

function renderBoardVariantSelector(currentBoard) {
    var group = getBoardGroup(currentBoard);
    if (!group || !BOARD_VARIANTS[group]) return '';
    
    var variant = BOARD_VARIANTS[group];
    if (variant.variants.length <= 1) return '';
    
    var html = '<div class="variant-selector">' +
        '<label>Board Variant:</label>' +
        '<select class="variant-dropdown" onchange="changeBoardVariant(this.value, \'' + currentBoard + '\')">';
    
    variant.variants.forEach(function(v) {
        var selected = v === currentBoard ? 'selected' : '';
        html += '<option value="' + v + '" ' + selected + '>' + (variant.variantLabels[v] || v) + '</option>';
    });
    
    html += '</select></div>';
    return html;
}

function changeBoardVariant(newBoard, currentBoard) {
    // Store the new board selection
    if (window.currentDeviceYaml) {
        // Re-render with new board
        var deviceName = window.currentDeviceName || 'Unknown';
        var platform = window.currentPlatform || 'ESP32';
        var yamlContent = window.currentDeviceYaml || '';
        
        // Update board in BOARD_PINS lookup
        var boardPins = BOARD_PINS[newBoard] || BOARD_PINS['esp32dev'];
        
        // Re-render visualization
        var container = renderSpiderVisualization(deviceName, platform, newBoard, yamlContent);
        
        // Find modal content and replace
        var modalContent = document.querySelector('.modal-content');
        if (modalContent) {
            // Remove old viz
            var oldViz = modalContent.querySelector('.spider-viz-container, .rectangle-viz-container');
            if (oldViz) oldViz.remove();
            
            // Add new viz
            modalContent.appendChild(container);
        }
    }
}

// Store current device info for variant switching
window.currentDeviceName = '';
window.currentPlatform = '';
window.currentDeviceYaml = '';

function renderPinoutReference(pinoutRef) {
    if (!pinoutRef || pinoutRef.length === 0) return '';
    
    var html = '<div class="pinout-reference">' +
        '<div class="pinout-title"><span class="material-icons" style="font-size: 16px; vertical-align: middle;">list_alt</span> Pinout Reference</div>' +
        '<div class="pinout-grid">';
    
    // Split into columns
    var cols = 4;
    var perCol = Math.ceil(pinoutRef.length / cols);
    
    for (var c = 0; c < cols; c++) {
        html += '<div class="pinout-col">';
        for (var i = c * perCol; i < Math.min((c + 1) * perCol, pinoutRef.length); i++) {
            var pin = pinoutRef[i];
            var typeClass = (pin.type || 'GPIO').toLowerCase();
            var warnClass = pin.warn ? 'warn' : '';
            
            // XSS: Escape all pin data
            var safePin = escapeHtml(pin.pin);
            var safeLabel = escapeHtml(pin.label);
            var safeType = escapeHtml(pin.type);
            var safeNote = escapeHtml(pin.note || '');
            
            html += '<div class="pinout-item ' + warnClass + '">' +
                '<span class="pinout-num">' + safePin + '</span>' +
                '<span class="pinout-label">' + safeLabel + '</span>' +
                '<span class="pinout-type ' + typeClass + '">' + safeType + '</span>' +
                '<span class="pinout-note">' + safeNote + '</span>' +
            '</div>';
        }
        html += '</div>';
    }
    
    html += '</div>' +
        '<div class="pinout-legend">' +
            '<span class="legend-item"><span class="legend-dot gpio"></span> GPIO</span>' +
            '<span class="legend-item"><span class="legend-dot i2c"></span> I2C</span>' +
            '<span class="legend-item"><span class="legend-dot uart"></span> UART</span>' +
            '<span class="legend-item"><span class="legend-dot input"></span> Input Only</span>' +
            '<span class="legend-item"><span class="legend-dot warn"></span> ⚠️ Special</span>' +
        '</div>' +
    '</div>';
    
    return html;
}

// Render peripheral library panel
function renderPeripheralLibrary() {
    // Group peripherals by category
    var categories = {};
    PERIPHERAL_LIBRARY.forEach(function(p) {
        if (!categories[p.category]) {
            categories[p.category] = [];
        }
        categories[p.category].push(p);
    });
    
    var html = '<div class="peripheral-library" id="peripheral-library">' +
        '<div class="library-header">' +
            '<h4><span class="material-icons" style="font-size: 16px; vertical-align: middle;">inventory_2</span> Perifériák</h4>' +
            '<button class="collapse-btn" onclick="togglePeripheralLibrary()"><span class="material-icons">chevron_left</span></button>' +
        '</div>' +
        '<input type="text" class="peripheral-search" placeholder="Keresés..." oninput="filterPeripherals(this.value)">' +
        '<div class="peripheral-categories">';
    
    // Render each category
    Object.keys(categories).sort().forEach(function(category) {
        html += '<div class="peripheral-category">' +
            '<div class="category-header" onclick="toggleCategory(\'' + category + '\')">' +
                '<span class="material-icons">expand_more</span>' +
                '<span>' + category + '</span>' +
                '<span style="margin-left: auto; font-size: 10px; color: var(--text-secondary);">' + categories[category].length + '</span>' +
            '</div>' +
            '<div class="category-items" id="category-' + category.replace(/\s+/g, '-') + '">';
        
        categories[category].forEach(function(p) {
            html += '<div class="peripheral-item" draggable="true" ondragstart="startPeripheralDrag(event, \'' + p.id + '\')" data-id="' + p.id + '" data-category="' + p.category + '">' +
                '<span class="material-icons">' + (p.icon || 'memory') + '</span>' +
                '<span style="flex: 1;">' + p.name + '</span>' +
                '<span class="pin-count">' + p.pins + ' pin</span>' +
                (p.bus ? '<span class="bus-type">' + p.bus + '</span>' : '') +
            '</div>';
        });
        
        html += '</div></div>';
    });
    
    html += '</div></div>';
    
    return html;
}

// Toggle peripheral library collapse
function togglePeripheralLibrary() {
    var lib = document.getElementById('peripheral-library');
    if (lib) {
        lib.classList.toggle('collapsed');
    }
}

// Toggle category expansion
function toggleCategory(category) {
    var el = document.getElementById('category-' + category.replace(/\s+/g, '-'));
    if (el) {
        el.classList.toggle('expanded');
    }
}

// Filter peripherals by search term
function filterPeripherals(searchTerm) {
    var items = document.querySelectorAll('.peripheral-item');
    var term = searchTerm.toLowerCase();
    
    items.forEach(function(item) {
        var name = item.getAttribute('data-id') || '';
        var text = item.textContent.toLowerCase();
        if (term === '' || name.indexOf(term) >= 0 || text.indexOf(term) >= 0) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Start peripheral drag
function startPeripheralDrag(event, peripheralId) {
    event.dataTransfer.setData('text/plain', peripheralId);
    event.dataTransfer.effectAllowed = 'copy';
    event.target.classList.add('dragging');
    
    // Find peripheral details
    var peripheral = PERIPHERAL_LIBRARY.find(function(p) { return p.id === peripheralId; });
    if (peripheral) {
        console.log('Dragging peripheral:', peripheral.name, '(', peripheral.pins, 'pins)');
    }
}

// Handle drop on pin
function handlePinDrop(event, pinNum) {
    event.preventDefault();
    event.stopPropagation();
    
    var peripheralId = event.dataTransfer.getData('text/plain');
    var peripheral = PERIPHERAL_LIBRARY.find(function(p) { return p.id === peripheralId; });
    
    if (!peripheral) {
        console.error('Peripheral not found:', peripheralId);
        return;
    }
    
    console.log('Dropped', peripheral.name, 'on GPIO', pinNum);
    
    // Generate YAML for this peripheral
    var yaml = generatePeripheralYAML(peripheral, pinNum);
    
    // Show pin assignment modal
    showPinAssignmentModal(peripheral, pinNum, yaml);
}

// Generate YAML for peripheral
function generatePeripheralYAML(peripheral, startPin) {
    var yaml = '';
    var pin = startPin;
    
    switch(peripheral.id) {
        // Temperature/Humidity Sensors
        case 'dht11':
        case 'dht22':
            yaml = `  - platform: dht
    pin: GPIO${pin}
    temperature:
      name: "${peripheral.name} Temperature"
    humidity:
      name: "${peripheral.name} Humidity"
    update_interval: 60s`;
            break;
        
        case 'ds18b20':
            yaml = `  - platform: dallas
    address: 0x0000000000000000
    name: "${peripheral.name} Temperature"`;
            yaml += `\none_wire:
  - pin: GPIO${pin}`;
            break;
        
        case 'bme280':
        case 'bmp280':
        case 'aht20':
        case 'sht3x':
            yaml = `  - platform: ${peripheral.id}
    temperature:
      name: "${peripheral.name} Temperature"
    humidity:
      name: "${peripheral.name} Humidity"${peripheral.id === 'bme280' ? '\n    pressure:\n      name: "' + peripheral.name + ' Pressure"' : ''}
    address: 0x76
    update_interval: 60s`;
            yaml += `\ni2c:\n  sda: GPIO${pin}\n  scl: GPIO${pin + 1}`;
            break;
        
        // CO2 Sensors
        case 'scd4x':
            yaml = `  - platform: scd4x
    co2:
      name: "${peripheral.name} CO2"
    temperature:
      name: "${peripheral.name} Temperature"
    humidity:
      name: "${peripheral.name} Humidity"
    update_interval: 60s`;
            yaml += `\ni2c:\n  sda: GPIO${pin}\n  scl: GPIO${pin + 1}`;
            break;
        
        case 'mhz19':
            yaml = `  - platform: mhz19
    co2:
      name: "${peripheral.name} CO2"
    temperature:
      name: "${peripheral.name} Temperature"
    update_interval: 60s`;
            yaml += `\nuart:\n  tx_pin: GPIO${pin}\n  rx_pin: GPIO${pin + 1}\n  baud_rate: 9600`;
            break;
        
        // Air Quality
        case 'pms5003':
        case 'sds011':
            yaml = `  - platform: pm_${peripheral.id === 'pms5003' ? 'pms5003' : 'sds011'}
    pm_2_5:
      name: "${peripheral.name} PM2.5"
    pm_10_0:
      name: "${peripheral.name} PM10"
    update_interval: 60s`;
            yaml += `\nuart:\n  tx_pin: GPIO${pin}\n  rx_pin: GPIO${pin + 1}\n  baud_rate: 9600`;
            break;
        
        // Presence Detection
        case 'ld2410':
            yaml = `ld2410:
  tx_pin: GPIO${pin}
  rx_pin: GPIO${pin + 1}
  baud_rate: 256000

binary_sensor:
  - platform: ld2410
    has_target:
      name: "${peripheral.name} Presence"`;
            break;
        
        // Distance Sensors
        case 'vl53l0x':
            yaml = `  - platform: vl53l0x
    name: "${peripheral.name} Distance"
    address: 0x29
    update_interval: 60s`;
            yaml += `\ni2c:\n  sda: GPIO${pin}\n  scl: GPIO${pin + 1}`;
            break;
        
        case 'hcsr04':
            yaml = `  - platform: ultrasonic
    trigger_pin: GPIO${pin}
    echo_pin: GPIO${pin + 1}
    name: "${peripheral.name} Distance"
    update_interval: 60s`;
            break;
        
        // Displays
        case 'ssd1306':
            yaml = `display:
  - platform: ssd1306
    address: 0x3C
    lambda: |-
      it.print(0, 0, id(font), "Hello!");
font:
  - file: "gfonts://Roboto"
    id: font
    size: 12`;
            yaml += `\ni2c:\n  sda: GPIO${pin}\n  scl: GPIO${pin + 1}`;
            break;
        
        case 'st7789':
        case 'ili9341':
            yaml = `display:
  - platform: ${peripheral.id}
    cs_pin: GPIO${pin}
    dc_pin: GPIO${pin + 1}
    reset_pin: GPIO${pin + 2}
    lambda: |-
      it.print(0, 0, id(font), "Hello!");
font:
  - file: "gfonts://Roboto"
    id: font
    size: 12`;
            yaml += `\nspi:\n  clk_pin: GPIO${pin + 3}\n  mosi_pin: GPIO${pin + 4}`;
            break;
        
        // Input Devices
        case 'rotary':
            yaml = `binary_sensor:
  - platform: gpio
    pin: GPIO${pin}
    name: "${peripheral.name} Button"`;
            yaml += `\n\nsensor:
  - platform: rotary_encoder
    pin_a: GPIO${pin}
    pin_b: GPIO${pin + 1}
    name: "${peripheral.name} Rotation"`;
            break;
        
        case 'keypad':
            yaml = `matrix_keypad:
  id: keypad
  rows:
    - GPIO${pin}
    - GPIO${pin + 1}
    - GPIO${pin + 2}
    - GPIO${pin + 3}
  cols:
    - GPIO${pin + 4}
    - GPIO${pin + 5}
    - GPIO${pin + 6}
    - GPIO${pin + 7}
  
binary_sensor:
  - platform: matrix_keypad
    keypad_id: keypad
    id: key_1
    col: 0
    row: 0
    name: "${peripheral.name} Key 1"`;
            break;
        
        // Output Devices
        case 'relay':
            yaml = `switch:
  - platform: gpio
    pin: GPIO${pin}
    name: "${peripheral.name}"
    id: relay_1`;
            break;
        
        case 'led':
            yaml = `light:
  - platform: monochromatic
    output: led_1
    name: "${peripheral.name}"

output:
  - platform: ledc
    pin: GPIO${pin}
    id: led_1`;
            break;
        
        case 'ws2812':
            yaml = `light:
  - platform: neopixelbus
    type: GRB
    variant: WS2812x
    pin: GPIO${pin}
    num_leds: 60
    name: "${peripheral.name}"`;
            break;
        
        // Communication
        case 'uart':
            yaml = `uart:
  tx_pin: GPIO${pin}
  rx_pin: GPIO${pin + 1}
  baud_rate: 9600
  id: uart_bus`;
            break;
        
        case 'i2c':
            yaml = `i2c:
  sda: GPIO${pin}
  scl: GPIO${pin + 1}
  id: i2c_bus`;
            break;
        
        case 'spi':
            yaml = `spi:
  clk_pin: GPIO${pin}
  mosi_pin: GPIO${pin + 1}
  miso_pin: GPIO${pin + 2}
  id: spi_bus`;
            break;
        
        default:
            yaml = `# ${peripheral.name} - GPIO${pin}\n# TODO: Add configuration`;
    }
    
    return yaml;
}

// Show pin assignment modal
function showPinAssignmentModal(peripheral, pinNum, yaml) {
    // Check if modal already exists
    var existingModal = document.getElementById('pin-assignment-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // XSS: Escape peripheral data
    var safeName = escapeHtml(peripheral.name);
    var safeCategory = escapeHtml(peripheral.category);
    var safeBus = peripheral.bus ? escapeHtml(peripheral.bus) : '';
    var safeIcon = escapeHtml(peripheral.icon || 'memory');
    
    var modal = document.createElement('div');
    modal.id = 'pin-assignment-modal';
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h3><span class="material-icons">${safeIcon}</span> ${safeName} bekötése</h3>
                <button class="close-btn" onclick="closePinAssignmentModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div style="margin-bottom: 16px;">
                    <strong>Periféria:</strong> ${safeName}<br>
                    <strong>Kategória:</strong> ${safeCategory}<br>
                    <strong>Pin száma:</strong> ${peripheral.pins}<br>
                    ${safeBus ? '<strong>Bus:</strong> ' + safeBus : ''}
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">Kezdő pin:</label>
                    <select id="start-pin-select" style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid var(--border);">
                        <option value="${pinNum}">GPIO${pinNum}</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 500;">YAML konfiguráció:</label>
                    <pre style="background: var(--code-bg); padding: 12px; border-radius: 8px; overflow-x: auto; font-size: 12px;">${yaml}</pre>
                </div>
                
                <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <button class="btn btn-secondary" onclick="closePinAssignmentModal()">Mégse</button>
                    <button class="btn btn-primary" onclick="copyYAMLToClipboard(\`${yaml.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`)">
                        <span class="material-icons">content_copy</span> Másolás
                    </button>
                    <button class="btn btn-success" onclick="insertYAMLToEditor(\`${yaml.replace(/`/g, '\\`').replace(/\n/g, '\\n')}\`)">
                        <span class="material-icons">add</span> Beszúrás
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Close pin assignment modal
function closePinAssignmentModal() {
    var modal = document.getElementById('pin-assignment-modal');
    if (modal) {
        modal.remove();
    }
}

// Copy YAML to clipboard
function copyYAMLToClipboard(yaml) {
    navigator.clipboard.writeText(yaml).then(function() {
        showToast('success', 'Másolva', 'YAML másolva a vágólapra');
    }).catch(function(err) {
        console.error('Copy failed:', err);
        showToast('error', 'Hiba', 'Másolás sikertelen');
    });
}

// Insert YAML to editor
function insertYAMLToEditor(yaml) {
    // Decode escape sequences if needed
    var decodedYaml = yaml;
    
    // Handle escaped newlines
    if (yaml.indexOf('\\n') !== -1) {
        decodedYaml = yaml.replace(/\\n/g, '\n');
    }
    
    // URL decode if needed
    if (yaml.indexOf('%0A') !== -1 || yaml.indexOf('%3A') !== -1) {
        try {
            decodedYaml = decodeURIComponent(yaml);
        } catch (e) {
            console.log('URL decode failed, using original');
        }
    }
    
    console.log('Inserting YAML, decoded:', decodedYaml.substring(0, 100));
    
    if (typeof insertTemplate === 'function') {
        insertTemplate(decodedYaml);
        closePinAssignmentModal();
        showToast('success', 'Beszúrva', 'YAML beszúrva a szerkesztőbe');
    } else if (window.monacoEditor) {
        var position = window.monacoEditor.getPosition();
        window.monacoEditor.executeEdits('', [{
            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
            text: '\n' + decodedYaml
        }]);
        closePinAssignmentModal();
        showToast('success', 'Beszúrva', 'YAML beszúrva a szerkesztőbe');
    } else {
        showToast('error', 'Hiba', 'Nem található szerkesztő');
    }
}

window.renderPeripheralLibrary = renderPeripheralLibrary;
window.togglePeripheralLibrary = togglePeripheralLibrary;
window.toggleCategory = toggleCategory;
window.filterPeripherals = filterPeripherals;
window.startPeripheralDrag = startPeripheralDrag;
window.handlePinDrop = handlePinDrop;
window.closePinAssignmentModal = closePinAssignmentModal;
window.copyYAMLToClipboard = copyYAMLToClipboard;
window.insertYAMLToEditor = insertYAMLToEditor;
window.escapeHtml = escapeHtml;

// Export for global use
window.renderSpiderVisualization = renderSpiderVisualization;