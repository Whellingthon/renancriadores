<?php
// 1. Importa as configurações e a conexão PDO que já carregam o .env e os Headers
require_once 'api_get_config.php';

// Trata a pré-verificação (CORS) que o navegador faz automaticamente
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

try {
    // O $pdo já vem configurado e conectado do api_get_config.php
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Pega o JSON vindo do React
        $json = file_get_contents('php://input');
        $dados = json_decode($json, true);
        
        $margem = $dados['margem'] ?? null;

        if ($margem !== null) {
            // Prepara o SQL usando as colunas: chave e valor
            $stmt = $pdo->prepare("UPDATE configuracoes SET valor = :margem WHERE chave = 'margem_lucro'");
            $stmt->execute(['margem' => $margem]);

            echo json_encode([
                "status" => "sucesso", 
                "mensagem" => "Banco loja_viva atualizado! Margem agora é $margem%"
            ]);
        } else {
            echo json_encode(["status" => "erro", "mensagem" => "Margem não recebida."]);
        }
    }
} catch (PDOException $e) {
    // Retorno de erro técnico para o seu console do navegador
    echo json_encode(["status" => "erro", "mensagem" => "Erro no MySQL: " . $e->getMessage()]);
}