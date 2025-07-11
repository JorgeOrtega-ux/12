// /assets/js/general/main.js

import { activateModule, deactivateAllModules, deactivateModule, getActiveModule, isAnyModuleActive, isModuleActive, isModuleCurrentlyChanging, logModuleStates, resetModuleChangeFlag, showControlCenterMenu, showSpecificOverlay, toggleModule } from './module-manager.js';
import { initializeTextStyleManager } from '../tools/general-tools.js';
import { isGradientColor } from '../components/palette-colors.js';
import { populateHourSelectionMenu } from './menu-interactions.js';
import { trackEvent } from '../general/event-tracker.js'; 

// ========== GLOBAL TIME FORMAT SETTING ==========
export let use24HourFormat = true;

// ========== CARD MOVEMENT SETTING ==========
export let allowCardMovement = true;


// ========== MOBILE SIDEBAR MODULE ==========

function initSidebarMobile() {
    const btn = document.querySelector('[data-module="toggleSidebarMovile"]');
    const sidebar = document.querySelector('.sidebar-wrapper.mobile-sidebar');

    if (!btn || !sidebar) {
        return;
    }

    function handleSidebarToggle(e) {
        if (e) e.stopPropagation();

        if (btn.hasAttribute('disabled')) {
            btn.removeAttribute('disabled');
        } else {
            btn.setAttribute('disabled', 'true');
        }

        if (sidebar.classList.contains('disabled')) {
            sidebar.classList.remove('disabled');
            sidebar.classList.add('active');
        } else {
            sidebar.classList.remove('active');
            sidebar.classList.add('disabled');
        }
    }

    btn.addEventListener('click', handleSidebarToggle);

    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('active') && !sidebar.contains(e.target) && !btn.contains(e.target)) {
            handleSidebarToggle();
        }
    });

    document.addEventListener('sectionChanged', () => {
        if (sidebar.classList.contains('active')) {
            handleSidebarToggle();
        }
    });

    function updateSidebarVisibility() {
        const screenWidth = window.innerWidth;

        if (screenWidth > 768) {
            if (sidebar.classList.contains('active')) {
                sidebar.classList.remove('active');
                sidebar.classList.add('disabled');
            }
            btn.removeAttribute('disabled');
        }
    }

    updateSidebarVisibility();
    window.addEventListener('resize', updateSidebarVisibility);
}

// ========== SIDEBAR & LEGAL SECTIONS SYSTEM ==========

const activeSectionStates = {
    everything: true,
    alarm: false,
    stopwatch: false,
    timer: false,
    worldClock: false,
    'privacy-policy': false,
    'terms-conditions': false,
    'cookies-policy': false
};

const iconToSection = {
    'home': 'everything',
    'alarm': 'alarm',
    'timelapse': 'stopwatch',
    'timer': 'timer',
    'schedule': 'worldClock',
    'policy': 'privacy-policy',
    'gavel': 'terms-conditions',
    'cookie': 'cookies-policy'
};


const sectionStates = {
    currentView: 'tools', // Puede ser 'tools' o 'legal'
    activeSection: 'everything'
};

function logSectionStates() {
    console.groupCollapsed('📋 Current Section States');
    const statesForTable = {};
    const sections = Object.keys(activeSectionStates);
    for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        statesForTable[section.toUpperCase()] = {
            Status: activeSectionStates[section] ? '✅ ACTIVE' : '❌ INACTIVE'
        };
    }
    console.table(statesForTable);
    console.groupEnd();
}

function activateSection(sectionName, showLog = true) {
    if (activeSectionStates[sectionName] === true) {
        return;
    }

    // Desactivar todas las secciones en el estado
    for (const section in activeSectionStates) {
        activeSectionStates[section] = false;
    }

    // Activar la nueva sección
    if (activeSectionStates.hasOwnProperty(sectionName)) {
        activeSectionStates[sectionName] = true;
        sectionStates.activeSection = sectionName;
    }

    // Ocultar la sección anterior en el DOM
    const oldSection = document.querySelector('.section-content > .active');
    if (oldSection) {
        oldSection.classList.remove('active');
        oldSection.classList.add('disabled');
    }

    // Mostrar la nueva sección en el DOM
    const newSection = document.querySelector(`.section-content > [data-section="${sectionName}"]`);
    if (newSection) {
        newSection.classList.remove('disabled');
        newSection.classList.add('active');
    } else {
        console.warn(`Sección "${sectionName}" no encontrada.`);
    }

    updateSidebarButtons(sectionName);

    if (showLog) {
        logSectionStates();
    }

    const event = new CustomEvent('sectionChanged', {
        detail: { activeSection: sectionName, view: sectionStates.currentView, states: activeSectionStates }
    });
    
    // ----- INICIO DE LA MODIFICACIÓN -----
    // Se registra el evento de visita a la sección.
    trackEvent('section_visit', sectionName);
    // ----- FIN DE LA MODIFICACIÓN -----

    document.dispatchEvent(event);
}



function updateSidebarButtons(activeSection) {
    document.querySelectorAll('.sidebar-button').forEach(button => {
        const sectionName = button.dataset.sectionName;
        if (sectionName === activeSection) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
}

function switchToLegalView(sectionName) {
    sectionStates.currentView = 'legal';

    // Ocultar el div de herramientas y mostrar el de legales
    document.querySelector('.sidebar-tools')?.classList.add('disabled');
    document.querySelector('.sidebar-legal-options')?.classList.remove('disabled');

    // Activar la sección legal correspondiente
    activateSection(sectionName);
}

function switchToToolsView(showLog = false) {
    sectionStates.currentView = 'tools';

    // Ocultar el div de legales y mostrar el de herramientas
    document.querySelector('.sidebar-legal-options')?.classList.add('disabled');
    document.querySelector('.sidebar-tools')?.classList.remove('disabled');

    // Activar la sección "everything" por defecto
    activateSection('everything', showLog);
}

function initSectionManagement() {
    // Event listener para los botones de herramientas (selector corregido)
    document.querySelectorAll('.sidebar-tools .sidebar-button').forEach(button => {
        button.addEventListener('click', () => {
            const sectionName = button.dataset.sectionName;
            if (sectionName) {
                // Esta lógica ahora solo se aplica a los botones de herramientas
                if (sectionStates.currentView !== 'tools') {
                    switchToToolsView();
                }
                activateSection(sectionName);
            }
        });
    });

    // Event listener para los links de políticas en el Control Center (sin cambios)
    document.querySelector('.module-control-center').addEventListener('click', (e) => {
        const legalLink = e.target.closest('[data-action="privacy-policy"], [data-action="terms-conditions"], [data-action="cookies-policy"]');
        if (legalLink) {
            const sectionName = legalLink.dataset.action;
            switchToLegalView(sectionName);
            deactivateModule('controlCenter');
        }
    });

    // Event listener para los botones en la barra lateral de políticas (sin cambios)
    document.querySelectorAll('.sidebar-legal-options .sidebar-button').forEach(button => {
        button.addEventListener('click', () => {
            const action = button.dataset.action;
            const sectionName = button.dataset.sectionName;
            if (action === 'back-to-tools') {
                switchToToolsView(true);
            } else if (sectionName) {
                activateSection(sectionName);
            }
        });
    });

    // Estado inicial (sin log)
    switchToToolsView(false);
}


// ========== PUBLIC FUNCTIONS FOR EXTERNAL SECTION MANAGEMENT ==========

function getActiveSection() {
    return sectionStates.activeSection;
}

function getAllSectionStates() {
    return { ...activeSectionStates };
}

function switchToSection(sectionName) {
    if (activeSectionStates.hasOwnProperty(sectionName)) {
        activateSection(sectionName);
        return true;
    }
    return false;
}

export function toggleTimeFormat() {
    use24HourFormat = !use24HourFormat;
    updateTimeFormatInAllSections();

    // Vuelve a poblar el selector de horas si el menú está abierto
    const timePickerMenu = document.querySelector('.menu-timePicker[data-menu="timePicker"]');
    if (timePickerMenu && timePickerMenu.classList.contains('active')) {
        populateHourSelectionMenu();
    }
    // Dispatch a custom event to notify other modules
    const event = new CustomEvent('timeFormatChanged');
    document.dispatchEvent(event);
}

function updateTimeFormatInAllSections() {
    // Aquí llamarías a las funciones de actualización de cada sección
    if (window.alarmManager && typeof window.alarmManager.renderAllAlarmCards === 'function') {
        window.alarmManager.renderAllAlarmCards();
    }
    if (window.timerManager && typeof window.timerManager.renderAllTimerCards === 'function') {
        window.timerManager.renderAllTimerCards();
    }
    if (window.worldClockManager && typeof window.worldClockManager.updateExistingCardsTranslations === 'function') {
        window.worldClockManager.updateExistingCardsTranslations();
    }
    // Para el widget principal, la actualización es manejada por su propio intervalo
}


// ========== INITIALIZATION - DELEGATED TO MODULE MANAGER ==========

function initControlCenter() {
}

function initNewOverlayModules() {
}

// ========== UNIFIED MODULE CONTROL FUNCTIONS ==========

function closeActiveModule(options = {}) {
    const activeModule = getActiveModule();
    if (activeModule) {
        deactivateModule(activeModule, options);
    }
}

function closeAllModules(options = {}) {
    const { source = 'closeAllModules' } = options;

    if (isAnyModuleActive()) {
        deactivateAllModules();
        console.log('🔧 All modules closed from:', source);
    }
}

function activateModuleByName(moduleName) {
    activateModule(moduleName);
}

function toggleModuleByName(moduleName) {
    toggleModule(moduleName);
}

// ========== MODULE UTILITY FUNCTIONS ==========

function getModuleInfo(moduleName) {
    return {
        active: isModuleActive(moduleName),
        name: moduleName
    };
}

function isControlCenterActive() {
    return isModuleActive('controlCenter');
}

function isAnyOverlayActive() {
    return isModuleActive('menuAlarm') ||
        isModuleActive('menuTimer') ||
        isModuleActive('menuWorldClock') ||
        isModuleActive('menuPaletteColors') ||
        isModuleActive('overlayContainer');
}

// ========== OVERLAY SPECIFIC FUNCTIONS ==========

function activateSpecificOverlay(overlayName) {
    const overlayToToggleMap = {
        'menuAlarm': 'toggleMenuAlarm',
        'menuTimer': 'toggleMenuTimer',
        'menuWorldClock': 'toggleMenuWorldClock',
        'menuPaletteColors': 'togglePaletteColors'
    };

    const toggle = overlayToToggleMap[overlayName];
    if (toggle) {
        activateModule(toggle);
        return true;
    }
    return false;
}

function closeSpecificOverlay(overlayName) {
    if (isModuleActive('overlayContainer')) {
        deactivateModule('overlayContainer');
        return true;
    }
    return false;
}

function switchOverlay(overlayName) {
    if (isModuleActive('overlayContainer')) {
        const currentOverlay = getCurrentActiveOverlay();
        if (currentOverlay !== overlayName) {
            return activateSpecificOverlay(overlayName);
        }
        return false;
    } else {
        return activateSpecificOverlay(overlayName);
    }
}

function getCurrentActiveOverlay() {
    const overlayContainer = document.querySelector('.module-overlay');
    if (overlayContainer && overlayContainer.classList.contains('active')) {
        const activeOverlay = overlayContainer.querySelector('.menu-alarm.active, .menu-timer.active, .menu-worldClock.active, .menu-paletteColors.active');
        if (activeOverlay) {
            const dataMenu = activeOverlay.getAttribute('data-menu');

            const overlayMap = {
                'alarm': 'menuAlarm',
                'timer': 'menuTimer',
                'worldClock': 'menuWorldClock',
                'paletteColors': 'menuPaletteColors'
            };

            return overlayMap[dataMenu] || null;
        }
    }
    return null;
}

// ========== ENHANCED CONTROL CENTER FUNCTIONS ==========

function activateControlCenterMenu(menuName) {
    if (isControlCenterActive()) {
        showControlCenterMenu(menuName);
        return true;
    } else {
        activateModule('controlCenter');
        setTimeout(() => {
            showControlCenterMenu(menuName);
        }, 100);
        return true;
    }
}

function switchControlCenterMenu(menuName) {
    return activateControlCenterMenu(menuName);
}

// ========== DEBUGGING AND STATE FUNCTIONS ==========

function logAllStates() {
    console.group('🌙 ProjectNocturne - Complete System Status');
    logSectionStates();
    logModuleStates();
    console.log('📊 Active Module:', getActiveModule() || 'None');
    console.log('📊 Any Module Active:', isAnyModuleActive());
    console.log('📊 Control Center Active:', isControlCenterActive());
    console.log('📊 Any Overlay Active:', isAnyOverlayActive());
    console.log('📊 Current Active Overlay:', getCurrentActiveOverlay() || 'None');
    console.groupEnd();
}

function getSystemStatus() {
    return {
        sections: {
            active: getActiveSection(),
            all: getAllSectionStates()
        },
        modules: {
            active: getActiveModule(),
            anyActive: isAnyModuleActive(),
            controlCenterActive: isControlCenterActive(),
            anyOverlayActive: isAnyOverlayActive(),
            currentActiveOverlay: getCurrentActiveOverlay(),
            isChanging: isModuleCurrentlyChanging()
        }
    };
}

// ========== WRAPPER FUNCTIONS FOR COMPATIBILITY ==========

function closeControlCenter(options = {}) {
    deactivateModule('controlCenter', options);
}

function closeOverlays(options = {}) {
    if (isModuleActive('overlayContainer')) {
        deactivateModule('overlayContainer', options);
    }
}

function closeOverlayByName(overlayName) {
    const currentOverlay = getCurrentActiveOverlay();
    if (currentOverlay === overlayName) {
        return closeSpecificOverlay(overlayName);
    }
    return false;
}

// ========== CUSTOM EVENT FUNCTIONS ==========

function dispatchModuleEvent(eventName, detail = {}) {
    const event = new CustomEvent(eventName, {
        detail: {
            ...detail,
            timestamp: Date.now(),
            activeModule: getActiveModule(),
            activeSection: getActiveSection()
        }
    });
    document.dispatchEvent(event);
}

function onModuleActivated(callback) {
    document.addEventListener('moduleActivated', callback);
}

function onModuleDeactivated(callback) {
    document.addEventListener('moduleDeactivated', callback);
}

function onOverlayChanged(callback) {
    document.addEventListener('overlayChanged', callback);
}

// ========== ADVANCED UTILITY FUNCTIONS ==========

function isModuleBusy() {
    return isModuleCurrentlyChanging();
}

function waitForModuleReady() {
    return new Promise((resolve) => {
        if (!isModuleCurrentlyChanging()) {
            resolve();
            return;
        }

        const checkReady = () => {
            if (!isModuleCurrentlyChanging()) {
                resolve();
            } else {
                setTimeout(checkReady, 50);
            }
        };

        setTimeout(checkReady, 50);
    });
}

function executeWhenModuleReady(callback) {
    waitForModuleReady().then(callback);
}

// ========== CONFIGURATION AND PREFERENCE FUNCTIONS ==========

function setModulePreference(moduleName, preference, value) {
    try {
        const key = `module-${moduleName}-${preference}`;
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error('Error setting module preference:', error);
        return false;
    }
}

function getModulePreference(moduleName, preference, defaultValue = null) {
    try {
        const key = `module-${moduleName}-${preference}`;
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
        console.error('Error getting module preference:', error);
        return defaultValue;
    }
}

// ========== GETTERS FOR PERSONALIZATION DATA ==========

function getAppliedColor() {
    if (window.colorTextManager && typeof window.colorTextManager.getCurrentColor === 'function' && typeof window.colorTextManager.getColorInfo === 'function') {
        const color = window.colorTextManager.getCurrentColor();
        const info = window.colorTextManager.getColorInfo();
        return {
            color: color,
            colorName: info.activeColorName,
            isGradient: isGradientColor(color),
            isValidForTheme: window.colorTextManager.isValidForTheme(color)
        };
    }
    return {
        color: 'N/A',
        colorName: 'N/A',
        isGradient: 'N/A',
        isValidForTheme: 'N/A'
    };
}

function getAppliedFontScale() {
    if (window.centralizedFontManager && typeof window.centralizedFontManager.getCurrentScale === 'function' && typeof window.centralizedFontManager.getCurrentActualSize === 'function') {
        const scale = window.centralizedFontManager.getCurrentScale();
        const pixelSize = window.centralizedFontManager.getCurrentActualSize();
        return {
            scale: scale,
            pixelSize: pixelSize
        };
    }
    return { scale: 'N/A', pixelSize: 'N/A' };
}

function getAppliedTextStyle() {
    return {
        isBold: localStorage.getItem('textStyle_isBold') === 'true',
        isItalic: localStorage.getItem('textStyle_isItalic') === 'true'
    };
}

// ========== INITIALIZE TEXT STYLE MANAGER ==========
document.addEventListener('DOMContentLoaded', initializeTextStyleManager);


// ========== EXPORTS - COMPLETE AND UNIFIED FUNCTIONS ==========

export {
    activateControlCenterMenu, activateModuleByName as activateModule, activateSection, activateSpecificOverlay,
    closeActiveModule, closeAllModules, closeControlCenter, closeOverlayByName, closeOverlays,
    deactivateModule, dispatchModuleEvent, executeWhenModuleReady, getActiveModule, getActiveSection,
    getAllSectionStates, getAppliedColor, getAppliedFontScale, getAppliedTextStyle, getCurrentActiveOverlay,
    getModuleInfo, getModulePreference, getSystemStatus, initControlCenter, initNewOverlayModules,
    initSidebarMobile, initSectionManagement as initSidebarSections, isAnyModuleActive, isAnyOverlayActive, isControlCenterActive
};

export {
    isModuleActive, isModuleBusy, isModuleCurrentlyChanging, logAllStates, logModuleStates, logSectionStates,
    onModuleActivated, onModuleDeactivated, onOverlayChanged, resetModuleChangeFlag, setModulePreference,
    showControlCenterMenu, showSpecificOverlay, switchControlCenterMenu, switchOverlay, switchToSection,
    toggleModuleByName as toggleModule, waitForModuleReady
};