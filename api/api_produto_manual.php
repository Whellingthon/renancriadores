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

    $nome = isset($data['nome']) ? trim($data['nome']) : '';
    $preco = isset($data['preco']) ? floatval($data['preco']) : 0;
    $imagemUrl = isset($data['imagemUrl']) ? trim($data['imagemUrl']) : '';
    // 👇 Capturamos a descrição que veio do React
    $descricao = isset($data['descricao']) ? trim($data['descricao']) : '';

    if (empty($nome) || $preco <= 0) {
        throw new Exception("Nome e Preço são campos obrigatórios.");
    }

   
    $stmt = $pdo->prepare("INSERT INTO produtos (nome, preco_custo, imagemUrl, descricao, origem) VALUES (?, ?, ?, ?, 'manual')");
    $stmt->execute([$nome, $preco, $imagemUrl, $descricao]);

    echo json_encode(["sucesso" => true, "mensagem" => "Produto cadastrado com sucesso!"]);

} catch (Exception $e) {
    echo json_encode(["sucesso" => false, "erro" => $e->getMessage()]);
}
?>