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
    echo json_encode(['success' => false, 'message' => 'Por favor, completa todos los campos.']);
    exit;
}

// Validación específica del formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Por favor, introduce una dirección de correo electrónico válida.']);
    exit;
}

// Preparar la consulta para la tabla 'feedback'
$stmt = $conn->prepare("INSERT INTO feedback (feedback_type, message, email) VALUES (?, ?, ?)");
if ($stmt === false) {
    // Log del error para depuración interna, no exponer detalles al usuario
    error_log('Error al preparar la consulta: ' . $conn->error);
    echo json_encode(['success' => false, 'message' => 'Error del servidor, por favor intenta más tarde.']);
    exit;
}

// "sss" significa que los tres parámetros son strings
$stmt->bind_param("sss", $feedback_type, $message, $email);

// Ejecutar y verificar
if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => '¡Comentario enviado con éxito! Gracias por tu feedback.']);
} else {
    // Log del error para depuración interna
    error_log('Error al ejecutar la consulta: ' . $stmt->error);
    echo json_encode(['success' => false, 'message' => 'Error al enviar el comentario, por favor intenta más tarde.']);
}

// Cerrar todo
$stmt->close();
$conn->close();
?>