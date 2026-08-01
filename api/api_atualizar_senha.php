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

    $id = isset($data['usuario_id']) ? intval($data['usuario_id']) : 0;
    $novaSenha = isset($data['nova_senha']) ? trim($data['nova_senha']) : '';

    if (empty($novaSenha) || strlen($novaSenha) < 6) {
        throw new Exception("A nova senha deve ter pelo menos 6 caracteres.");
    }

    // Gera o novo hash seguro para a senha
    $novoHash = password_hash($novaSenha, PASSWORD_DEFAULT);

    // Atualiza a senha e desliga a flag 'precisa_trocar_senha'
    $stmt = $pdo->prepare("UPDATE usuarios SET senha = ?, precisa_trocar_senha = 0 WHERE id = ?");
    $stmt->execute([$novoHash, $id]);

    echo json_encode([
        "sucesso" => true,
        "mensagem" => "Senha atualizada com sucesso! Faça login novamente com sua nova senha."
    ]);

} catch (Exception $e) {
    echo json_encode(["sucesso" => false, "erro" => $e->getMessage()]);
}
?>