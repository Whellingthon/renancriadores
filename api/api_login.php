<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

require_once 'api_get_config.php'; // Seu arquivo de conexão com o PDO

$data = json_decode(file_get_contents("php://input"));

$usuario = $data->usuario ?? '';
$senha = $data->senha ?? '';

try {
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE usuario = :usuario AND senha = :senha");
    $stmt->execute(['usuario' => $usuario, 'senha' => $senha]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user) {
        echo json_encode(["sucesso" => true, "mensagem" => "Login aprovado"]);
    } else {
        http_response_code(401);
        echo json_encode(["sucesso" => false, "mensagem" => "Usuário ou senha incorretos"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["sucesso" => false, "erro" => $e->getMessage()]);
}
?>