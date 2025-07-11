<?php
$servername = "localhost"; // O la IP de tu servidor de BD
$username = "root";
$password = "";
$dbname = "ProjectNocturne";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $dbname);

// Verificar conexión
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>