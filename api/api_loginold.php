<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

// Inclui a conexão com o banco (ajuste o caminho se necessário, ex: require_once 'conexao.php')
require_once 'api_get_config.php';

try {
    // Lê o JSON enviado pelo React de forma robusta
    $json = file_get_contents("php://input");
    $data = json_decode($json, true);

    $usuario = isset($data['usuario']) ? trim($data['usuario']) : '';
    $senha = isset($data['senha']) ? trim($data['senha']) : '';

    if (empty($usuario) || empty($senha)) {
        http_response_code(400);
        echo json_encode(["sucesso" => false, "mensagem" => "Preencha o usuário e a senha."]);
        exit;
    }

    // Busca o usuário no banco
    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE usuario = ?");
    $stmt->execute([$usuario]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Valida se o usuário existe e se a senha confere com o hash do banco
    if (!$user || !password_verify($senha, $user['senha'])) {
        http_response_code(401);
        echo json_encode(["sucesso" => false, "mensagem" => "Usuário ou senha incorretos"]);
        exit;
    }
// Gera o código de 6 dígitos
    $codigo = rand(100000, 999999);
    $expira = date('Y-m-d H:i:s', strtotime('+5 minutes'));

    // Salva no banco
    $update = $pdo->prepare("UPDATE usuarios SET codigo_2fa = ?, expira_2fa = ? WHERE id = ?");
    $update->execute([$codigo, $expira, $user['id']]);

    // --- AQUI ENTRA O DISPARO DO SEU WHATSAPP ---
    $telefoneDestino = $user['telefone']; 
    $mensagem = "Seu código de acesso ao painel é: *{$codigo}*. Válido por 5 minutos.";
    
 
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