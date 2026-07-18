<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

try {
    if (!isset($_FILES['foto'])) {
        throw new Exception("Nenhum arquivo de imagem foi enviado.");
    }

    $arquivo = $_FILES['foto'];
    
    // Valida extensões permitidas
    $extensao = strtolower(pathinfo($arquivo['name'], PATHINFO_EXTENSION));
    $extensoesPermitidas = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    
    if (!in_array($extensao, $extensoesPermitidas)) {
        throw new Exception("Formato de arquivo inválido. Use JPG, PNG, WEBP ou GIF.");
    }

    // Gera um nome único para não sobrescrever arquivos com o mesmo nome
    $novoNome = uniqid('prod_', true) . '.' . $extensao;
    $destinoFisico = __DIR__ . '/../uploads/' . $novoNome;

    // Move o arquivo temporário para a pasta definitiva
    if (move_uploaded_file($arquivo['tmp_name'], $destinoFisico)) {
        // Retorna a URL pública que o React vai salvar no banco de dados
        // Exemplo: http://187.127.28.171/uploads/prod_64ee...png
        $urlPublica = "/uploads/" . $novoNome;
        
        echo json_encode([
            "success" => true,
            "url" => $urlPublica
        ]);
    } else {
        throw new Exception("Falha ao mover o arquivo para o diretório de destino.");
    }

} catch (Exception $e) {
    echo json_encode([
        "success" => false,
        "erro" => $e->getMessage()
    ]);
}
?>