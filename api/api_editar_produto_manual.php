<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'api_get_config.php';

$data = json_decode(file_get_contents("php://input"), true);

// Verifica se o ID chegou
if (!isset($data['id'])) {
    echo json_encode(["sucesso" => false, "erro" => "ID do produto não fornecido."]);
    exit;
}

try {
    // Transforma "R$ 25,00" ou "25,00" em "25.00" para o banco de dados
    $preco_limpo = str_replace(['R$', ' ', ','], ['', '', '.'], $data['preco']);

    // O comando SQL usando :preco_custo como apelido
    $sql = "UPDATE produtos SET nome = :nome, preco_custo = :preco_custo, imagemUrl = :imagemUrl WHERE id = :id";
    
    $stmt = $pdo->prepare($sql);
    
    // O array usando exatamente os mesmos apelidos do comando acima
    $stmt->execute([
        ':id'          => $data['id'],
        ':nome'        => $data['nome'],
        ':preco_custo' => $preco_limpo, 
        ':imagemUrl'   => $data['imagemUrl']
    ]);

    echo json_encode(["sucesso" => true, "mensagem" => "Produto atualizado com sucesso!"]);
} catch (Exception $e) {
    echo json_encode(["sucesso" => false, "erro" => $e->getMessage()]);
}
?>