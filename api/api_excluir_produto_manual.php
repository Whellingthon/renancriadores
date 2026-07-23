<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'api_get_config.php';

try {
    $json = file_get_contents("php://input");
    $data = json_decode($json, true);

    $id = isset($data['id']) ? intval($data['id']) : 0;

    if ($id <= 0) {
        throw new Exception("ID do produto inválido para exclusão.");
    }

    // Executa a exclusão direta pelo ID na tabela produtos
    $stmt = $pdo->prepare("DELETE FROM produtos WHERE id = ?");
    $stmt->execute([$id]);

    echo json_encode(["sucesso" => true, "mensagem" => "Produto excluído com sucesso!"]);

} catch (Exception $e) {
    echo json_encode(["sucesso" => false, "erro" => $e->getMessage()]);
}
?>