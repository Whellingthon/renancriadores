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

    $usuario = isset($data['usuario']) ? trim($data['usuario']) : '';
    $senha = isset($data['senha']) ? trim($data['senha']) : '';

    $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE usuario = ?");
    $stmt->execute([$usuario]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Valida se o usuário existe e se a senha confere
    if (!$user || !password_verify($senha, $user['senha'])) {
        throw new Exception("Usuário ou senha inválidos.");
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

    // Gera o código 2FA e define a expiração de 5 minutos
    $codigo = rand(100000, 999999);
    $expira = date('Y-m-d H:i:s', strtotime('+5 minutes'));

    $update = $pdo->prepare("UPDATE usuarios SET codigo_2fa = ?, expira_2fa = ? WHERE id = ?");
    $update->execute([$codigo, $expira, $user['id']]);

    // Puxa dinamicamente o telefone limpo do usuário logado
    $telefoneDestino = preg_replace('/[^0-9]/', '', $user['telefone']); 

    // --- DISPARO CORRETO VIA POST PARA A NOVA ROTA DA MAYA-BOT ---
    $urlMaya = "http://localhost:3000/enviar-2fa";
    $dadosEnvio = [
        "telefone" => $telefoneDestino,
        "codigo" => $codigo
    ];

   $ch = curl_init($urlMaya);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($dadosEnvio));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $respostaMaya = curl_exec($ch);
    
    // CAPTURA SE HOUVE ERRO NO CURL DO PHP
    if (curl_errno($ch)) {
        error_log("ERRO CURL PHP: " . curl_error($ch));
    } else {
        error_log("RESPOSTA MAYA VIA PHP: " . $respostaMaya);
    }
    
    curl_close($ch);

    echo json_encode([
        "sucesso" => true, 
        "exige_2fa" => true,
        "usuario_id" => $user['id'],
        "mensagem" => "Código de 6 dígitos enviado para o WhatsApp!"
    ]);

} catch (Exception $e) {
    echo json_encode(["sucesso" => false, "erro" => $e->getMessage()]);
}
?>