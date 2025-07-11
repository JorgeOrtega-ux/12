<?php
// Incluir la conexión a la base de datos
require_once '../config/db-connection.php';

header('Content-Type: application/json');

// Obtener los datos del POST usando los nuevos nombres de campo del formulario
$feedback_type = isset($_POST['feedback_type']) ? trim($_POST['feedback_type']) : '';
$message = isset($_POST['feedback_text']) ? trim($_POST['feedback_text']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';

// Validación de campos
if (empty($feedback_type) || empty($message) || empty($email)) {
    // Devuelve una clave de traducción para el error
    echo json_encode(['success' => false, 'message' => 'feedback_error_all_fields']);
    exit;
}

// Validación específica del formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    // Devuelve una clave de traducción para el error
    echo json_encode(['success' => false, 'message' => 'feedback_error_invalid_email']);
    exit;
}

// Preparar la consulta para la tabla 'feedback'
$stmt = $conn->prepare("INSERT INTO feedback (feedback_type, message, email) VALUES (?, ?, ?)");
if ($stmt === false) {
    // Log del error para depuración interna, no exponer detalles al usuario
    error_log('Error al preparar la consulta: ' . $conn->error);
    // Devuelve una clave de traducción genérica para el error del servidor
    echo json_encode(['success' => false, 'message' => 'feedback_error_server']);
    exit;
}

// "sss" significa que los tres parámetros son strings
$stmt->bind_param("sss", $feedback_type, $message, $email);

// Ejecutar y verificar
if ($stmt->execute()) {
    // Devuelve una clave de traducción para el mensaje de éxito
    echo json_encode(['success' => true, 'message' => 'feedback_success_sent']);
} else {
    // Log del error para depuración interna
    error_log('Error al ejecutar la consulta: ' . $stmt->error);
    // Devuelve una clave de traducción para el error al enviar
    echo json_encode(['success' => false, 'message' => 'feedback_error_sending']);
}

// Cerrar todo
$stmt->close();
$conn->close();
?>