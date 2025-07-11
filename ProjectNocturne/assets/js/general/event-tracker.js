const USER_UUID_KEY_TRACKER = 'user-unique-id';

/**
 * Registra un evento de interacción del usuario.
 * @param {string} eventType - La categoría del evento (ej. 'tool_used', 'interaction').
 * @param {string} eventDetails - Los detalles específicos (ej. 'alarm', 'create_timer').
 */
export async function trackEvent(eventType, eventDetails = '') {
    const uuid = localStorage.getItem(USER_UUID_KEY_TRACKER);
    if (!uuid) {
        // No registrar eventos si no tenemos un UUID para el usuario.
        return;
    }

    try {
        await fetch('api/track-event.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uuid,
                eventType,
                eventDetails
            }),
        });
    } catch (error) {
        console.error(`Error al registrar el evento [${eventType}: ${eventDetails}]:`, error);
    }
}