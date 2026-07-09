<?php
// 1. Importa as configurações e a conexão PDO que já carregam o .env
require_once 'api_get_config.php';

try {
    // 2. Busca a margem definida no Admin (Usando o $pdo que vem do config)
    $stmtMargem = $pdo->query("SELECT valor FROM configuracoes WHERE chave = 'margem_lucro'");
    $margem = (float)$stmtMargem->fetchColumn();

    // 3. Busca os produtos que o robô salvou
    $stmtProd = $pdo->query("SELECT * FROM produtos");
    $produtos = $stmtProd->fetchAll(PDO::FETCH_ASSOC);

    $listaFinal = [];

  foreach ($produtos as $p) {
        // Cálculo da margem que você criou (Mantenha sempre!)
        $precoVenda = $p['preco_custo'] * (1 + $margem / 100);
        $listaFinal[] = [
            "id" => $p['id'],
            "nome" => $p['nome'],
            "preco" => "R$ " . number_format($precoVenda, 2, ',', '.'),
            "imagem" => $p['imagem_url'],
            "descricao" => $p['descricao'] // <-- ADICIONE ESTA LINHA
        ];
    }

    echo json_encode($listaFinal);

} catch (PDOException $e) {
    echo json_encode(["erro" => "Erro técnico: " . $e->getMessage()]);
}
?>