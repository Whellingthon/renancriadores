<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'api_get_config.php';

$data = json_decode(file_get_contents("php://input"), true);

// Verifica se o ID foi enviado
if (!isset($data['id'])) {
    echo json_encode(["sucesso" => false, "erro" => "ID do produto não fornecido."]);
    exit;
}

try {
    // Comando SQL alinhado com os dados do seu Admin.jsx
    $sql = "UPDATE produtos SET nome = :nome, preco = :preco, imagemUrl = :imagemUrl WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    
    $stmt->execute([
        ':id'        => $data['id'],
        ':nome'      => $data['nome'],
        ':preco'     => $data['preco'],
        ':imagemUrl' => $data['imagemUrl']
    ]);

    echo json_encode(["sucesso" => true, "mensagem" => "Produto atualizado com sucesso!"]);
} catch (Exception $e) {
    // Se der erro no banco, ele devolve a mensagem exata para facilitar o debug
    echo json_encode(["sucesso" => false, "erro" => $e->getMessage()]);
}
?>