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
    $codigoInformado = isset($data['codigo']) ? trim($data['codigo']) : '';

    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE id = ?");
    $stmt->execute([$id]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        throw new Exception("Usuário não encontrado.");
    }

    // CORREÇÃO: Força ambos os valores a serem lidos como String para não haver conflito
    $codigoBanco = (string)$user['codigo_2fa'];
    $codigoDigitado = (string)$codigoInformado;
    $agora = date('Y-m-d H:i:s');

    // Verifica se o código confere e se não expirou usando as variáveis equalizadas
    if ($codigoBanco !== $codigoDigitado || $agora > $user['expira_2fa']) {
        throw new Exception("Código inválido ou expirado.");
    }

    // Limpa o código usado para segurança
    $limpa = $pdo->prepare("UPDATE usuarios SET codigo_2fa = NULL, expira_2fa = NULL WHERE id = ?");
    $limpa->execute([$id]);

    echo json_encode([
        "sucesso" => true, 
        "autenticado" => true,
        "mensagem" => "Acesso autorizado com sucesso!"
    ]);

} catch (Exception $e) {
    echo json_encode(["sucesso" => false, "erro" => $e->getMessage()]);
}