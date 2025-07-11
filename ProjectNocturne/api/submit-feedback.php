<?php
// Incluir la conexión a la base de datos
require_once '../config/db-connection.php';

header('Content-Type: application/json');

// Obtener los datos del POST
$feedback_type = isset($_POST['feedback_type']) ? trim($_POST['feedback_type']) : '';
$message = isset($_POST['feedback_text']) ? trim($_POST['feedback_text']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$uuid = isset($_POST['uuid']) ? trim($_POST['uuid']) : ''; // Campo UUID

// Validación de campos
if (empty($feedback_type) || empty($message) || empty($email) || empty($uuid)) {
    echo json_encode(['success' => false, 'message' => 'Por favor, completa todos los campos.']);
    exit;
}

// Validación específica del formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Por favor, introduce una dirección de correo electrónico válida.']);
    exit;
}

// --- INICIO DE LA MODIFICACIÓN: Límite diario ---
// Contar cuántos feedbacks ha enviado este UUID en las últimas 24 horas
$stmt_daily_check = $conn->prepare("SELECT COUNT(*) FROM feedback WHERE uuid = ? AND created_at >= NOW() - INTERVAL 1 DAY");
if ($stmt_daily_check === false) {
    echo json_encode(['success' => false, 'message' => 'Error al preparar la consulta de límite diario.']);
    exit;
}
$stmt_daily_check->bind_param("s", $uuid);
$stmt_daily_check->execute();
$stmt_daily_check->bind_result($daily_count);
$stmt_daily_check->fetch();
$stmt_daily_check->close();

if ($daily_count >= 3) {
    echo json_encode(['success' => false, 'message' => 'Has alcanzado el límite de 3 comentarios por día.']);
    exit;
}
// --- FIN DE LA MODIFICACIÓN ---

// Comprobar si el UUID ha enviado feedback en los últimos 10 segundos
$stmt_check = $conn->prepare("SELECT COUNT(*) FROM feedback WHERE uuid = ? AND created_at > NOW() - INTERVAL 10 SECOND");
if ($stmt_check === false) {
    echo json_encode(['success' => false, 'message' => 'Error al preparar la consulta de verificación: ' . $conn->error]);
    exit;
}
$stmt_check->bind_param("s", $uuid);
$stmt_check->execute();
$stmt_check->bind_result($count);
$stmt_check->fetch();
$stmt_check->close();

if ($count > 0) {
    echo json_encode(['success' => false, 'message' => 'Por favor, espera 10 segundos antes de enviar otro comentario.']);
    exit;
}


// Preparar la consulta para evitar inyección SQL
$stmt = $conn->prepare("INSERT INTO feedback (feedback_type, message, email, uuid) VALUES (?, ?, ?, ?)");
if ($stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Error al preparar la consulta: ' . $conn->error]);
    exit;
}

// "ssss" significa que los cuatro parámetros son strings
$stmt->bind_param("ssss", $feedback_type, $message, $email, $uuid);

// Ejecutar y verificar
if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => '¡Sugerencia enviada con éxito! Gracias por tus comentarios.']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error al enviar la sugerencia: ' . $stmt->error]);
}

// Cerrar todo
$stmt->close();
$conn->close();
?>