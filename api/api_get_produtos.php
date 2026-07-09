<?php
// 1. Importa as configurações e a conexão PDO que já carregam o .env
require_once 'api_get_config.php';

try {
        // 3. Busca os produtos que o robô salvou
    $stmtProd = $pdo->query("SELECT * FROM produtos");
    $produtos = $stmtProd->fetchAll(PDO::FETCH_ASSOC);

    $listaFinal = [];

  foreach ($produtos as $p) {
               $listaFinal[] = [
            "id" => $p['id'],
            "nome" => $p['nome'],
            "preco" => "R$ " . number_format($p['preco_custo'], 2, ',', '.'),
            "imagem" => $p['imagemUrl'],
            "descricao" => $p['descricao'] // <-- ADICIONE ESTA LINHA
        ];
    }

    echo json_encode($listaFinal);

} catch (PDOException $e) {
    echo json_encode(["erro" => "Erro técnico: " . $e->getMessage()]);
}
?>