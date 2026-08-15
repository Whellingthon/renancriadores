<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

require_once 'api_get_config.php';

try {
    $json = file_get_contents("php://input");
    $data = json_decode($json, true);

    $usuario = isset($data['usuario']) ? trim($data['usuario']) : '';
    $senha = isset($data['senha']) ? trim($data['senha']) : '';

    if (empty($usuario) || empty($senha)) {
        http_response_code(400);
        echo json_encode(["sucesso" => false, "mensagem" => "Preencha o usuário e a senha."]);
        exit;
    }

    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE usuario = ?");
    $stmt->execute([$usuario]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Valida se o usuário existe e se a senha confere
    if (!$user || !password_verify($senha, $user['senha'])) {
        http_response_code(401);
        echo json_encode(["sucesso" => false, "mensagem" => "Usuário ou senha incorretos"]);
        exit;
    }

    // REGRA ESPECIAL: Se o usuário precisa trocar a senha no primeiro acesso
    if (isset($user['precisa_trocar_senha']) && $user['precisa_trocar_senha'] == 1) {
        echo json_encode([
            "sucesso" => true,
            "exige_nova_senha" => true,
            "usuario_id" => $user['id'],
            "mensagem" => "Por motivos de segurança, você deve cadastrar uma nova senha."
        ]);
        exit;
    }

    // --- ACESSO LIBERADO DIRETO ---
    http_response_code(200);
    echo json_encode([
        "sucesso" => true,
        "mensagem" => "Login realizado com sucesso!",
        "usuario_id" => $user['id']
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["sucesso" => false, "mensagem" => "Erro no servidor: " . $e->getMessage()]);
}
?>