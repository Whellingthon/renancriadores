<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

require_once 'api_get_config.php';

try {
    // Busca pedidos e tenta buscar o nome do cliente na tabela 'clientes'
    // Se não houver tabela 'clientes', remova o LEFT JOIN
    $sql = "SELECT p.*, c.nome as nome_cliente 
            FROM pedidos p 
            LEFT JOIN clientes c ON p.cliente_id = c.id 
            ORDER BY p.data_pedido DESC";
            
    $stmt = $pdo->query($sql);
    $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Decodifica o JSON dos itens para ficar fácil de ler no React
    foreach ($pedidos as &$pedido) {
        $pedido['itens_detalhados'] = json_decode($pedido['itens'], true);
    }

    echo json_encode($pedidos);

} catch (Exception $e) {
    echo json_encode(["erro" => $e->getMessage()]);
}
?>