<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

require_once 'api_get_config.php';

$data = json_decode(file_get_contents("php://input"), true);

try {
    $pdo->beginTransaction();

    // 1. Salva o cliente
    $stmt = $pdo->prepare("INSERT INTO clientes (nome, whatsapp, endereco) VALUES (?, ?, ?)");
    $stmt->execute([$data['nome'], $data['whatsapp'], $data['endereco']]);
    $cliente_id = $pdo->lastInsertId();

    // 2. Salva o pedido
    $itens_json = json_encode($data['itens']);
    $stmt = $pdo->prepare("INSERT INTO pedidos (cliente_id, total, itens) VALUES (?, ?, ?)");
    $stmt->execute([$cliente_id, $data['total'], $itens_json]);

    $pdo->commit();

    // --------------------------------------------------------
    // 3. ENVIO DE E-MAIL PARA O DONO DA LOJA
    // --------------------------------------------------------
    $para = "seu_email_aqui@gmail.com"; // <-- COLOQUE SEU E-MAIL AQUI
    $assunto = "Novo Pedido - Renan Criadores";
    
    // Montando o corpo do e-mail
    $mensagem = "Olá! Você recebeu um novo pedido na loja.\n\n";
    $mensagem .= "=== DADOS DO CLIENTE ===\n";
    $mensagem .= "Nome: " . $data['nome'] . "\n";
    $mensagem .= "WhatsApp: " . $data['whatsapp'] . "\n";
    $mensagem .= "Endereço: " . $data['endereco'] . "\n\n";
    
    $mensagem .= "=== RESUMO DO PEDIDO ===\n";
    foreach ($data['itens'] as $item) {
        $mensagem .= "- " . $item['nome'] . " (" . $item['preco'] . ")\n";
    }
    
    $mensagem .= "\nTOTAL A RECEBER: R$ " . number_format((float)$data['total'], 2, ',', '.') . "\n";
    
    // Cabeçalhos para evitar que caia no Spam
    $headers = "From: sistema@renancriadores.com.br\r\n" .
               "Reply-To: " . $data['whatsapp'] . "@whatsapp.com\r\n" .
               "X-Mailer: PHP/" . phpversion();

    // O @ antes do mail silencia erros caso a VPS não tenha servidor de e-mail configurado
    @mail($para, $assunto, $mensagem, $headers);
    // --------------------------------------------------------

    echo json_encode(["sucesso" => true]);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(["sucesso" => false, "erro" => $e->getMessage()]);
}
?>