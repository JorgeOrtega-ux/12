<?php
require_once '../config/db-connection.php';

header('Content-Type: application/json');

$input = file_get_contents('php://input');
$data = json_decode($input, true);

$uuid = $data['uuid'] ?? null;
$eventType = $data['eventType'] ?? '';
$eventDetails = $data['eventDetails'] ?? '';

// Validación básica
if (!$uuid || !$eventType || !$eventDetails) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'UUID, eventType y eventDetails son requeridos.']);
    exit;
}

// La consulta ahora es más genérica y potente.
// Inserta una nueva fila de métrica. Si ya existe (basado en la UNIQUE KEY),
// simplemente incrementa el contador y actualiza la fecha.
$sql = "INSERT INTO user_metrics (user_uuid, event_type, event_details, event_count, last_event_timestamp)
        VALUES (?, ?, ?, 1, NOW())
        ON DUPLICATE KEY UPDATE
        event_count = event_count + 1,
        last_event_timestamp = NOW()";

$stmt = $conn->prepare($sql);

if ($stmt === false) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al preparar la consulta: ' . $conn->error]);
    exit;
}

// Vinculamos los tres parámetros a la consulta
$stmt->bind_param("sss", $uuid, $eventType, $eventDetails);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Métrica de usuario actualizada.']);
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Error al actualizar la métrica: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
?>