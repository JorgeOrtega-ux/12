<?php
require_once '../config/db-connection.php';

header('Content-Type: application/json');

$input = file_get_contents('php://input');
$data = json_decode($input, true);

$uuid = $data['uuid'] ?? null;
$country = $data['country'] ?? 'Unknown';
$os = $data['os'] ?? 'Unknown';
$browser = $data['browser'] ?? 'Unknown';
$browser_version = $data['browser_version'] ?? 'Unknown';
$language = $data['language'] ?? 'Unknown';

if (!$uuid) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'UUID es requerido.']);
    exit;
}

// =========================================================================
// PASO 1: Insertar o actualizar el perfil principal del usuario
// =========================================================================
$sql_activity = "INSERT INTO user_activity (uuid, country, operating_system, browser, browser_version, preferred_language, last_activity)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())
                 ON DUPLICATE KEY UPDATE
                 last_activity = NOW(),
                 browser = VALUES(browser),
                 browser_version = VALUES(browser_version),
                 preferred_language = VALUES(preferred_language)";

$stmt_activity = $conn->prepare($sql_activity);

if ($stmt_activity === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al preparar la consulta de actividad: ' . $conn->error]);
    exit;
}

$stmt_activity->bind_param("ssssss", $uuid, $country, $os, $browser, $browser_version, $language);

if ($stmt_activity->execute()) {
    // Si affected_rows es 1, significa que se insertó una nueva fila (usuario nuevo).
    // Si es 2, significa que una fila existente fue actualizada.
    // Si es 0, no hubo cambios.
    $is_new_user = ($conn->affected_rows === 1);

    // =============================================================================================
    // PASO 2: Si es un usuario nuevo, crear su registro de métricas inmediatamente
    // =============================================================================================
    if ($is_new_user) {
        // Usamos INSERT IGNORE para evitar errores si la fila ya existiera por alguna razón.
        // Esto crea la fila con todos los contadores en su valor por defecto (0).
        $sql_metrics = "INSERT IGNORE INTO user_metrics (user_uuid) VALUES (?)";
        $stmt_metrics = $conn->prepare($sql_metrics);
        
        if ($stmt_metrics) {
            $stmt_metrics->bind_param("s", $uuid);
            $stmt_metrics->execute();
            $stmt_metrics->close();
        }
    }
    
    $status = $is_new_user ? 'created' : 'updated';
    $http_code = ($status === 'created') ? 201 : 200;
    http_response_code($http_code);
    echo json_encode(['success' => true, 'status' => $status]);

} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al registrar la actividad del usuario.']);
}

$stmt_activity->close();
$conn->close();
?>