<?php
// Incluir la conexión a la base de datos
require_once '../config/db-connection.php';

header('Content-Type: application/json');

// Obtener los datos del POST
$suggestion_type = isset($_POST['suggestion_type']) ? trim($_POST['suggestion_type']) : '';
$message = isset($_POST['suggestion_text']) ? trim($_POST['suggestion_text']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';

// Validación de campos
if (empty($suggestion_type) || empty($message) || empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Por favor, completa todos los campos.']);
    exit;
}

// Validación específica del formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Por favor, introduce una dirección de correo electrónico válida.']);
    exit;
}

// Preparar la consulta para evitar inyección SQL
$stmt = $conn->prepare("INSERT INTO suggestions (suggestion_type, message, email) VALUES (?, ?, ?)");
if ($stmt === false) {
    echo json_encode(['success' => false, 'message' => 'Error al preparar la consulta: ' . $conn->error]);
    exit;
}

// "sss" significa que los tres parámetros son strings
$stmt->bind_param("sss", $suggestion_type, $message, $email);

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